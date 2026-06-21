/**
 * @file useClassroomAudio.js
 * @description 강의실 듣기 자료(오디오) 재생 동기화 훅 (이슈 #117/#182).
 *
 * - 오디오 엘리먼트를 훅이 직접 소유(new Audio())하고 재생을 제어한다(DOM에 붙이지 않아도 재생됨).
 * - 동기화는 서버 권위 방식: 선생님(호스트)의 제어는 WS로 "전송만" 하고, 서버가 되돌려준 이벤트(echo)를
 *   호스트·학생이 동일하게 적용한다 → 단일 경로라 화면이 분기하지 않는다.
 * - 늦게 입장/재연결 시 REST 스냅샷으로 현재 트랙·재생여부·위치를 복원한다.
 * - 브라우저 자동재생 제한: 학생 브라우저에서 play()가 거부되면 needGesture=true → "재생 허용" 클릭 유도.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { connectChat, onSocketStatus, subscribeAudio, sendAudio } from '../../api/chatSocket.js'
import { fetchAudioSnapshot } from '../../api/classroomApi.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { getCurrentUserId } from '../../auth/currentUser.js'

const SEEK_TOLERANCE = 0.6 // 이 차이 이상일 때만 currentTime 보정(미세 떨림 방지)

export function useClassroomAudio(sessionId, { isHost = false } = {}) {
  const myIdRef = useRef(getCurrentUserId())
  const elRef = useRef(null)
  const [track, setTrack] = useState(null)      // { url(절대), fileName, fileId } | null
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [needGesture, setNeedGesture] = useState(false)
  const [volume, setVol] = useState(1)
  // 원격이 지시한 "목표 상태". 메타데이터 로드 전이면 보류했다가 loadedmetadata에서 재적용한다.
  const desiredRef = useRef({ url: null, positionSec: 0, playing: false })

  // 목표 상태를 실제 엘리먼트에 적용(메타 로드 후/제스처 후에도 재호출 가능).
  const applyDesired = useCallback(() => {
    const el = elRef.current
    const d = desiredRef.current
    if (!el || !d.url) return
    if (Math.abs((el.currentTime || 0) - d.positionSec) > SEEK_TOLERANCE) {
      try { el.currentTime = d.positionSec } catch { /* 메타 전이면 무시 — 이후 재적용 */ }
    }
    if (d.playing) {
      el.play().then(() => setNeedGesture(false)).catch(() => setNeedGesture(true)) // 자동재생 차단 → 제스처 필요
    } else {
      el.pause()
    }
  }, [])

  // 오디오 엘리먼트 1회 생성 + 이벤트 배선.
  useEffect(() => {
    const el = new Audio()
    el.preload = 'auto'
    elRef.current = el
    const onTime = () => setCurrentTime(el.currentTime || 0)
    const onMeta = () => { setDuration(Number.isFinite(el.duration) ? el.duration : 0); applyDesired() }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('canplay', onMeta)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('canplay', onMeta)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      try { el.pause(); el.removeAttribute('src'); el.load() } catch { /* noop */ }
      elRef.current = null
    }
  }, [applyDesired])

  useEffect(() => { if (elRef.current) elRef.current.volume = volume }, [volume])

  // 원격(echo 포함) 메시지 적용 — 호스트/학생 동일 경로.
  const applyMessage = useCallback((msg) => {
    if (!msg || !msg.type) return
    const el = elRef.current
    const d = desiredRef.current
    if (msg.type === 'load') {
      const url = msg.url ? toAbsoluteFileUrl(msg.url) : null
      setTrack(url ? { url, fileName: msg.fileName, fileId: msg.fileId } : null)
      desiredRef.current = { url, positionSec: 0, playing: false }
      if (el) { try { el.src = url || ''; el.load() } catch { /* noop */ } }
      setCurrentTime(0); setPlaying(false); setNeedGesture(false)
      return
    }
    const pos = Math.max(0, Number(msg.positionSec) || 0)
    if (msg.type === 'play') { d.positionSec = pos; d.playing = true; applyDesired() }
    else if (msg.type === 'pause') { d.positionSec = pos; d.playing = false; applyDesired() }
    else if (msg.type === 'seek') { d.positionSec = pos; if (typeof msg.playing === 'boolean') d.playing = msg.playing; applyDesired() }
    else if (msg.type === 'stop') {
      d.positionSec = 0; d.playing = false
      if (el) { try { el.pause(); el.currentTime = 0 } catch { /* noop */ } }
      setCurrentTime(0); setPlaying(false)
    }
  }, [applyDesired])

  // 입장/재연결 스냅샷 적용.
  const applySnapshot = useCallback((snap) => {
    if (!snap || !snap.url) {
      setTrack(null); desiredRef.current = { url: null, positionSec: 0, playing: false }
      return
    }
    const url = toAbsoluteFileUrl(snap.url)
    setTrack({ url, fileName: snap.fileName, fileId: snap.fileId })
    desiredRef.current = { url, positionSec: Math.max(0, Number(snap.positionSec) || 0), playing: !!snap.playing }
    const el = elRef.current
    if (el) { try { el.src = url; el.load() } catch { /* noop */ } }
    applyDesired() // 메타 로드되면 loadedmetadata→applyDesired가 다시 정확히 맞춘다
  }, [applyDesired])

  // 연결 + 구독 + 스냅샷 (재연결 시 재구독). 화이트보드 동기화와 동일한 패턴.
  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false
    let unsub = () => {}
    const onConn = () => {
      if (cancelled) return
      unsub(); unsub = subscribeAudio(sessionId, applyMessage)
      fetchAudioSnapshot(sessionId).then((res) => { if (!cancelled) applySnapshot(res?.audio) }).catch(() => {})
    }
    const off = onSocketStatus((s) => { if (s === 'connected') onConn() })
    connectChat().then(onConn).catch(() => {})
    return () => { cancelled = true; unsub(); off() }
  }, [sessionId, applyMessage, applySnapshot])

  // ───────────── 호스트 제어(전송만 — echo로 전원 동일 적용) ─────────────
  const loadTrack = useCallback((t) => {
    if (!isHost || !t?.url) return
    sendAudio(sessionId, { type: 'load', url: t.url, fileName: t.fileName, fileId: t.fileId })
  }, [isHost, sessionId])
  const play = useCallback(() => {
    if (!isHost) return
    sendAudio(sessionId, { type: 'play', positionSec: elRef.current?.currentTime || desiredRef.current.positionSec || 0 })
  }, [isHost, sessionId])
  const pause = useCallback(() => {
    if (!isHost) return
    sendAudio(sessionId, { type: 'pause', positionSec: elRef.current?.currentTime || 0 })
  }, [isHost, sessionId])
  const seek = useCallback((t) => {
    if (!isHost) return
    sendAudio(sessionId, { type: 'seek', positionSec: Math.max(0, Number(t) || 0), playing: desiredRef.current.playing })
  }, [isHost, sessionId])
  const stop = useCallback(() => {
    if (!isHost) return
    sendAudio(sessionId, { type: 'stop' })
  }, [isHost, sessionId])

  // 자동재생 차단 해제(사용자 제스처). 학생이 "재생 허용"을 누르면 호출.
  const allowPlayback = useCallback(() => { setNeedGesture(false); applyDesired() }, [applyDesired])
  const setVolume = useCallback((v) => setVol(Math.max(0, Math.min(1, Number(v) || 0))), [])

  return {
    track, playing, currentTime, duration, needGesture, volume,
    loadTrack, play, pause, seek, stop, allowPlayback, setVolume,
  }
}
