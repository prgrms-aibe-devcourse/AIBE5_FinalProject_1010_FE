/**
 * @file useClassroomAudio.js
 * @description 강의실 듣기 자료(오디오) 재생 동기화 훅 (이슈 #117/#182).
 *
 * 동기화(서버 권위): 재생목록 · 현재 트랙 · 재생/위치 · 배속(0.2~3x) · AB 반복구간.
 *  - 호스트(선생님)의 제어는 WS로 "전송만" 하고, 서버 echo를 호스트·학생이 동일 적용(단일 경로 → 분기 없음).
 *  - 늦은 입장/재연결은 REST 스냅샷으로 전체 상태 복원.
 *  - AB 반복은 각 클라가 timeupdate에서 loopEnd 도달 시 loopStart로 되감아 동일 구간을 로컬 enforcement(저빈도 WS).
 *  - 자동재생 차단 시 needGesture=true → 사용자 "재생 허용" 제스처로 해제. 볼륨/배속표시는 로컬.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { connectChat, onSocketStatus, subscribeAudio, sendAudio } from '../../api/chatSocket.js'
import { fetchAudioSnapshot } from '../../api/classroomApi.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { getCurrentUserId } from '../../auth/currentUser.js'

const SEEK_TOLERANCE = 0.6
export const MIN_RATE = 0.2
export const MAX_RATE = 3.0
export const clampRate = (r) => Math.max(MIN_RATE, Math.min(MAX_RATE, Math.round((Number(r) || 1) * 100) / 100))

export function useClassroomAudio(sessionId, { isHost = false } = {}) {
  const myIdRef = useRef(getCurrentUserId())
  const elRef = useRef(null)
  const [playlist, setPlaylist] = useState([])   // [{url(절대), fileName, fileId}]
  const [track, setTrack] = useState(null)        // 현재 트랙 {url, fileName, fileId} | null
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRateState] = useState(1)
  const [loop, setLoopState] = useState({ on: false, start: 0, end: 0 })
  const [needGesture, setNeedGesture] = useState(false)
  const [volume, setVol] = useState(1)

  const desiredRef = useRef({ url: null, positionSec: 0, playing: false })
  const rateRef = useRef(1)
  const loopRef = useRef({ on: false, start: 0, end: 0 })
  const playlistRef = useRef([])
  const trackRef = useRef(null)
  useEffect(() => { rateRef.current = rate }, [rate])
  useEffect(() => { loopRef.current = loop }, [loop])
  useEffect(() => { playlistRef.current = playlist }, [playlist])
  useEffect(() => { trackRef.current = track }, [track])

  // 목표 상태를 실제 엘리먼트에 적용(메타 로드 후/제스처 후 재호출 가능).
  const applyDesired = useCallback(() => {
    const el = elRef.current
    const d = desiredRef.current
    if (!el || !d.url) return
    try { el.playbackRate = rateRef.current } catch { /* noop */ }
    if (Math.abs((el.currentTime || 0) - d.positionSec) > SEEK_TOLERANCE) {
      try { el.currentTime = d.positionSec } catch { /* 메타 전이면 무시 */ }
    }
    if (d.playing) {
      el.play().then(() => setNeedGesture(false)).catch(() => setNeedGesture(true))
    } else {
      el.pause()
    }
  }, [])

  // 오디오 엘리먼트 1회 생성 + 이벤트 배선.
  useEffect(() => {
    const el = new Audio()
    el.preload = 'auto'
    elRef.current = el
    const onTime = () => {
      const t = el.currentTime || 0
      // AB 반복: loopEnd 도달 시 loopStart로 되감기(각 클라 로컬 enforcement).
      const lp = loopRef.current
      if (lp.on && lp.end > lp.start && t >= lp.end - 0.04) {
        try { el.currentTime = lp.start } catch { /* noop */ }
        setCurrentTime(lp.start)
        return
      }
      setCurrentTime(t)
    }
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
  useEffect(() => { if (elRef.current && desiredRef.current.url) { try { elRef.current.playbackRate = rate } catch { /* noop */ } } }, [rate])

  const selectTrackLocal = useCallback((fileId) => {
    const t = playlistRef.current.find((x) => fileId != null && x.fileId === fileId)
    const el = elRef.current
    setTrack(t || null)
    desiredRef.current = { url: t?.url || null, positionSec: 0, playing: false }
    setLoopState({ on: false, start: 0, end: 0 })
    setCurrentTime(0); setDuration(0); setPlaying(false); setNeedGesture(false)
    if (el) { try { el.src = t?.url || ''; el.load() } catch { /* noop */ } }
  }, [])

  // 원격(echo 포함) 메시지 적용 — 호스트/학생 동일 경로.
  const applyMessage = useCallback((msg) => {
    if (!msg || !msg.type) return
    const el = elRef.current
    const d = desiredRef.current
    switch (msg.type) {
      case 'add': {
        const url = msg.url ? toAbsoluteFileUrl(msg.url) : null
        if (!url) break
        setPlaylist((prev) => (prev.some((t) => t.fileId === msg.fileId)
          ? prev
          : [...prev, { url, fileName: msg.fileName, fileId: msg.fileId }]))
        break
      }
      case 'select': selectTrackLocal(msg.fileId); break
      case 'removeTrack': {
        setPlaylist((prev) => prev.filter((t) => t.fileId !== msg.fileId))
        if (trackRef.current?.fileId === msg.fileId) {
          // 현재 재생 중이던 트랙이 삭제되면 정지하고 현재 트랙 해제.
          desiredRef.current = { url: null, positionSec: 0, playing: false }
          if (el) { try { el.pause(); el.removeAttribute('src'); el.load() } catch { /* noop */ } }
          setTrack(null); setPlaying(false); setCurrentTime(0); setDuration(0)
        }
        break
      }
      case 'play': d.positionSec = Math.max(0, Number(msg.positionSec) || 0); d.playing = true; applyDesired(); break
      case 'pause': d.positionSec = Math.max(0, Number(msg.positionSec) || 0); d.playing = false; applyDesired(); break
      case 'seek': d.positionSec = Math.max(0, Number(msg.positionSec) || 0); if (typeof msg.playing === 'boolean') d.playing = msg.playing; applyDesired(); break
      case 'stop':
        d.positionSec = 0; d.playing = false
        if (el) { try { el.pause(); el.currentTime = 0 } catch { /* noop */ } }
        setCurrentTime(0); setPlaying(false)
        break
      case 'rate':
        setRateState(clampRate(msg.rate))
        d.positionSec = Math.max(0, Number(msg.positionSec) || d.positionSec)
        applyDesired()
        break
      case 'loop':
        setLoopState({ on: !!msg.loopOn, start: Math.max(0, Number(msg.loopStart) || 0), end: Math.max(0, Number(msg.loopEnd) || 0) })
        break
      default: break
    }
  }, [applyDesired, selectTrackLocal])

  // 입장/재연결 스냅샷 적용.
  const applySnapshot = useCallback((snap) => {
    if (!snap) return
    const list = Array.isArray(snap.playlist)
      ? snap.playlist.filter((t) => t?.url).map((t) => ({ url: toAbsoluteFileUrl(t.url), fileName: t.fileName, fileId: t.fileId }))
      : []
    setPlaylist(list)
    playlistRef.current = list
    setRateState(clampRate(snap.rate))
    setLoopState({ on: !!snap.loopOn, start: Math.max(0, Number(snap.loopStart) || 0), end: Math.max(0, Number(snap.loopEnd) || 0) })
    if (!snap.url) {
      setTrack(null); desiredRef.current = { url: null, positionSec: 0, playing: false }
      return
    }
    const url = toAbsoluteFileUrl(snap.url)
    setTrack({ url, fileName: snap.fileName, fileId: snap.fileId })
    desiredRef.current = { url, positionSec: Math.max(0, Number(snap.positionSec) || 0), playing: !!snap.playing }
    const el = elRef.current
    if (el) { try { el.src = url; el.load() } catch { /* noop */ } }
    applyDesired()
  }, [applyDesired])

  // 연결 + 구독 + 스냅샷(재연결 시 재구독).
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
  const addTrack = useCallback((t) => { if (isHost && t?.url) sendAudio(sessionId, { type: 'add', url: t.url, fileName: t.fileName, fileId: t.fileId }) }, [isHost, sessionId])
  const selectTrack = useCallback((fileId) => { if (isHost && fileId != null) sendAudio(sessionId, { type: 'select', fileId }) }, [isHost, sessionId])
  const removeTrack = useCallback((fileId) => { if (isHost && fileId != null) sendAudio(sessionId, { type: 'removeTrack', fileId }) }, [isHost, sessionId])
  /** 업로드 직후: 목록에 추가 + 곧바로 선택(현재 트랙으로). */
  const addAndSelect = useCallback((t) => {
    if (!isHost || !t?.url) return
    sendAudio(sessionId, { type: 'add', url: t.url, fileName: t.fileName, fileId: t.fileId })
    sendAudio(sessionId, { type: 'select', fileId: t.fileId })
  }, [isHost, sessionId])
  const play = useCallback(() => { if (isHost) sendAudio(sessionId, { type: 'play', positionSec: elRef.current?.currentTime || desiredRef.current.positionSec || 0 }) }, [isHost, sessionId])
  const pause = useCallback(() => { if (isHost) sendAudio(sessionId, { type: 'pause', positionSec: elRef.current?.currentTime || 0 }) }, [isHost, sessionId])
  const seek = useCallback((t) => { if (isHost) sendAudio(sessionId, { type: 'seek', positionSec: Math.max(0, Number(t) || 0), playing: desiredRef.current.playing }) }, [isHost, sessionId])
  const stop = useCallback(() => { if (isHost) sendAudio(sessionId, { type: 'stop' }) }, [isHost, sessionId])
  const changeRate = useCallback((r) => { if (isHost) sendAudio(sessionId, { type: 'rate', rate: clampRate(r), positionSec: elRef.current?.currentTime || 0 }) }, [isHost, sessionId])
  const setLoopRegion = useCallback((on, start, end) => { if (isHost) sendAudio(sessionId, { type: 'loop', loopOn: !!on, loopStart: Math.max(0, Number(start) || 0), loopEnd: Math.max(0, Number(end) || 0) }) }, [isHost, sessionId])

  const allowPlayback = useCallback(() => { setNeedGesture(false); applyDesired() }, [applyDesired])
  const setVolume = useCallback((v) => setVol(Math.max(0, Math.min(1, Number(v) || 0))), [])

  return {
    playlist, track, playing, currentTime, duration, rate, loop, needGesture, volume,
    addTrack, selectTrack, removeTrack, addAndSelect,
    play, pause, seek, stop, changeRate, setLoopRegion,
    allowPlayback, setVolume,
  }
}
