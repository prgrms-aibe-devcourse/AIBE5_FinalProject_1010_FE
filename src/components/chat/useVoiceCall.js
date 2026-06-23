/**
 * @file useVoiceCall.js
 * @description 채팅방 1:1 보이스톡(WebRTC) 상태와 신호 교환을 담당합니다.
 * - STOMP는 offer/answer/ice/hangup 같은 연결 신호만 중계합니다.
 * - 실제 음성 스트림은 RTCPeerConnection을 통해 브라우저 간 P2P로 흐릅니다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sendCallSignal, subscribeRoomCalls } from '../../api/chatSocket.js'
import { VOICE_ICE_SERVERS } from '../../api/voiceConfig.js'
import { getCurrentUserId } from '../../auth/currentUser.js'

const INITIAL_CALL = {
  status: 'idle', // idle | incoming | outgoing | connecting | active
  callId: null,
  roomId: null, // 진행 중인 통화의 방 ID
  peerUserId: null,
  peerName: '',
  muted: false,
  error: null,
  startedAt: null,
}

function createCallId(roomId, userId) {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `call-${roomId}-${userId}-${random}`
}

function getOtherParticipant(room, myId) {
  const participants = room?.raw?.participants || []
  return participants.find((p) => p.userId !== myId) || participants[0] || null
}

function toIceCandidate(candidate) {
  if (!candidate) return null
  return typeof candidate.toJSON === 'function' ? candidate.toJSON() : candidate
}

export default function useVoiceCall({ rooms = [], activeRoom = null, connected }) {
  const myId = getCurrentUserId()
  const activeOtherParticipant = useMemo(
    () => getOtherParticipant(activeRoom, myId),
    [activeRoom, myId],
  )

  const [call, setCallState] = useState(INITIAL_CALL)
  const callRef = useRef(call)
  const myIdRef = useRef(myId)
  const activeRoomIdRef = useRef(activeRoom?.id)
  const activeOtherRef = useRef(activeOtherParticipant)
  
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const pendingIceRef = useRef([])
  const subscriptionsRef = useRef({})

  useEffect(() => { callRef.current = call }, [call])
  useEffect(() => { myIdRef.current = myId }, [myId])
  useEffect(() => { activeRoomIdRef.current = activeRoom?.id }, [activeRoom])
  useEffect(() => { activeOtherRef.current = activeOtherParticipant }, [activeOtherParticipant])

  const setCall = useCallback((updater) => {
    setCallState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      callRef.current = next
      return next
    })
  }, [])

  function attachRemoteStream(stream) {
    remoteStreamRef.current = stream
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream
      remoteAudioRef.current.play?.().catch(() => {})
    }
  }

  useEffect(() => {
    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current
    }
  }, [call.status])

  const publishSignal = useCallback((type, payload = {}) => {
    const current = callRef.current
    const targetRoomId = current.roomId || activeRoomIdRef.current
    return sendCallSignal(targetRoomId, {
      type,
      callId: payload.callId || current.callId,
      targetUserId: payload.targetUserId ?? current.peerUserId,
      sdp: payload.sdp || null,
      iceCandidate: payload.iceCandidate || null,
      reason: payload.reason || null,
    })
  }, [])

  async function ensureLocalStream() {
    if (localStreamRef.current) return localStreamRef.current

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('이 브라우저에서는 보이스톡을 사용할 수 없습니다.')
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    localStreamRef.current = stream
    return stream
  }

  async function flushPendingIce() {
    const pc = peerConnectionRef.current
    if (!pc || !pc.remoteDescription) return

    const pending = pendingIceRef.current
    pendingIceRef.current = []

    for (const candidate of pending) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  function createPeerConnection(callId, targetUserId) {
    if (peerConnectionRef.current) return peerConnectionRef.current

    const pc = new RTCPeerConnection({ iceServers: VOICE_ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (!event.candidate) return
      const targetRoomId = callRef.current.roomId || activeRoomIdRef.current
      sendCallSignal(targetRoomId, {
        type: 'ICE',
        callId,
        targetUserId,
        iceCandidate: toIceCandidate(event.candidate),
      })
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams || []
      if (stream) attachRemoteStream(stream)
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCall((prev) => ({ ...prev, status: 'active', startedAt: prev.startedAt || Date.now() }))
      }
      if (pc.connectionState === 'failed') {
        setCall((prev) => ({ ...prev, error: '보이스톡 연결이 실패했습니다.' }))
      }
    }

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current)
    })

    peerConnectionRef.current = pc
    return pc
  }

  const cleanupLocal = useCallback((next = INITIAL_CALL) => {
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null

    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null

    remoteStreamRef.current?.getTracks?.().forEach((track) => track.stop())
    remoteStreamRef.current = null

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }

    pendingIceRef.current = []
    setCall(next)
  }, [setCall])

  const startCall = useCallback(async () => {
    const target = activeOtherRef.current
    const targetRoomId = activeRoomIdRef.current
    if (!connected || targetRoomId == null || !target) {
      setCall((prev) => ({ ...prev, error: '보이스톡 연결 준비가 되지 않았습니다.' }))
      return
    }

    if (callRef.current.status !== 'idle') return

    const callId = createCallId(targetRoomId, myIdRef.current)
    setCall({
      status: 'outgoing',
      callId,
      roomId: targetRoomId,
      peerUserId: target.userId,
      peerName: target.name || '상대',
      muted: false,
      error: null,
      startedAt: null,
    })

    try {
      await ensureLocalStream()
      const ok = sendCallSignal(targetRoomId, {
        type: 'INVITE',
        callId,
        targetUserId: target.userId,
      })
      if (!ok) throw new Error('보이스톡 신호를 보낼 수 없습니다.')
    } catch (error) {
      cleanupLocal({ ...INITIAL_CALL, error: error?.message || '마이크 권한을 확인해주세요.' })
    }
  }, [cleanupLocal, connected, setCall])

  const acceptCall = useCallback(async () => {
    const current = callRef.current
    if (current.status !== 'incoming') return

    try {
      await ensureLocalStream()
      createPeerConnection(current.callId, current.peerUserId)
      publishSignal('ACCEPT')
      setCall((prev) => ({ ...prev, status: 'connecting', error: null }))
    } catch (error) {
      publishSignal('REJECT', { reason: 'MIC_PERMISSION_DENIED' })
      cleanupLocal({ ...INITIAL_CALL, error: error?.message || '마이크 권한을 확인해주세요.' })
    }
  }, [cleanupLocal, publishSignal, setCall])

  const rejectCall = useCallback(() => {
    const current = callRef.current
    if (current.status !== 'incoming') return
    publishSignal('REJECT', { reason: 'REJECTED' })
    cleanupLocal()
  }, [cleanupLocal, publishSignal])

  const hangUp = useCallback(() => {
    const current = callRef.current
    if (current.status !== 'idle') {
      publishSignal('HANGUP', { reason: 'HANGUP' })
    }
    cleanupLocal()
  }, [cleanupLocal, publishSignal])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    const nextMuted = !callRef.current.muted
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted
    })
    setCall((prev) => ({ ...prev, muted: nextMuted }))
  }, [setCall])

  const handleSignal = useCallback(async (signal, signalRoom) => {
    if (!signal || signal.senderId === myIdRef.current) return
    if (signal.targetUserId && signal.targetUserId !== myIdRef.current) return

    const current = callRef.current
    const otherParticipant = getOtherParticipant(signalRoom, myIdRef.current)
    const peerName = otherParticipant?.name || '상대'

    try {
      if (signal.type === 'INVITE') {
        if (current.status !== 'idle') {
          sendCallSignal(signalRoom.id, {
            type: 'REJECT',
            callId: signal.callId,
            targetUserId: signal.senderId,
            reason: 'BUSY',
          })
          return
        }

        setCall({
          status: 'incoming',
          callId: signal.callId,
          roomId: signalRoom.id,
          peerUserId: signal.senderId,
          peerName,
          muted: false,
          error: null,
          startedAt: null,
        })
        return
      }

      if (signal.callId !== current.callId) return

      if (signal.type === 'ACCEPT') {
        if (current.status !== 'outgoing') return
        await ensureLocalStream()
        const pc = createPeerConnection(current.callId, signal.senderId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        publishSignal('OFFER', {
          targetUserId: signal.senderId,
          sdp: pc.localDescription,
        })
        setCall((prev) => ({ ...prev, status: 'connecting', error: null }))
        return
      }

      if (signal.type === 'OFFER') {
        await ensureLocalStream()
        const pc = createPeerConnection(current.callId, signal.senderId)
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        await flushPendingIce()
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        publishSignal('ANSWER', {
          targetUserId: signal.senderId,
          sdp: pc.localDescription,
        })
        setCall((prev) => ({ ...prev, status: 'active', startedAt: prev.startedAt || Date.now() }))
        return
      }

      if (signal.type === 'ANSWER') {
        const pc = peerConnectionRef.current
        if (!pc || !signal.sdp) return
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        await flushPendingIce()
        setCall((prev) => ({ ...prev, status: 'active', startedAt: prev.startedAt || Date.now() }))
        return
      }

      if (signal.type === 'ICE') {
        if (!signal.iceCandidate) return
        const pc = peerConnectionRef.current
        if (!pc || !pc.remoteDescription) {
          pendingIceRef.current.push(signal.iceCandidate)
          return
        }
        await pc.addIceCandidate(new RTCIceCandidate(signal.iceCandidate))
        return
      }

      if (signal.type === 'REJECT') {
        let msg = '상대가 보이스톡을 거절했습니다.'
        if (signal.reason === 'BUSY') msg = '상대가 다른 통화 중입니다.'
        else if (signal.reason === 'MIC_PERMISSION_DENIED') msg = '상대방의 마이크 접근 권한/기기 문제로 연결이 취소되었습니다.'
        
        cleanupLocal({ ...INITIAL_CALL, error: msg })
        return
      }

      if (signal.type === 'HANGUP') {
        cleanupLocal()
      }
    } catch (error) {
      setCall((prev) => ({ ...prev, error: error?.message || '보이스톡 처리 중 오류가 발생했습니다.' }))
    }
  }, [cleanupLocal, publishSignal, setCall])

  useEffect(() => {
    if (!connected) {
      Object.values(subscriptionsRef.current).forEach(unsub => unsub())
      subscriptionsRef.current = {}
      return
    }

    rooms.forEach(room => {
      if (room.type === 'DIRECT' && !subscriptionsRef.current[room.id]) {
        subscriptionsRef.current[room.id] = subscribeRoomCalls(room.id, (signal) => {
          handleSignal(signal, room)
        })
      }
    })
  }, [connected, rooms, handleSignal])

  useEffect(() => () => cleanupLocal(), [cleanupLocal])

  return {
    ...call,
    remoteAudioRef,
    canStart: connected && activeRoomIdRef.current != null && !!activeOtherParticipant && call.status === 'idle',
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
  }
}
