/**
 * @file useLiveKitRoom.js
 * @description 강의실 실시간 화상(LiveKit) 연결 훅.
 * - BE에서 입장 토큰을 받아(issueLivekitToken) LiveKit 서버(SFU)에 접속한다.
 * - 송출 권한(canPublish)이 있으면 카메라·마이크를 publish, 없으면 시청만 한다.
 * - 참가자/트랙 변화를 구독해 화면을 갱신하고, 마이크/카메라/화면공유 토글을 제공한다.
 *
 * LiveKit = SFU: 각자 자기 트랙을 서버로 한 번 올리면(publish) 서버가 나머지에게 나눠준다(subscribe).
 * 누가·어느 방·송출 가능 여부는 BE가 발급한 토큰에 박혀 있다(권한은 서버가 최종 판정).
 */
import { useEffect, useReducer, useRef, useState, useCallback } from 'react'
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client'
import { issueLivekitToken } from '../../api/classroomApi.js'

/**
 * @param {number|null} sessionId 강의실 세션 id (null이면 연결 안 함)
 * @param {{canPublish?: boolean}} opts canPublish=true면 입장 직후 카메라/마이크 송출 시도
 */
export function useLiveKitRoom(sessionId, { canPublish = false } = {}) {
  const roomRef = useRef(null)
  const [, bump] = useReducer((x) => (x + 1) % 1e9, 0) // 트랙/참가자 변화 시 강제 리렌더
  const [status, setStatus] = useState('idle')          // idle | connecting | connected | disconnected | error
  const [error, setError] = useState(null)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareBlocked, setShareBlocked] = useState(false)  // 다른 사람이 공유 중이라 내 공유가 막힘(안내용)
  const [audioBlocked, setAudioBlocked] = useState(false) // 브라우저 자동재생 차단 여부

  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      // 카메라는 360p로 가볍게(상대가 뭐 하는지 확인 정도) — 비용/대역폭 절감.
      videoCaptureDefaults: { resolution: VideoPresets.h360.resolution },
      publishDefaults: {
        simulcast: true,
        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
        screenShareEncoding: VideoPresets.h720.encoding, // 화면공유는 720p 상한(텍스트 선명)
      },
    })
    roomRef.current = room

    const onChange = () => { if (!cancelled) bump() }
    room
      .on(RoomEvent.ParticipantConnected, onChange)
      .on(RoomEvent.ParticipantDisconnected, onChange)
      .on(RoomEvent.TrackSubscribed, onChange)
      .on(RoomEvent.TrackUnsubscribed, onChange)
      .on(RoomEvent.LocalTrackPublished, onChange)
      .on(RoomEvent.LocalTrackUnpublished, onChange)
      .on(RoomEvent.TrackMuted, onChange)
      .on(RoomEvent.TrackUnmuted, onChange)
      .on(RoomEvent.ActiveSpeakersChanged, onChange)
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!cancelled) setAudioBlocked(!room.canPlaybackAudio)
      })
      .on(RoomEvent.Disconnected, () => { if (!cancelled) setStatus('disconnected') })

    ;(async () => {
      try {
        setStatus('connecting')
        const t = await issueLivekitToken(sessionId) // { livekitUrl, token, ... }
        if (cancelled) return
        await room.connect(t.livekitUrl, t.token)
        if (cancelled) { room.disconnect(); return }
        setStatus('connected')
        // 송출 권한이 있으면 카메라/마이크 켜기(실패 시 시청자로 강등 — 권한은 서버가 최종 판정)
        if (canPublish) {
          try {
            await room.localParticipant.setMicrophoneEnabled(true)
            await room.localParticipant.setCameraEnabled(true)
            if (!cancelled) { setMicOn(true); setCamOn(true) }
          } catch (e) {
            console.warn('[livekit] 송출 시작 실패(권한/장치 확인):', e)
          }
        }
        setAudioBlocked(!room.canPlaybackAudio)
        bump()
      } catch (e) {
        if (!cancelled) { setError(e); setStatus('error') }
        console.error('[livekit] 연결 실패:', e)
      }
    })()

    return () => {
      cancelled = true
      room.removeAllListeners()
      room.disconnect()
      roomRef.current = null
    }
  }, [sessionId, canPublish])

  const toggleMic = useCallback(async () => {
    const lp = roomRef.current?.localParticipant
    if (!lp) return
    const next = !lp.isMicrophoneEnabled
    try { await lp.setMicrophoneEnabled(next); setMicOn(next) } catch (e) { console.warn('[livekit] 마이크 토글 실패', e) }
  }, [])

  const toggleCam = useCallback(async () => {
    const lp = roomRef.current?.localParticipant
    if (!lp) return
    const next = !lp.isCameraEnabled
    try { await lp.setCameraEnabled(next); setCamOn(next) } catch (e) { console.warn('[livekit] 카메라 토글 실패', e) }
  }, [])

  const toggleShare = useCallback(async () => {
    const room = roomRef.current
    const lp = room?.localParticipant
    if (!lp) return
    const next = !lp.isScreenShareEnabled
    // 동시에 한 명만 — 시작하려는데 이미 다른 참가자가 공유 중이면 막는다(best-effort).
    if (next) {
      let othersSharing = false
      room.remoteParticipants.forEach((p) => { if (p.getTrackPublication(Track.Source.ScreenShare)?.track) othersSharing = true })
      if (othersSharing) { setShareBlocked(true); return }
    }
    try {
      await lp.setScreenShareEnabled(next, next ? { resolution: VideoPresets.h720.resolution, contentHint: 'detail' } : undefined)
      setSharing(next)
    } catch (e) { console.warn('[livekit] 화면공유 토글 실패', e) }
  }, [])

  const clearShareBlocked = useCallback(() => setShareBlocked(false), [])

  // 브라우저 자동재생 차단 시, 사용자 클릭으로 오디오 재생을 푼다.
  const resumeAudio = useCallback(async () => {
    try { await roomRef.current?.startAudio(); setAudioBlocked(false) } catch (e) { console.warn('[livekit] 오디오 재개 실패', e) }
  }, [])

  // 참가자별 타일 데이터 계산(매 렌더). 트랙은 컴포넌트에서 attach 한다.
  const room = roomRef.current
  const tiles = []
  if (room) {
    const toTile = (p, isLocal) => {
      const camPub = p.getTrackPublication(Track.Source.Camera)
      const micPub = p.getTrackPublication(Track.Source.Microphone)
      const screenPub = p.getTrackPublication(Track.Source.ScreenShare)
      return {
        identity: p.identity,
        name: p.name || p.identity,
        isLocal,
        speaking: p.isSpeaking,
        micEnabled: p.isMicrophoneEnabled,
        camTrack: camPub?.videoTrack ?? null,
        micTrack: isLocal ? null : (micPub?.audioTrack ?? null), // 내 오디오는 attach 안 함(에코 방지)
        screenTrack: screenPub?.videoTrack ?? null,
      }
    }
    tiles.push(toTile(room.localParticipant, true))
    room.remoteParticipants.forEach((p) => tiles.push(toTile(p, false)))
  }

  // 현재 화면공유 중인 "한 명"을 찾는다(로컬 우선). 동시에 한 명만 공유하도록 제어하므로 보통 0~1명.
  let screenShare = null
  if (room) {
    const scan = (p, isLocal) => {
      if (screenShare) return
      const sp = p.getTrackPublication(Track.Source.ScreenShare)
      if (sp?.track) screenShare = { track: sp.track, name: p.name || p.identity, identity: p.identity, isLocal }
    }
    scan(room.localParticipant, true)
    room.remoteParticipants.forEach((p) => scan(p, false))
  }
  // 다른 사람이 공유 중이면 내 공유 버튼을 잠근다.
  const shareLockedByOther = !!(screenShare && !screenShare.isLocal)

  return {
    status, error, tiles,
    micOn, camOn, sharing, canPublish,
    screenShare, shareLockedByOther, shareBlocked, clearShareBlocked,
    audioBlocked, resumeAudio,
    toggleMic, toggleCam, toggleShare,
  }
}
