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
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ClassroomTopBar from './ClassroomTopBar.jsx'
import Whiteboard from './Whiteboard.jsx'
import ChatSidebar from './ChatSidebar.jsx'
import BottomControls from './BottomControls.jsx'
import { getCurrentSession, openClassroom, joinSession, closeSession } from '../../api/classroomApi.js'
import { fetchCourseDetail } from '../../api/courseApi.js'
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

  /* 선생님: 강의실 종료(세션 close) 후 강의 상세로 */
  async function handleClose() {
    if (busy || !session) return
    if (!window.confirm('강의실을 종료할까요? 모든 참가자의 연결이 끊깁니다.')) return
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
function ClassroomRoom({ courseTitle, role, isTeacher, session, participant, onLeave, onClose }) {
  const [isVideosAllVisible, setIsVideosAllVisible] = useState(true)
  const [collapsedOrbs, setCollapsedOrbs] = useState(new Set())

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
  ]
  const PRESET_COLORS = ['#111111', '#ef4444', '#f59e0b', '#10b981', '#2563eb', '#ffffff']
  const [groupCurrent, setGroupCurrent] = useState({ pen: 'pen', line: 'line', shape: 'rect' })
  const [flyout, setFlyout] = useState(null)
  const pressTimer = useRef(null)
  const longPressed = useRef(false)

  const groupCurrentKey = (g) => (g.single ? g.items[0].key : (groupCurrent[g.key] || g.items[0].key))
  const groupItem = (g) => g.items.find((i) => i.key === groupCurrentKey(g)) || g.items[0]
  const selectSub = (g, key) => { setTool(key); if (!g.single) setGroupCurrent((p) => ({ ...p, [g.key]: key })); setFlyout(null) }
  const onGroupDown = (g) => { longPressed.current = false; if (g.single) return; pressTimer.current = setTimeout(() => { longPressed.current = true; setFlyout(g.key) }, 300) }
  const onGroupUp = (g) => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null } if (!longPressed.current) selectSub(g, groupCurrentKey(g)) }

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

  // TODO(B단계): 실제 LiveKit 참가자 트랙으로 교체. 지금은 내 역할 기준 자리표시.
  const orbs = [
    { id: 'me', label: isTeacher ? '나 (선생님)' : '나', icon: isTeacher ? '👩‍🏫' : '🙋‍♂️' },
  ]

  return (
    <div className="soft-layout fade-in">
      {/* 1. 좌측 그리기 도구 바 (그룹: 길게 눌러 하위 도구 선택) */}
      <aside className="side-drawing-bar">
        {TOOL_GROUPS.map((g) => {
          const active = g.items.some((i) => i.key === tool)
          return (
            <div key={g.key} style={{ position: 'relative' }}>
              <div
                className={`draw-btn ${active ? 'active' : ''}`}
                title={g.single ? g.items[0].label : `${groupItem(g).label} (길게 눌러 변경)`}
                onPointerDown={() => onGroupDown(g)}
                onPointerUp={() => onGroupUp(g)}
                onPointerLeave={() => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null } }}
                style={{ position: 'relative' }}
              >
                {groupItem(g).icon}
                {!g.single && <span style={{ position: 'absolute', right: 1, bottom: -2, fontSize: 9, color: '#9ca3af' }}>▾</span>}
              </div>
              {flyout === g.key && !g.single && (
                <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 'calc(100% + 8px)', top: 0, zIndex: 50, display: 'flex', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  {g.items.map((it) => (
                    <button key={it.key} title={it.label} onClick={() => selectSub(g, it.key)}
                      style={{ width: 38, height: 38, fontSize: 17, border: tool === it.key ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>{it.icon}</button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div className="draw-btn" title="전체 지우기" onClick={() => setClearNonce((n) => n + 1)}>🧹</div>

        <div style={{ width: '30px', height: '1px', background: 'var(--soft-border)', margin: '12px 0' }}></div>

        {/* 색상: 프리셋 + 임의 색 선택(네이티브 컬러피커) */}
        {PRESET_COLORS.map((c) => (
          <div
            key={c}
            className="draw-color-circle"
            style={{ background: c, border: c === '#ffffff' ? '1px solid var(--soft-border,#e5e7eb)' : 'none', outline: color.toLowerCase() === c ? '2px solid #2563eb' : 'none', outlineOffset: 2 }}
            title={`색상 ${c}`}
            onClick={() => setColor(c)}
          ></div>
        ))}
        <label
          title="색상 직접 선택"
          style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--soft-border,#e5e7eb)', display: 'inline-block', position: 'relative', background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }}
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#111111'}
            onChange={(e) => setColor(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', border: 'none', padding: 0 }}
          />
        </label>
      </aside>

      {/* 2. 중앙 영역 */}
      <div className="soft-main">
        <ClassroomTopBar title={courseTitle} live={session?.status === 'OPEN'} />

        <div className="board-shield">
          <Whiteboard tool={tool} color={color} clearNonce={clearNonce} onPickSelectTool={() => setTool('select')} />

          <div className="video-toggle-container">
            <button
              className="master-toggle"
              onClick={() => setIsVideosAllVisible((v) => !v)}
              title={isVideosAllVisible ? '모든 화상 숨기기' : '모든 화상 보이기'}
            >
              {isVideosAllVisible ? '👁️' : '🕶️'}
            </button>

            {isVideosAllVisible && orbs.map((p) => (
              <div key={p.id} className="p-orb-wrap">
                <div className="orb-arrow" onClick={() => toggleOrb(p.id)} title="화상창 전환">
                  {collapsedOrbs.has(p.id) ? '◀' : '▶'}
                </div>
                <div className={`p-orb ${collapsedOrbs.has(p.id) ? 'collapsed' : ''}`}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                    {p.icon}
                  </div>
                  {!collapsedOrbs.has(p.id) && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>
                      {p.label}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomControls isTeacher={isTeacher} onLeave={onLeave} onClose={onClose} />
      </div>

      {/* 3. 우측 채팅 (A-3에서 실연동) */}
      <ChatSidebar sessionId={session?.sessionId} />
    </div>
  )
}
