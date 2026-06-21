/**
 * @file ClassroomPage.jsx
 * @description StudyFlow Soft Amber Studio - 실시간 강의실 메인 (컨트롤러 + 레이아웃)
 * - URL: /classroom/:courseId. 진입 시 현재 강의실 세션을 조회해 입장 흐름을 게이팅한다.
 *   · 열린 세션 있음 → 자동 참가(join) 후 강의실(room) 진입
 *   · 열린 세션 없음 → 선생님은 "강의실 열기" 로비, 학생은 "대기" 로비
 *   · 멤버 아님(403) → 안내 화면
 * - 실제 멤버십·소유권 검증은 백엔드가 수행한다(여기선 UX 게이팅만).
 * - 영상(LiveKit)·채팅 실연동은 후속 단계(B/A-3)에서 붙인다. 지금은 레이아웃과 입장/종료 흐름까지.
 */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Whiteboard from './Whiteboard.jsx'
import ChatSidebar from './ChatSidebar.jsx'
import BottomControls from './BottomControls.jsx'
import VideoTile from './VideoTile.jsx'
import ScreenShareView from './ScreenShareView.jsx'
import FocusedVideoView from './FocusedVideoView.jsx'
import { useLiveKitRoom } from './useLiveKitRoom.js'
import { useClassroomAudio } from './useClassroomAudio.js'
import ClassroomAudioPlayer from './ClassroomAudioPlayer.jsx'
import { uploadClassroomAudio } from '../../api/fileApi.js'
import { getCurrentSession, openClassroom, joinSession, closeSession, sendHeartbeat, fetchSessionParticipants, updateParticipantPermissions } from '../../api/classroomApi.js'
import { connectChat, onSocketStatus, subscribeClassroomEvents, sendReaction, subscribeReactions, subscribeClassroomPermissions } from '../../api/chatSocket.js'
import { fetchCourseDetail } from '../../api/courseApi.js'
import { createCourseProgress } from '../../api/courseProgressApi.js'
import { getCurrentUserId, getCurrentUserRole } from '../../auth/currentUser.js'

