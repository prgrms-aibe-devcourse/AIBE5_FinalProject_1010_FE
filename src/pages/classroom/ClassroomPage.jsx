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
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ClassroomTopBar from './ClassroomTopBar.jsx'
import Whiteboard from './Whiteboard.jsx'
import ChatSidebar from './ChatSidebar.jsx'
import BottomControls from './BottomControls.jsx'
import { getCurrentSession, openClassroom, joinSession, closeSession } from '../../api/classroomApi.js'
import { fetchCourseDetail } from '../../api/courseApi.js'
import { getCurrentUserRole } from '../../auth/currentUser.js'

export default function ClassroomPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const role = getCurrentUserRole() // STUDENT / TEACHER / ADMIN / null
  const isTeacher = role === 'TEACHER' || role === 'ADMIN'

  // phase: loading | lobby | room | denied | error
  const [phase, setPhase] = useState('loading')
  const [session, setSession] = useState(null)       // 현재 강의실 세션
  const [participant, setParticipant] = useState(null) // 내 참가 정보(권한 포함)
  const [courseTitle, setCourseTitle] = useState('')
  const [busy, setBusy] = useState(false)            // 열기/입장 중복 클릭 방지
  const [message, setMessage] = useState('')

  /* 세션 조회 + (있으면) 자동 참가 */
  const loadSession = useCallback(async () => {
    setPhase('loading')
    try {
      const current = await getCurrentSession(courseId)
      if (!current) {
        // 열린 강의실 없음 → 로비
        setSession(null)
        setPhase('lobby')
        return
      }
      // 열린 강의실 있음 → 참가 등록 후 입장
      const me = await joinSession(current.sessionId)
      setSession(current)
      setParticipant(me)
      setPhase('room')
    } catch (err) {
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
    let cancelled = false
    // 수업 제목(헤더 표시용)
    fetchCourseDetail(courseId)
      .then((c) => { if (!cancelled) setCourseTitle(c?.title || '') })
      .catch(() => {})
    loadSession()
    return () => { cancelled = true }
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
      setSession(opened)
      setParticipant(me)
      setPhase('room')
    } catch (err) {
      setMessage(err.status === 403 ? '담당 선생님만 강의실을 열 수 있어요.' : (err.message || '강의실을 열지 못했어요.'))
      setPhase('error')
    } finally {
      setBusy(false)
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
        emoji={isTeacher ? '🚪' : '⏳'}
        title={courseTitle || '실시간 강의실'}
        subtitle={isTeacher ? '아직 강의실이 열리지 않았어요. 강의실을 열면 수강생이 입장할 수 있어요.' : '아직 강의실이 열리지 않았어요. 선생님이 강의실을 열면 입장할 수 있어요.'}
      >
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {isTeacher ? (
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
      isTeacher={isTeacher}
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
      {/* 1. 좌측 그리기 도구 바 */}
      <aside className="side-drawing-bar">
        <div className="draw-btn active" title="펜 도구">✏️</div>
        <div className="draw-btn" title="사각형">🟦</div>
        <div className="draw-btn" title="원형">⭕</div>
        <div className="draw-btn" title="텍스트 입력">T</div>
        <div className="draw-btn" title="전체 지우기">🧹</div>
        <div style={{ width: '30px', height: '1px', background: 'var(--soft-border)', margin: '12px 0' }}></div>
        <div className="draw-color-circle" style={{ background: '#000' }} title="검정색"></div>
        <div className="draw-color-circle" style={{ background: '#f59e0b' }} title="앰버색"></div>
        <div className="draw-color-circle" style={{ background: '#ef4444' }} title="빨간색"></div>
      </aside>

      {/* 2. 중앙 영역 */}
      <div className="soft-main">
        <ClassroomTopBar title={courseTitle} live={session?.status === 'OPEN'} />

        <div className="board-shield">
          <Whiteboard />

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
