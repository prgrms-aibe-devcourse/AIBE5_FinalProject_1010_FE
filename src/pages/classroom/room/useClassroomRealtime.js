/**
 * @file room/useClassroomRealtime.js
 * @description 강의실 실시간 로직 묶음:
 *  - 호스트 하트비트(부재 자동종료 타이머 리셋)
 *  - 종료 이벤트 구독(→ 안내 오버레이 ended + 자동 퇴장) + 리액션 구독(pushReaction)
 *  - 판서 권한 실시간 수신(내 myCanDraw + roster 갱신) / 선생님 roster 로딩 / 학생 판서 토글
 *  - 강의 진행 경과시간(elapsed)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { sendHeartbeat, fetchSessionParticipants, updateParticipantPermissions } from '../../../api/classroomApi.js'
import { connectChat, onSocketStatus, subscribeClassroomEvents, subscribeReactions, subscribeClassroomPermissions } from '../../../api/chatSocket.js'

export function useClassroomRealtime({ sessionId, isTeacher, myId, participant, startedAt, mediaTiles, onLeave, pushReaction }) {
  const [myCanDraw, setMyCanDraw] = useState(participant?.canDraw ?? false)
  const [roster, setRoster] = useState({})
  const [ended, setEnded] = useState(null)
  const [elapsed, setElapsed] = useState('0:00:00')
  const rosterRef = useRef(roster)
  const onLeaveRef = useRef(onLeave)
  const pushReactionRef = useRef(pushReaction)
  useEffect(() => { rosterRef.current = roster }, [roster])
  useEffect(() => { onLeaveRef.current = onLeave })
  useEffect(() => { pushReactionRef.current = pushReaction })
  useEffect(() => { setMyCanDraw(participant?.canDraw ?? false) }, [participant])

  const toggleStudentDraw = useCallback(async (userId) => {
    const key = String(userId)
    const p = rosterRef.current[key]
    if (!p) return
    const next = !p.canDraw
    setRoster((r) => ({ ...r, [key]: { ...p, canDraw: next } })) // 낙관적 갱신
    try {
      await updateParticipantPermissions(p.participantId, { canDraw: next, canShareScreen: p.canShareScreen, canChat: p.canChat })
    } catch {
      setRoster((r) => ({ ...r, [key]: { ...p } })) // 실패 시 롤백
    }
  }, [])

  // 강의 진행 경과시간 — startedAt부터 매초 갱신.
  useEffect(() => {
    if (!startedAt) return undefined
    const start = new Date(startedAt).getTime()
    const tick = () => {
      let s = Math.max(0, Math.floor((Date.now() - start) / 1000))
      const h = Math.floor(s / 3600); s %= 3600
      const m = Math.floor(s / 60); const sec = s % 60
      setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  // 호스트 하트비트 — 선생님이 강의실에 있는 동안 30초마다 "나 있음" 전송.
  useEffect(() => {
    if (sessionId == null || !isTeacher) return undefined
    let cancelled = false
    const ping = () => {
      sendHeartbeat(sessionId)
        .then((r) => { if (!cancelled && r?.status === 'CLOSED') onLeaveRef.current?.() })
        .catch(() => {})
    }
    ping()
    const id = setInterval(ping, 30000)
    return () => { cancelled = true; clearInterval(id) }
  }, [sessionId, isTeacher])

  // 종료 이벤트 + 리액션 구독 — 종료 시 안내 오버레이 후 자동 퇴장, 리액션 수신 시 떠오르는 오버레이.
  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false, unsubEvents = () => {}, unsubReactions = () => {}
    const onEvent = (e) => {
      if (cancelled || e?.type !== 'closed') return
      // 선생님(호스트)은 handleClose로 직접 종료·이동하므로, 자기 종료 echo로는 오버레이/지연퇴장을 띄우지 않는다.
      // (이미 navigate된 뒤 언마운트 컴포넌트에서 setEnded/이중 navigate 되는 것 방지 — 리뷰 반영)
      if (isTeacher) return
      setEnded(e.reason === 'host-absent'
        ? '선생님 연결이 끊겨 강의실이 자동으로 종료되었습니다.'
        : '선생님이 수업을 종료했습니다.')
      setTimeout(() => onLeaveRef.current?.(), 2200)
    }
    const resub = () => {
      if (cancelled) return
      unsubEvents(); unsubEvents = subscribeClassroomEvents(sessionId, onEvent)
      unsubReactions(); unsubReactions = subscribeReactions(sessionId, (msg) => { if (!cancelled) pushReactionRef.current?.(msg) })
    }
    const off = onSocketStatus((s) => { if (s === 'connected') resub() })
    connectChat().then(resub).catch(() => {})
    return () => { cancelled = true; unsubEvents(); unsubReactions(); off() }
  }, [sessionId, isTeacher])

  // 선생님: 참가자 roster 로딩 — 입장 시 1회 + roster에 없는 새 참가자 타일이 생겼을 때만 재조회.
  useEffect(() => {
    if (!isTeacher || sessionId == null) return undefined
    const hasNew = (mediaTiles || []).some((t) => !(String(t.identity).replace(/^user-/, '') in rosterRef.current))
    if (!hasNew && Object.keys(rosterRef.current).length > 0) return undefined
    let cancelled = false
    fetchSessionParticipants(sessionId)
      .then((list) => {
        if (cancelled) return
        const m = {}
        list.forEach((p) => { m[String(p.userId)] = p })
        setRoster(m)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isTeacher, sessionId, mediaTiles?.length])

  // 판서 권한 변경 실시간 수신 — 내 권한(myCanDraw) + roster 갱신.
  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false, unsub = () => {}
    const onPerm = (msg) => {
      if (cancelled || !msg) return
      if (String(msg.userId) === String(myId)) setMyCanDraw(!!msg.canDraw)
      setRoster((r) => ({
        ...r,
        [String(msg.userId)]: {
          ...(r[String(msg.userId)] || {}),
          participantId: msg.participantId, userId: msg.userId,
          canDraw: !!msg.canDraw, canShareScreen: !!msg.canShareScreen, canChat: !!msg.canChat,
        },
      }))
    }
    const resub = () => { if (cancelled) return; unsub(); unsub = subscribeClassroomPermissions(sessionId, onPerm) }
    const off = onSocketStatus((s) => { if (s === 'connected') resub() })
    connectChat().then(resub).catch(() => {})
    return () => { cancelled = true; unsub(); off() }
  }, [sessionId, myId])

  return { myCanDraw, roster, toggleStudentDraw, elapsed, ended }
}