export default function ClassroomPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const myId = getCurrentUserId()
  const role = getCurrentUserRole() // STUDENT / TEACHER / ADMIN / null
  const isTeacher = role === 'TEACHER' || role === 'ADMIN'

  // phase: loading | lobby | room | denied | error
  const [phase, setPhase] = useState('loading')
  const [session, setSession] = useState(null)       // 현재 강의실 세션
  const [participant, setParticipant] = useState(null) // 내 참가 정보(권한 포함)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseOwnerId, setCourseOwnerId] = useState(null) // 담당 선생님 userId
  const [busy, setBusy] = useState(false)            // 열기/입장 중복 클릭 방지
  const [message, setMessage] = useState('')

  // 언마운트 후 setState 방지용 가드 (loadSession/handleOpen이 effect 밖에서도 호출되므로 ref로 둔다)
  // StrictMode(dev)는 마운트→언마운트→재마운트를 하므로, 재마운트 때 반드시 true로 되돌려야
  // loadSession의 await-후 가드가 영구히 막혀 "입장 중..."에서 멈추는 일을 방지한다.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // 담당 선생님인지: 수업 소유자 id와 내 id 비교. 소유자 정보를 아직 모르면(로드 전/실패) 역할로 폴백.
  const isOwner = courseOwnerId != null && myId != null
    ? courseOwnerId === myId
    : isTeacher

  /* 세션 조회 + (있으면) 자동 참가 */
  const loadSession = useCallback(async () => {
    if (mountedRef.current) setPhase('loading')
    try {
      const current = await getCurrentSession(courseId)
      if (!mountedRef.current) return
      if (!current) {
        // 열린 강의실 없음 → 로비
        setSession(null)
        setPhase('lobby')
        return
      }
      // 열린 강의실 있음 → 참가 등록 후 입장
      const me = await joinSession(current.sessionId)
      if (!mountedRef.current) return
      setSession(current)
      setParticipant(me)
      setPhase('room')
    } catch (err) {
      if (!mountedRef.current) return
      if (err.status === 403) {
        setMessage('이 수업의 멤버만 강의실에 입장할 수 있어요.')
        setPhase('denied')
      } else if (err.status === 401) {
        setMessage('로그인이 필요해요.')
        setPhase('denied')
      } else {
        setMessage(err.message || '강의실 정보를 불러오지 못했어요.')
        setPhase('error')
      }
    }
  }, [courseId])

  useEffect(() => {
    // 수업 제목(헤더) + 담당 선생님 판별용 소유자 id
    fetchCourseDetail(courseId)
      .then((c) => {
        if (!mountedRef.current) return
        setCourseTitle(c?.title || '')
        setCourseOwnerId(c?.teacher?.userId ?? null)
      })
      .catch(() => {})
    loadSession()
  }, [courseId, loadSession])

  /* 페이지 진입 시 body에 전용 스타일 클래스 부착 및 이탈 시 제거 */
  useEffect(() => {
    document.body.classList.add('classroom-mode')
    return () => { document.body.classList.remove('classroom-mode') }
  }, [])

  /* 선생님: 강의실 열기 → 참가 → 입장 */
  async function handleOpen() {
    if (busy) return
    setBusy(true)
    try {
      const opened = await openClassroom(courseId)
      const me = await joinSession(opened.sessionId)
      if (!mountedRef.current) return
      setSession(opened)
      setParticipant(me)
      setPhase('room')
    } catch (err) {
      if (!mountedRef.current) return
      setMessage(err.status === 403 ? '담당 선생님만 강의실을 열 수 있어요.' : (err.message || '강의실을 열지 못했어요.'))
      setPhase('error')
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  /* 선생님: 강의실 종료(세션 close) 후 강의 상세로. 확인은 종료 모달(ClassroomRoom)에서 한다. */
  async function handleClose() {
    if (busy || !session) return
    setBusy(true)
    try {
      await closeSession(session.sessionId)
    } catch {
      /* 종료 실패해도 화면은 나간다 */
    } finally {
      setBusy(false)
      navigate(`/courses/${courseId}`)
    }
  }

  /* 학생/일반: 강의실에서 나가기(세션은 유지) */
  function handleLeave() {
    navigate(`/courses/${courseId}`)
  }

  // ===== 게이트 화면들 =====
  if (phase === 'loading') {
    return <CenterCard emoji="🎥" title="강의실 입장 중..." />
  }

  if (phase === 'denied' || phase === 'error') {
    return (
      <CenterCard emoji={phase === 'denied' ? '🔒' : '😕'} title={message}>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {phase === 'error' && (
            <button className="cd-btn-apply" style={ctaStyle} onClick={loadSession}>다시 시도</button>
          )}
          <button className="cd-btn-chat" style={ctaGhost} onClick={() => navigate(`/courses/${courseId}`)}>
            강의로 돌아가기
          </button>
        </div>
      </CenterCard>
    )
  }

  if (phase === 'lobby') {
    return (
      <CenterCard
        emoji={isOwner ? '🚪' : '⏳'}
        title={courseTitle || '실시간 강의실'}
        subtitle={isOwner ? '아직 강의실이 열리지 않았어요. 강의실을 열면 수강생이 입장할 수 있어요.' : '아직 강의실이 열리지 않았어요. 선생님이 강의실을 열면 입장할 수 있어요.'}
      >
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {isOwner ? (
            <button className="cd-btn-apply" style={ctaStyle} disabled={busy} onClick={handleOpen}>
              {busy ? '여는 중...' : '🎥 강의실 열기'}
            </button>
          ) : (
            <button className="cd-btn-apply" style={ctaStyle} disabled={busy} onClick={loadSession}>
              🔄 새로고침
            </button>
          )}
          <button className="cd-btn-chat" style={ctaGhost} onClick={() => navigate(`/courses/${courseId}`)}>
            강의로 돌아가기
          </button>
        </div>
      </CenterCard>
    )
  }

  // ===== phase === 'room' : 실제 강의실 =====
  return (
    <ClassroomRoom
      courseTitle={courseTitle}
      role={role}
      isTeacher={isOwner}
      session={session}
      participant={participant}
      courseId={courseId}
      onLeave={handleLeave}
      onClose={handleClose}
    />
  )
}

/* 입장 전/게이트용 중앙 카드 (soft 테마 인라인) */
function CenterCard({ emoji, title, subtitle, children }) {
  return (
    <div className="soft-layout fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff', border: '1px solid var(--soft-border, #f3e2c0)', borderRadius: 20,
        padding: '40px 48px', textAlign: 'center', maxWidth: 460, boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--soft-text, #451a03)' }}>{title}</h2>
        {subtitle && <p style={{ marginTop: 10, color: 'var(--soft-text-dim, #92400e)', fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

const ctaStyle = { minWidth: 140 }
const ctaGhost = { minWidth: 140 }

/* 실제 강의실 레이아웃 (Soft Amber Studio) */
function ClassroomRoom({ courseTitle, role, isTeacher, session, participant, courseId, onLeave, onClose }) {
  const [isVideosAllVisible, setIsVideosAllVisible] = useState(true)
  const [collapsedOrbs, setCollapsedOrbs] = useState(new Set())

  // ── 판서(화이트보드 그리기) 권한 (이슈 #99) ──
  // myCanDraw: 내가 그릴 수 있는지(학생은 기본 false, 선생님은 true). 권한 이벤트로 실시간 갱신.
  // roster: 선생님이 보는 참가자 권한표(String(userId) → {participantId, canDraw, ...}) — 토글 UI용.
  const myId = getCurrentUserId()
  const [myCanDraw, setMyCanDraw] = useState(participant?.canDraw ?? false)
  const [roster, setRoster] = useState({})
  const rosterRef = useRef(roster) // 효과에서 deps 추가 없이 최신 roster 참조용
  useEffect(() => { rosterRef.current = roster }, [roster])
  useEffect(() => { setMyCanDraw(participant?.canDraw ?? false) }, [participant])
  const toggleStudentDraw = async (userId) => {
    const key = String(userId)
    const p = roster[key]
    if (!p) return
    const next = !p.canDraw
    setRoster((r) => ({ ...r, [key]: { ...p, canDraw: next } })) // 낙관적 갱신
    try {
      await updateParticipantPermissions(p.participantId, { canDraw: next, canShareScreen: p.canShareScreen, canChat: p.canChat })
    } catch {
      setRoster((r) => ({ ...r, [key]: { ...p } })) // 실패 시 롤백
    }
  }

  // 화이트보드 도구 상태 (좌측 툴바 ↔ 캔버스 공유)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#111111')
  const [clearNonce, setClearNonce] = useState(0)
  // 도구 그룹: 길게 누르면 하위 도구 플라이아웃 (PPT 도구 묶음처럼)
  const TOOL_GROUPS = [
    { key: 'select', single: true, items: [{ key: 'select', icon: '🖱️', label: '선택/이동' }] },
    { key: 'pen', items: [{ key: 'pen', icon: '✏️', label: '펜' }, { key: 'highlighter', icon: '🖍️', label: '형광펜' }] },
    { key: 'line', items: [{ key: 'line', icon: '📏', label: '직선' }, { key: 'curve', icon: '〰️', label: '곡선' }] },
    { key: 'shape', items: [{ key: 'rect', icon: '▭', label: '사각형' }, { key: 'ellipse', icon: '◯', label: '원' }, { key: 'triangle', icon: '△', label: '삼각형' }, { key: 'polygon', icon: '⬠', label: '다각형' }] },
    { key: 'text', single: true, items: [{ key: 'text', icon: 'T', label: '텍스트' }] },
    { key: 'eraser', single: true, items: [{ key: 'eraser', icon: '🧽', label: '지우개' }] },
    { key: 'hand', single: true, viewOnly: true, items: [{ key: 'hand', icon: '✋', label: '손바닥 이동' }] },
    { key: 'zoom', viewOnly: true, items: [{ key: 'zoomIn', icon: '⌕＋', label: '확대' }, { key: 'zoomOut', icon: '⌕－', label: '축소' }] },
  ]
  const PRESET_COLORS = ['#111111', '#ef4444', '#f59e0b', '#10b981', '#2563eb', '#ffffff']
  const [groupCurrent, setGroupCurrent] = useState({ pen: 'pen', line: 'line', shape: 'rect', zoom: 'zoomIn' })
  const [flyout, setFlyout] = useState(null)
  const pressTimer = useRef(null)
  const longPressed = useRef(false)
  const wbRef = useRef(null) // 화이트보드 핸들(사진 불러오기 호출용)
  const TOOL_SHORTCUTS = {
    select: 'V',
    pen: 'P',
    highlighter: 'P',
    line: 'L',
    curve: 'L',
    rect: 'M',
    ellipse: 'M',
    triangle: 'M',
    polygon: 'M',
    text: 'T',
    eraser: 'E',
    hand: 'H',
    zoomIn: 'Z',
    zoomOut: 'Shift+Z',
  }
  const shortcutBadgeStyle = {
    position: 'absolute',
    right: 2,
    bottom: 1,
    minWidth: 13,
    maxWidth: 28,
    height: 10,
    padding: '0 2px',
    borderRadius: 4,
    background: 'rgba(17,24,39,0.86)',
    color: '#fff',
    fontSize: 7,
    lineHeight: '10px',
    fontWeight: 900,
    textAlign: 'center',
    pointerEvents: 'none',
    letterSpacing: 0,
    transform: 'translateZ(0)',
  }
  const ShortcutBadge = ({ value }) => value ? <span style={shortcutBadgeStyle}>{value}</span> : null

  const groupCurrentKey = (g) => (g.single ? g.items[0].key : (groupCurrent[g.key] || g.items[0].key))
  const groupItem = (g) => g.items.find((i) => i.key === groupCurrentKey(g)) || g.items[0]
  const groupShortcut = (g) => TOOL_SHORTCUTS[groupCurrentKey(g)]
  const selectSub = (g, key) => { setTool(key); if (!g.single) setGroupCurrent((p) => ({ ...p, [g.key]: key })); setFlyout(null) }
  // 화이트보드 단축키(P/L/M/T/V/E)로 도구가 바뀔 때 — tool + 좌측 툴바 그룹 표시(groupCurrent)도 함께 동기화.
  const handleSetTool = (toolKey) => {
    setTool(toolKey)
    const g = TOOL_GROUPS.find((grp) => !grp.single && grp.items.some((it) => it.key === toolKey))
    if (g) setGroupCurrent((p) => ({ ...p, [g.key]: toolKey }))
  }
  const onGroupDown = (g) => { longPressed.current = false; if (g.single) return; pressTimer.current = setTimeout(() => { longPressed.current = true; setFlyout(g.key) }, 300) }
  const clearPress = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null } }
  const onGroupClick = (g) => { if (longPressed.current) { longPressed.current = false; return } selectSub(g, groupCurrentKey(g)) }

  // 플라이아웃 열린 동안 바깥 클릭하면 닫기
  useEffect(() => {
    if (!flyout) return
    const close = () => setFlyout(null)
    const id = setTimeout(() => window.addEventListener('pointerdown', close), 0)
    return () => { clearTimeout(id); window.removeEventListener('pointerdown', close) }
  }, [flyout])

  const toggleOrb = (id) => {
    setCollapsedOrbs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 화상 패널 위치 — 드래그 핸들로 자유롭게 이동(오브들이 한꺼번에 따라감). null이면 기본 우상단(CSS).
  const videoPanelRef = useRef(null)
  const [videoPos, setVideoPos] = useState(null)
  const dragListenersRef = useRef(null) // 드래그 중 window 리스너({move,up}) — 언마운트 시 정리
  const onVideoDragDown = (e) => {
    const el = videoPanelRef.current
    if (!el) return
    e.preventDefault()
    const parent = el.offsetParent // board-shield(position:relative)
    const start = { x: e.clientX, y: e.clientY, left: el.offsetLeft, top: el.offsetTop }
    const move = (ev) => {
      let left = start.left + (ev.clientX - start.x)
      let top = start.top + (ev.clientY - start.y)
      if (parent) {
        left = Math.max(0, Math.min(left, parent.clientWidth - el.offsetWidth))
        top = Math.max(0, Math.min(top, parent.clientHeight - el.offsetHeight))
      }
      setVideoPos({ left, top })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      dragListenersRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    dragListenersRef.current = { move, up }
  }
  // 드래그 도중 언마운트(자동종료 등) 시 window에 리스너가 남지 않게 정리
  useEffect(() => () => {
    const d = dragListenersRef.current
    if (d) { window.removeEventListener('pointermove', d.move); window.removeEventListener('pointerup', d.up) }
  }, [])

  // 실시간 화상(LiveKit) — 양방향 과외라 전원 송출(선생·학생 모두 카메라/마이크). 권한은 서버 토큰이 최종 판정.
  const media = useLiveKitRoom(session?.sessionId, { canPublish: true })

  // 듣기 자료(오디오) 재생 동기화(이슈 #117/#182) — 제어는 호스트(선생님)만. 학생은 수신 상태에 맞춰 재생.
  const audio = useClassroomAudio(session?.sessionId, { isHost: isTeacher })
  const onPickAudio = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const hadTrack = !!audio.track
    let firstId = null
    for (const file of files) {
      try {
        const up = await uploadClassroomAudio(file, session?.sessionId)
        audio.addTrack({ url: up.fileUrl, fileName: up.originalFileName || file.name, fileId: up.fileId })
        if (firstId == null) firstId = up.fileId
      } catch (err) {
        setNotice(err?.message || `'${file.name}' 업로드에 실패했어요.`)
      }
    }
    // 현재 재생 중인 트랙이 없을 때만 새로 올린 첫 곡을 선택(재생 중이면 목록에만 추가).
    if (!hadTrack && firstId != null) audio.selectTrack(firstId)
  }

  // 좌측 도구 바: 화면이 낮아(노트북) 도구가 넘치면 위/아래 화살표로 스크롤.
  const sideScrollRef = useRef(null)
  const [sideArrows, setSideArrows] = useState({ up: false, down: false })
  const updateSideArrows = useCallback(() => {
    const el = sideScrollRef.current
    if (!el) return
    setSideArrows({ up: el.scrollTop > 4, down: el.scrollTop + el.clientHeight < el.scrollHeight - 4 })
  }, [])
  useEffect(() => {
    const el = sideScrollRef.current
    if (!el) return undefined
    updateSideArrows()
    const ro = new ResizeObserver(updateSideArrows)
    ro.observe(el)
    window.addEventListener('resize', updateSideArrows)
    return () => { ro.disconnect(); window.removeEventListener('resize', updateSideArrows) }
  }, [updateSideArrows])
  const scrollSide = (dy) => sideScrollRef.current?.scrollBy({ top: dy, behavior: 'smooth' })
  // 화면공유가 (동시 클릭 경합으로) 막히면 잠깐 안내 후 자동 해제
  useEffect(() => {
    if (!media.shareBlocked) return undefined
    const t = setTimeout(() => media.clearShareBlocked(), 2500)
    return () => clearTimeout(t)
  }, [media.shareBlocked, media])

  // ── 전체화면 ── 강의실 전체를 풀스크린으로. 전체화면일 땐 좌측 도구바/하단 컨트롤을
  //   가장자리에 마우스를 대면 슬라이드로 나타나게 한다(평소엔 숨김 → 보드/공유가 넓게).
  const rootRef = useRef(null)
  const [isFs, setIsFs] = useState(false)
  const [revealLeft, setRevealLeft] = useState(false)
  const [revealBottom, setRevealBottom] = useState(false)
  // 메시지(채팅) 패널 — 기본 숨김(보드/공유를 넓게), 버튼으로 우측에서 슬라이드. 안읽음 카운트 표시.
  const [chatOpen, setChatOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  // 더블클릭한 참가자를 크게(전체화면) 보기
  const [focusedId, setFocusedId] = useState(null)
  // 떠오르는 리액션(손흔들기/좋아요) 오버레이
  const [reactions, setReactions] = useState([]) // [{ key, emoji, name }]
  const reactionSeq = useRef(0)
  const reactionTimers = useRef([])
  const pushReaction = (msg) => {
    const key = ++reactionSeq.current
    const emoji = msg?.type === 'hand' ? '✋' : '👍'
    setReactions((prev) => [...prev, { key, emoji, name: msg?.senderName || '' }])
    const t = setTimeout(() => setReactions((prev) => prev.filter((r) => r.key !== key)), 3000)
    reactionTimers.current.push(t)
  }
  // 언마운트 시 남은 리액션 타이머 정리(언마운트 후 setState 경고 방지)
  useEffect(() => () => reactionTimers.current.forEach(clearTimeout), [])

  // 종료 안내(비차단) — window.alert 대신 잠깐 배너 표시 후 퇴장
  const [notice, setNotice] = useState(null)

  // 수업 종료 모달 — 선생님이 "수업 종료" 누르면 진도 기록 여부를 먼저 묻는다(이슈).
  // 강의실 종료 시점이므로 날짜는 항상 "오늘"로 고정(날짜 선택 없음). progressDate 생략 → BE가 오늘로 저장.
  const [endOpen, setEndOpen]       = useState(false)
  const [endSaving, setEndSaving]   = useState(false)
  const [endProgress, setEndProgress] = useState('')
  const openEnd = () => { setEndProgress(''); setEndOpen(true) }
  // saveProgress=true면 진도 저장 후 종료, false면 진도 없이 종료. 어느 쪽이든 종료(onClose)는 실행.
  const finishClose = async (saveProgress) => {
    if (endSaving) return
    setEndSaving(true)
    try {
      if (saveProgress && endProgress.trim()) {
        const cid = session?.courseId ?? courseId
        await createCourseProgress(cid, { content: endProgress.trim() }).catch(() => {}) // 날짜 미지정 → 오늘
      }
    } finally {
      setEndOpen(false)
      setEndSaving(false)
      onClose?.() // 부모: closeSession + 강의 상세로 이동
    }
  }
  // 종료 모달 ESC로 닫기(저장 중에는 무시) — 키보드 접근성
  useEffect(() => {
    if (!endOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape' && !endSaving) setEndOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [endOpen, endSaving])

  // onLeave를 ref로 고정 — heartbeat/이벤트 useEffect가 onLeave 참조변경으로 재실행되지 않게
  const onLeaveRef = useRef(onLeave)
  useEffect(() => { onLeaveRef.current = onLeave })

  // 강의 진행 시간 — 강의실을 연 시각(startedAt)부터 매초 갱신해 경과 시간을 보여준다.
  const live = session?.status === 'OPEN'
  const startedAt = session?.startedAt
  const [elapsed, setElapsed] = useState('0:00:00')
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

  // 호스트 하트비트 — 선생님이 강의실에 있는 동안 30초마다 "나 있음" 전송(부재 자동종료 타이머 리셋).
  // 뒤로가기/새로고침/크롬 종료/재부팅 등으로 사라지면 핑이 끊겨 서버가 5분 뒤 자동 종료한다.
  const sessionId = session?.sessionId
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

  // 강의실 종료 이벤트 + 리액션 구독 — 종료 시 자동 퇴장, 리액션 수신 시 떠오르는 오버레이.
  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false, unsubEvents = () => {}, unsubReactions = () => {}
    const onEvent = (e) => {
      if (cancelled || e?.type !== 'closed') return
      // 비차단 안내 배너 표시 후 잠깐 뒤 퇴장(window.alert는 메인스레드 블로킹 → 미사용)
      setNotice(e.reason === 'host-absent'
        ? '선생님 연결이 끊겨 강의실이 자동으로 종료되었습니다.'
        : '강의실이 종료되었습니다.')
      setTimeout(() => onLeaveRef.current?.(), 1600)
    }
    const resub = () => {
      if (cancelled) return
      unsubEvents(); unsubEvents = subscribeClassroomEvents(sessionId, onEvent)
      unsubReactions(); unsubReactions = subscribeReactions(sessionId, (msg) => { if (!cancelled) pushReaction(msg) })
    }
    const off = onSocketStatus((s) => { if (s === 'connected') resub() })
    connectChat().then(resub).catch(() => {})
    return () => { cancelled = true; unsubEvents(); unsubReactions(); off() }
  }, [sessionId])

  // 선생님: 참가자 roster 로딩. 입장 시 1회 + "roster에 없는 새 참가자 타일이 생겼을 때만" 재조회.
  // (타일 감소/재생성으로 length만 출렁여도 새 인물이 없으면 호출하지 않아 중복 API 방지 — 코드리뷰 반영)
  useEffect(() => {
    if (!isTeacher || sessionId == null) return undefined
    const hasNew = media.tiles.some((t) => !(String(t.identity).replace(/^user-/, '') in rosterRef.current))
    if (!hasNew && Object.keys(rosterRef.current).length > 0) return undefined // 최초 1회 제외, 새 인물 없으면 skip
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
  }, [isTeacher, sessionId, media.tiles.length])

  // 판서 권한 변경 실시간 수신 — 내 권한(myCanDraw) + roster 갱신(모두 구독, 재연결 시 재구독).
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
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else rootRef.current?.requestFullscreen?.()
  }
  const onRootMouseMove = (e) => {
    if (!isFs) return
    setRevealLeft(e.clientX < 90)                                 // 좌측 가장자리
    setRevealBottom(e.clientY > window.innerHeight - 110)         // 하단 가장자리
  }
  // 전체화면일 때 좌측 도구바/하단 컨트롤을 떠 있는(fixed) 오버레이로 만들어 보드가 꽉 차게 한다.
  const fsAsideStyle = isFs
    ? { position: 'fixed', left: 16, top: 16, bottom: 16, zIndex: 60, transition: 'transform .2s ease', transform: revealLeft ? 'none' : 'translateX(-130%)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }
    : undefined
  const fsBottomStyle = isFs
    ? { position: 'fixed', left: 16, right: chatOpen ? 372 : 16, bottom: 16, zIndex: 60, transition: 'transform .2s ease', transform: revealBottom ? 'none' : 'translateY(160%)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--soft-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }
    : undefined

  // 그리는 중 이름 라벨용: senderId(userId) → 표시명. LiveKit identity는 user-{userId} 형식(이슈 #100).
  const drawerNames = useMemo(() => {
    const m = {}
    media.tiles.forEach((t) => { m[String(t.identity).replace(/^user-/, '')] = t.name })
    return m
  }, [media.tiles])

  // 더블클릭으로 크게 볼 참가자(없거나 나가면 null)
  const focusedTile = focusedId ? media.tiles.find((t) => t.identity === focusedId) : null
  // 눈 버튼 옆 화살표: 한 번 누르면 전체 작게(원), 한 번 더 누르면 전체 크게(사각형)
  const allCollapsed = media.tiles.length > 0 && media.tiles.every((t) => collapsedOrbs.has(t.identity))
  const cycleAllOrbs = () => {
    if (allCollapsed) setCollapsedOrbs(new Set())
    else setCollapsedOrbs(new Set(media.tiles.map((t) => t.identity)))
  }
  const drawOnlyDisabledStyle = !myCanDraw ? { opacity: 0.35, pointerEvents: 'none', filter: 'grayscale(1)' } : null

  return (
    <div className="soft-layout fade-in" ref={rootRef} onMouseMove={onRootMouseMove}>
      {/* 종료 안내(비차단) — alert 대신 상단 배너 */}
      {notice && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#111827', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
          {notice}
        </div>
      )}
      {/* 1. 좌측 그리기 도구 바 (그룹: 길게 눌러 하위 도구 선택) — 전체화면 땐 좌측 호버로 슬라이드 */}
      {/* 판서 권한 없음(학생 기본) → 도구 전체 비활성화(회색+클릭 불가). 선생님이 허용하면 즉시 활성화. */}
      <aside
        className="side-drawing-bar"
        style={fsAsideStyle}
        title={!myCanDraw ? '손바닥/확대/축소는 사용할 수 있고, 판서는 선생님 허용 후 사용할 수 있어요' : undefined}
      >
        {/* 도구가 화면보다 많으면 위/아래 화살표로 스크롤(노트북 등 낮은 화면 대응) */}
        <button className="side-scroll-arrow" onClick={() => scrollSide(-160)} title="위 도구 보기" style={{ visibility: sideArrows.up ? 'visible' : 'hidden' }}>▲</button>
        <div className="side-drawing-scroll" ref={sideScrollRef} onScroll={updateSideArrows}>
        {TOOL_GROUPS.map((g) => {
          const active = g.items.some((i) => i.key === tool)
          const disabled = !myCanDraw && !g.viewOnly
          return (
            <div key={g.key} style={{ position: 'relative', opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', filter: disabled ? 'grayscale(1)' : 'none' }}>
              <div
                className={`draw-btn ${active ? 'active' : ''}`}
                title={disabled ? '선생님이 판서를 허용해야 사용할 수 있어요' : (g.single ? g.items[0].label : `${groupItem(g).label} (길게 눌러 변경)`)}
                onPointerDown={() => onGroupDown(g)}
                onPointerUp={clearPress}
                onClick={() => onGroupClick(g)}
                onPointerLeave={clearPress}
                style={{ position: 'relative' }}
              >
                {groupItem(g).icon}
                <ShortcutBadge value={groupShortcut(g)} />
                {!g.single && <span style={{ position: 'absolute', right: 2, top: -2, fontSize: 9, color: '#9ca3af' }}>▾</span>}
              </div>
              {flyout === g.key && !g.single && (
                <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 'calc(100% + 8px)', top: 0, zIndex: 50, display: 'flex', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  {g.items.map((it) => (
                    <button key={it.key} title={it.label} onClick={() => selectSub(g, it.key)}
                      style={{ position: 'relative', width: 38, height: 38, fontSize: 17, border: tool === it.key ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', paddingBottom: 8 }}>
                      {it.icon}
                      <ShortcutBadge value={TOOL_SHORTCUTS[it.key]} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {/* 사진 불러오기 (여러 장) */}
        <label className="draw-btn" title={myCanDraw ? '사진 불러오기 (여러 장)' : '선생님이 판서를 허용해야 사용할 수 있어요'} style={{ cursor: 'pointer', ...drawOnlyDisabledStyle }}>
          🖼️
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={(e) => { wbRef.current?.addImages(e.target.files); e.target.value = '' }} />
        </label>
        <label className="draw-btn" title={myCanDraw ? 'PDF 불러오기' : '선생님이 판서를 허용해야 사용할 수 있어요'} style={{ cursor: 'pointer', fontSize: 11, fontWeight: 900, ...drawOnlyDisabledStyle }}>
          PDF
          <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }}
            onChange={(e) => { wbRef.current?.addPdf(e.target.files); e.target.value = '' }} />
        </label>
        {/* 듣기 자료(오디오) 불러오기 — 선생님만. 업로드 후 전원 동기화 재생(이슈 #117). */}
        {isTeacher && (
          <label className="draw-btn" title="듣기 자료(오디오) 불러오기 — 전원 동기화 재생" style={{ cursor: 'pointer', fontSize: 16 }}>
            🎧
            <input type="file" accept="audio/*" multiple style={{ display: 'none' }} onChange={onPickAudio} />
          </label>
        )}
        {/* 전체 지우기 — 업그레이드된 지우개 아이콘 */}
        <div className="draw-btn" title={myCanDraw ? '전체 지우기' : '선생님이 판서를 허용해야 사용할 수 있어요'} onClick={() => setClearNonce((n) => n + 1)} style={drawOnlyDisabledStyle || undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <g transform="rotate(-32 12 13)">
              <rect x="3" y="9" width="17" height="8" rx="2" fill="#fbcfe8" stroke="#db2777" strokeWidth="1.6" />
              <rect x="13" y="9" width="7" height="8" rx="2" fill="#f9a8d4" stroke="#db2777" strokeWidth="1.6" />
            </g>
            <line x1="3" y1="21" x2="21" y2="21" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ width: '30px', height: '1px', background: 'var(--soft-border)', margin: '12px 0' }}></div>

        {/* 색상: 프리셋 + 임의 색 선택(네이티브 컬러피커) */}
        {PRESET_COLORS.map((c) => (
          <div
            key={c}
            className="draw-color-circle"
            style={{ background: c, border: c === '#ffffff' ? '1px solid var(--soft-border,#e5e7eb)' : 'none', outline: color.toLowerCase() === c ? '2px solid #2563eb' : 'none', outlineOffset: 2, ...drawOnlyDisabledStyle }}
            title={myCanDraw ? `색상 ${c}` : '선생님이 판서를 허용해야 사용할 수 있어요'}
            onClick={() => setColor(c)}
          ></div>
        ))}
        <label
          title={myCanDraw ? '색상 직접 선택' : '선생님이 판서를 허용해야 사용할 수 있어요'}
          style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--soft-border,#e5e7eb)', display: 'inline-block', position: 'relative', background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`, ...drawOnlyDisabledStyle }}
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#111111'}
            onChange={(e) => setColor(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', border: 'none', padding: 0 }}
          />
        </label>
        </div>
        <button className="side-scroll-arrow" onClick={() => scrollSide(160)} title="아래 도구 보기" style={{ visibility: sideArrows.down ? 'visible' : 'hidden' }}>▼</button>
      </aside>

      {/* 2. 중앙 영역 (상단 제목바 제거 — 보드를 최대한 넓게. LIVE/진행시간은 하단 컨트롤에 표시) */}
      <div className="soft-main">
        <div className="board-shield">
          {/* 화면공유 영상(맨 아래 z1) — 그 위에 투명 화이트보드를 올려 그릴 수 있게 한다 */}
          {media.screenShare && <ScreenShareView share={media.screenShare} />}

          {/* 화이트보드(z2). 화면공유 중이면 배경 투명 → 공유 화면 위에 그리기 */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            <Whiteboard ref={wbRef} tool={tool} color={color} clearNonce={clearNonce} sessionId={session?.sessionId} onPickSelectTool={() => setTool('select')} onSetTool={handleSetTool} pageBarBottom={isFs ? 96 : 12} transparent={!!media.screenShare} canDraw={myCanDraw} drawerNames={drawerNames} />
          </div>

          {/* 공용 오디오 플레이어(듣기 자료) — 트랙이 있을 때만 상단 중앙에 표시(이슈 #117) */}
          <ClassroomAudioPlayer audio={audio} isHost={isTeacher} />

          {/* 판서 권한 없는 참가자(학생 기본)에게 안내 칩 표시 */}
          {!myCanDraw && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 6, background: 'rgba(17,24,39,0.82)', color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              ✏️ 선생님이 판서를 허용하면 그릴 수 있어요
            </div>
          )}

          {/* 더블클릭한 참가자를 크게 보기 */}
          {focusedTile && <FocusedVideoView tile={focusedTile} onClose={() => setFocusedId(null)} />}

          {/* 리액션(손흔들기/좋아요) — 하단 중앙에서 떠오르며 사라짐 */}
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 10, pointerEvents: 'none' }}>
            {reactions.map((r) => (
              <div key={r.key} className="reaction-float" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 34 }}>{r.emoji}</span>
                {r.name && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '1px 6px', borderRadius: 8 }}>{r.name}</span>}
              </div>
            ))}
          </div>

          <div
            className="video-toggle-container"
            ref={videoPanelRef}
            style={videoPos ? { left: videoPos.left, top: videoPos.top, right: 'auto' } : undefined}
          >
            {/* 드래그 핸들 — 잡고 끌면 화상 패널 전체가 한꺼번에 이동 */}
            <div
              onPointerDown={onVideoDragDown}
              title="드래그해서 화상창 위치 이동"
              style={{ alignSelf: 'center', cursor: 'grab', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: '2px 8px', background: 'rgba(255,255,255,0.9)', borderRadius: 8, border: '1px solid var(--soft-border)', userSelect: 'none', touchAction: 'none' }}
            >⠿⠿</div>

            {/* 눈: 전체 화상 보이기/숨기기  +  화살표: 전체 작게(원)/크게(사각) 토글 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="master-toggle"
                onClick={() => setIsVideosAllVisible((v) => !v)}
                title={isVideosAllVisible ? '모든 화상 숨기기' : '모든 화상 보이기'}
              >
                {isVideosAllVisible ? '👁️' : '🕶️'}
              </button>
              {isVideosAllVisible && media.tiles.length > 0 && (
                <button
                  className="master-toggle"
                  onClick={cycleAllOrbs}
                  title={allCollapsed ? '전체 크게 보기' : '전체 작게(원형)'}
                >
                  {allCollapsed ? '🔼' : '🔽'}
                </button>
              )}
            </div>

            {/* 연결 상태 / 오디오 차단 안내 */}
            {media.status === 'connecting' && (
              <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>화상 연결 중…</div>
            )}
            {media.status === 'error' && (
              <div style={{ fontSize: 11, color: '#b91c1c', fontWeight: 700 }} title={String(media.error?.message || '')}>화상 연결 실패</div>
            )}
            {media.audioBlocked && (
              <button className="master-toggle" onClick={media.resumeAudio} title="소리 켜기">🔊</button>
            )}
            {media.shareBlocked && (
              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>다른 참가자가 화면공유 중이에요</div>
            )}

            {isVideosAllVisible && media.tiles.map((tile) => {
              // 선생님 화면: 학생(내 타일 아님) 아래에 "그리기 허용" 토글. identity 형식은 user-{userId}.
              const uid = String(tile.identity).replace(/^user-/, '')
              const allowed = !!roster[uid]?.canDraw
              const hasRoster = !!roster[uid]
              return (
                <div key={tile.identity} className="p-orb-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <VideoTile
                    tile={tile}
                    collapsed={collapsedOrbs.has(tile.identity)}
                    onSingleClick={() => toggleOrb(tile.identity)}
                    onDoubleClick={() => setFocusedId(tile.identity)}
                  />
                  {isTeacher && !tile.isLocal && hasRoster && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleStudentDraw(uid) }}
                      title={allowed ? '판서 허용됨 — 클릭하면 회수' : '이 학생에게 판서를 허용'}
                      style={{
                        marginTop: 5, fontSize: 10, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                        border: 'none', borderRadius: 999, padding: '3px 9px', color: '#fff',
                        background: allowed ? '#10b981' : 'rgba(0,0,0,0.55)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      {allowed ? '✏️ 판서 허용됨' : '✏️ 그리기 허용'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={fsBottomStyle}>
          <BottomControls isTeacher={isTeacher} onLeave={onLeave} onClose={openEnd} media={media}
            isFullscreen={isFs} onToggleFullscreen={toggleFullscreen}
            chatOpen={chatOpen} unread={unread} onToggleChat={() => setChatOpen((v) => !v)}
            live={live} elapsed={elapsed}
            onReaction={(type) => sendReaction(session?.sessionId, type)} />
        </div>
      </div>

      {/* 3. 우측 채팅 — 메시지 버튼으로 토글. 우측에서 슬라이드 인(전체화면에서도 동일). */}
      <div
        style={{
          position: 'fixed', top: 16, right: 16, bottom: 16, width: 340, maxWidth: 'calc(100vw - 32px)', zIndex: 90,
          cursor: 'auto', // 보드(crosshair 등) 위에 떠도 채팅 위에선 항상 일반 커서가 보이도록
          transition: 'transform .25s ease', transform: chatOpen ? 'none' : 'translateX(120%)',
          pointerEvents: chatOpen ? 'auto' : 'none',
        }}
      >
        <ChatSidebar sessionId={session?.sessionId} open={chatOpen} onUnreadChange={setUnread} />
      </div>

      {/* 수업 종료 모달 — 종료 전 오늘 진도 기록 여부 묻기(선생님). 진도 저장 + 종료를 한 번에. */}
      {endOpen && (
        <div
          onClick={() => !endSaving && setEndOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="수업 종료"
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fade-in .15s ease' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(460px, calc(100vw - 32px))', background: '#fff', borderRadius: 18, padding: '24px 24px 20px', boxShadow: '0 16px 50px rgba(0,0,0,0.25)', border: '1px solid var(--soft-border,#f3e2c0)' }}
          >
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--soft-text,#451a03)' }}>🎬 수업을 종료할까요?</h2>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--soft-text-dim,#92400e)', lineHeight: 1.5 }}>
              종료하면 모든 참가자의 연결이 끊깁니다.<br />오늘 나간 진도를 남기려면 아래에 적어주세요. (선택)
            </p>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, color: 'var(--soft-text-dim,#92400e)', background: 'var(--peach-bg,#fef3e2)', padding: '4px 10px', borderRadius: 999 }}>
                📅 오늘({new Date().toLocaleDateString('ko-KR')}) 날짜로 기록됩니다
              </span>
              <textarea
                value={endProgress}
                onChange={(e) => setEndProgress(e.target.value)}
                disabled={endSaving}
                rows={4}
                maxLength={1000}
                placeholder="오늘 어디까지 나갔는지 짧게 적어주세요 (예: 3단원 함수 ~ 합성함수까지)"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--soft-border,#e5e7eb)', fontSize: 14, lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <span style={{ alignSelf: 'flex-end', fontSize: 11, color: '#9ca3af' }}>{endProgress.length}/1000</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" disabled={endSaving} onClick={() => setEndOpen(false)}
                style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--soft-border,#e5e7eb)', background: '#fff', fontWeight: 700, fontSize: 13, cursor: endSaving ? 'default' : 'pointer', color: '#6b7280' }}>
                취소
              </button>
              <button type="button" disabled={endSaving} onClick={() => finishClose(false)}
                style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#6b7280', color: '#fff', fontWeight: 800, fontSize: 13, cursor: endSaving ? 'default' : 'pointer' }}>
                진도 없이 종료
              </button>
              <button type="button" disabled={endSaving || !endProgress.trim()} onClick={() => finishClose(true)}
                style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: (endSaving || !endProgress.trim()) ? '#fca5a5' : '#ef4444', color: '#fff', fontWeight: 800, fontSize: 13, cursor: (endSaving || !endProgress.trim()) ? 'default' : 'pointer' }}>
                {endSaving ? '저장 중…' : '진도 저장하고 종료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
