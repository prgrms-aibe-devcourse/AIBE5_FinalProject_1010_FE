/**
 * @file usePreviewRoom.js
 * @description 비로그인 포함 "강의실 미리보기" 전용 LiveKit 연결 훅(보기 전용).
 * - BE 미리보기 토큰(canPublish=false, TTL 60초)으로 멤버와 같은 룸에 입장한다.
 * - autoSubscribe=false로 연결한 뒤 화면공유(영상)와 마이크(음성)만 선택 구독한다.
 *   카메라 트랙은 절대 구독/렌더링하지 않는다(선생님·학생 얼굴 비노출 요구사항).
 * - previewSeconds 카운트다운이 0이 되면 room.disconnect() 후 status='expired'.
 */
import { useEffect, useReducer, useRef, useState } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
import { issuePreviewToken } from '../../api/classroomApi.js'

// 미리보기에서 구독을 허용할 트랙 소스 — 화면공유 영상/오디오 + 마이크 음성. 카메라는 제외.
const ALLOWED_SOURCES = new Set([
  Track.Source.ScreenShare,
  Track.Source.ScreenShareAudio,
  Track.Source.Microphone,
])

/**
 * @param {number|null} sessionId 강의실 세션 id (null이면 연결 안 함)
 * @returns {{status:string, error:Error|null, screenTrack:object|null, audioTracks:object[], secondsLeft:number|null, audioBlocked:boolean, resumeAudio:Function}}
 *   status: idle | connecting | connected | expired | disconnected | error
 */
export function usePreviewRoom(sessionId) {
  const roomRef = useRef(null)
  const expiredRef = useRef(false)
  const [, bump] = useReducer((x) => (x + 1) % 1e9, 0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [audioBlocked, setAudioBlocked] = useState(false)

  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false
    let timer = null
    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room

    // 허용 소스(화면공유/마이크)만 구독, 카메라는 구독 해제 — 데이터 자체를 받지 않는다.
    const applySubscriptions = (participant) => {
      participant.trackPublications.forEach((pub) => {
        const allowed = ALLOWED_SOURCES.has(pub.source)
        try { pub.setSubscribed(allowed) } catch { /* noop */ }
      })
    }

    const onChange = () => { if (!cancelled) bump() }
    room
      .on(RoomEvent.ParticipantConnected, (p) => { applySubscriptions(p); onChange() })
      .on(RoomEvent.ParticipantDisconnected, onChange)
      .on(RoomEvent.TrackPublished, (_pub, p) => { applySubscriptions(p); onChange() })
      .on(RoomEvent.TrackUnpublished, onChange)
      .on(RoomEvent.TrackSubscribed, onChange)
      .on(RoomEvent.TrackUnsubscribed, onChange)
      .on(RoomEvent.TrackMuted, onChange)
      .on(RoomEvent.TrackUnmuted, onChange)
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!cancelled) setAudioBlocked(!room.canPlaybackAudio)
      })
      .on(RoomEvent.Disconnected, () => {
        if (!cancelled && !expiredRef.current) setStatus('disconnected')
      })

    ;(async () => {
      try {
        setStatus('connecting')
        const t = await issuePreviewToken(sessionId) // { livekitUrl, token, previewSeconds }
        if (cancelled) return
        // autoSubscribe=false: 기본 자동 구독을 끄고 화면공유/마이크만 직접 구독한다.
        await room.connect(t.livekitUrl, t.token, { autoSubscribe: false })
        if (cancelled) { room.disconnect(); return }
        room.remoteParticipants.forEach(applySubscriptions)
        setStatus('connected')
        setAudioBlocked(!room.canPlaybackAudio)
        bump()

        // 미리보기 카운트다운 — 0이 되면 자동 종료(FE 방어선, 토큰 TTL이 서버 방어선)
        let left = t.previewSeconds || 60
        setSecondsLeft(left)
        timer = setInterval(() => {
          left -= 1
          if (left <= 0) {
            clearInterval(timer)
            timer = null
            expiredRef.current = true
            setSecondsLeft(0)
            setStatus('expired')
            room.disconnect()
          } else {
            setSecondsLeft(left)
          }
        }, 1000)
      } catch (e) {
        if (!cancelled) { setError(e); setStatus('error') }
        console.error('[preview] 연결 실패:', e)
      }
    })()

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      room.removeAllListeners()
      room.disconnect()
      roomRef.current = null
    }
  }, [sessionId])

  const resumeAudio = async () => {
    try { await roomRef.current?.startAudio(); setAudioBlocked(false) } catch (e) { console.warn('[preview] 오디오 재개 실패', e) }
  }

  // 구독된 화면공유 영상 1개 + 모든 음성 트랙 추출(매 렌더). 카메라는 구독하지 않으므로 등장하지 않는다.
  let screenTrack = null
  const audioTracks = []
  const room = roomRef.current
  if (room) {
    room.remoteParticipants.forEach((p) => {
      p.trackPublications.forEach((pub) => {
        const track = pub.track
        if (!track || !pub.isSubscribed) return
        if (pub.source === Track.Source.ScreenShare && !screenTrack) screenTrack = track
        else if (pub.source === Track.Source.Microphone || pub.source === Track.Source.ScreenShareAudio) audioTracks.push(track)
      })
    })
  }

  return { status, error, screenTrack, audioTracks, secondsLeft, audioBlocked, resumeAudio }
}
