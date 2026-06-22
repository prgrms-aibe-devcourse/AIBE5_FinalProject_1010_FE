/**
 * @file ClassroomPage.jsx
 * @description StudyFlow Soft Amber Studio - 실시간 강의실 메인 (컨트롤러 + 레이아웃)
 * - URL: /classroom/:courseId. 진입 시 현재 강의실 세션을 조회해 입장 흐름을 게이팅한다.
 *   · 열린 세션 있음 → 자동 참가(join) 후 강의실(room) 진입
 *   · 열린 세션 없음 → 선생님은 "강의실 열기" 로비, 학생은 "대기" 로비
 *   · 멤버 아님(403) → 안내 화면
 * - 실제 멤버십·소유권 검증은 백엔드가 수행한다(여기선 UX 게이팅만).
 * - 강의실 내부(ClassroomRoom)는 기능별 훅/컴포넌트(./room/*)로 분리해 오케스트레이션만 담당한다.
 */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Whiteboard from './Whiteboard.jsx'
import ChatSidebar from './ChatSidebar.jsx'
import BottomControls from './BottomControls.jsx'
import ScreenShareView from './ScreenShareView.jsx'
import FocusedVideoView from './FocusedVideoView.jsx'
import { useLiveKitRoom } from './useLiveKitRoom.js'
import { useClassroomAudio } from './useClassroomAudio.js'
import ClassroomAudioPlayer from './ClassroomAudioPlayer.jsx'
// 강의실(room) 기능별 분리 모듈
import { useDrawingTools } from './room/useDrawingTools.js'
import { useReactions } from './room/useReactions.js'
import { useFullscreenReveal } from './room/useFullscreenReveal.js'
import { useSidebarScroll } from './room/useSidebarScroll.js'
import { useDraggablePanel } from './room/useDraggablePanel.js'
import { useClassroomRealtime } from './room/useClassroomRealtime.js'
import ClassroomToolbar from './room/ClassroomToolbar.jsx'
import VideoDock from './room/VideoDock.jsx'
import ParticipantsPanel from './room/ParticipantsPanel.jsx'
import EndSessionModal from './room/EndSessionModal.jsx'
import { NoticeBanner, EndedOverlay, ReactionsOverlay } from './room/ClassroomOverlays.jsx'
import { uploadClassroomAudio } from '../../api/fileApi.js'
import { getCurrentSession, openClassroom, joinSession, closeSession } from '../../api/classroomApi.js'
import { sendReaction } from '../../api/chatSocket.js'
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

  /* 선생님: 강의실 종료(세션 close) 후 메인으로. 확인은 종료 모달(ClassroomRoom)에서 한다. */
  async function handleClose() {
    if (busy || !session) return
    setBusy(true)
    try {
      await closeSession(session.sessionId)
    } catch {
      /* 종료 실패해도 화면은 나간다 */
    } finally {
      setBusy(false)
      navigate('/') // 강의실을 나가면 메인 페이지로 이동
    }
  }

  /* 학생/일반: 강의실에서 나가기(세션은 유지) → 메인 페이지로 */
  function handleLeave() {
    navigate('/')
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

/**
 * 실제 강의실 화면 — 상태/실시간 로직은 ./room/* 훅으로, 큰 UI는 ./room/* 컴포넌트로 분리.
 * 여기서는 그 조각들을 연결(오케스트레이션)하고 중앙 보드 레이아웃만 직접 그린다.
 */
function ClassroomRoom({ isTeacher, session, participant, courseId, onLeave, onClose }) {
  const myId = getCurrentUserId()
  const sessionId = session?.sessionId
  const live = session?.status === 'OPEN'

  // 화상 타일 보이기/접기
  const [isVideosAllVisible, setIsVideosAllVisible] = useState(true)
  const [collapsedOrbs, setCollapsedOrbs] = useState(new Set())
  const toggleOrb = (id) => setCollapsedOrbs((prev) => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  // 그리기 도구 / 리액션 / 미디어 / 오디오
  const tools = useDrawingTools()
  const { reactions, pushReaction } = useReactions()
  const media = useLiveKitRoom(sessionId, { canPublish: true })
  const audio = useClassroomAudio(sessionId, { isHost: isTeacher })

  // 실시간(하트비트 / 종료 이벤트 / 판서 권한 / roster / 경과시간)
  const { myCanDraw, roster, toggleStudentDraw, elapsed, ended } = useClassroomRealtime({
    sessionId, isTeacher, myId, participant, startedAt: session?.startedAt, mediaTiles: media.tiles, onLeave, pushReaction,
  })

  // 일시 안내 배너(업로드 실패 등)
  const [notice, setNotice] = useState(null)
  // 오디오 여러 곡 업로드 → 목록 추가, 재생 중인 곡이 없으면 첫 곡 선택
  const onPickAudio = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const hadTrack = !!audio.track
    let firstId = null
    for (const file of files) {
      try {
        const up = await uploadClassroomAudio(file, sessionId)
        audio.addTrack({ url: up.fileUrl, fileName: up.originalFileName || file.name, fileId: up.fileId })
        if (firstId == null) firstId = up.fileId
      } catch (err) {
        setNotice(err?.message || `'${file.name}' 업로드에 실패했어요.`)
      }
    }
    if (!hadTrack && firstId != null) audio.selectTrack(firstId)
  }

  // 좌측 도구바 스크롤 / 화상 패널 드래그
  const sidebar = useSidebarScroll()
  const videoDrag = useDraggablePanel()

  // 화면공유가 (동시 클릭 경합으로) 막히면 잠깐 안내 후 자동 해제
  useEffect(() => {
    if (!media.shareBlocked) return undefined
    const t = setTimeout(() => media.clearShareBlocked(), 2500)
    return () => clearTimeout(t)
  }, [media.shareBlocked, media])

  // 전체화면 + 채팅
  const rootRef = useRef(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const { isFs, toggleFullscreen, onRootMouseMove, fsAsideStyle, fsBottomStyle } = useFullscreenReveal(rootRef, { chatOpen })

  // 더블클릭 포커스 / 참가자 패널
  const [focusedId, setFocusedId] = useState(null)
  const focusedTile = focusedId ? media.tiles.find((t) => t.identity === focusedId) : null
  const [participantsOpen, setParticipantsOpen] = useState(false)

  // 수업 종료 모달(선생님) — 종료 전 오늘 진도 기록 여부를 묻는다.
  const [endOpen, setEndOpen] = useState(false)
  const [endSaving, setEndSaving] = useState(false)
  const [endProgress, setEndProgress] = useState('')
  const openEnd = () => { setEndProgress(''); setEndOpen(true) }
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
      onClose?.() // 부모: closeSession + 메인 이동
    }
  }

  // 파생값: 그리는 사람 이름맵(이슈 #100) / 전체 접힘 토글
  const drawerNames = useMemo(() => {
    const m = {}
    media.tiles.forEach((t) => { m[String(t.identity).replace(/^user-/, '')] = t.name })
    return m
  }, [media.tiles])
  const allCollapsed = media.tiles.length > 0 && media.tiles.every((t) => collapsedOrbs.has(t.identity))
  const cycleAllOrbs = () => {
    if (allCollapsed) setCollapsedOrbs(new Set())
    else setCollapsedOrbs(new Set(media.tiles.map((t) => t.identity)))
  }

  return (
    <div className="soft-layout fade-in" ref={rootRef} onMouseMove={onRootMouseMove}>
      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
      <EndedOverlay ended={ended} />

      {/* 1. 좌측 그리기 도구 바 */}
      <ClassroomToolbar
        fsAsideStyle={fsAsideStyle} myCanDraw={myCanDraw} isTeacher={isTeacher}
        tool={tools.tool} color={tools.color} setColor={tools.setColor}
        onClearAll={() => tools.setClearNonce((n) => n + 1)} wbRef={tools.wbRef} onPickAudio={onPickAudio}
        scrollRef={sidebar.scrollRef} arrows={sidebar.arrows} onScrollUpdate={sidebar.update} scrollBy={sidebar.scrollBy}
        flyout={tools.flyout} groupItem={tools.groupItem} groupShortcut={tools.groupShortcut}
        selectSub={tools.selectSub} onGroupDown={tools.onGroupDown} clearPress={tools.clearPress} onGroupClick={tools.onGroupClick}
      />

      {/* 2. 중앙 영역 — 보드를 최대한 넓게 */}
      <div className="soft-main">
        <div className="board-shield">
          {/* 화면공유 영상(z1) — 그 위에 투명 화이트보드를 올려 그릴 수 있게 한다 */}
          {media.screenShare && <ScreenShareView share={media.screenShare} />}

          {/* 화이트보드(z2). 화면공유 중이면 배경 투명 */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            <Whiteboard ref={tools.wbRef} tool={tools.tool} color={tools.color} clearNonce={tools.clearNonce} sessionId={sessionId} onPickSelectTool={() => tools.setTool('select')} onSetTool={tools.handleSetTool} pageBarBottom={isFs ? 96 : 12} transparent={!!media.screenShare} canDraw={myCanDraw} drawerNames={drawerNames} />
          </div>

          {/* 공용 오디오 플레이어(듣기 자료) — 트랙이 있을 때만 표시 */}
          <ClassroomAudioPlayer audio={audio} isHost={isTeacher} />

          {/* 판서 권한 없는 참가자(학생 기본) 안내 칩 */}
          {!myCanDraw && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 6, background: 'rgba(17,24,39,0.82)', color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              ✏️ 선생님이 판서를 허용하면 그릴 수 있어요
            </div>
          )}

          {/* 더블클릭한 참가자 크게 보기 */}
          {focusedTile && <FocusedVideoView tile={focusedTile} onClose={() => setFocusedId(null)} />}

          {/* 리액션(손흔들기/좋아요) */}
          <ReactionsOverlay reactions={reactions} />

          {/* 화상 패널(드래그 이동) */}
          <VideoDock
            panelRef={videoDrag.panelRef} pos={videoDrag.pos} onDragStart={videoDrag.onDragStart}
            media={media} isVideosAllVisible={isVideosAllVisible} setIsVideosAllVisible={setIsVideosAllVisible}
            collapsedOrbs={collapsedOrbs} toggleOrb={toggleOrb} allCollapsed={allCollapsed} cycleAllOrbs={cycleAllOrbs}
            onFocusTile={setFocusedId} isTeacher={isTeacher} roster={roster} toggleStudentDraw={toggleStudentDraw}
          />
        </div>

        {/* 하단 컨트롤 */}
        <div style={fsBottomStyle}>
          <BottomControls isTeacher={isTeacher} onLeave={onLeave} onClose={openEnd} media={media}
            isFullscreen={isFs} onToggleFullscreen={toggleFullscreen}
            chatOpen={chatOpen} unread={unread} onToggleChat={() => setChatOpen((v) => !v)}
            live={live} elapsed={elapsed}
            onReaction={(type) => sendReaction(sessionId, type)}
            onToggleParticipants={() => setParticipantsOpen((v) => !v)} participantsOpen={participantsOpen} participantCount={media.tiles.length} />
        </div>

        {/* 참가자 목록 패널 */}
        {participantsOpen && <ParticipantsPanel tiles={media.tiles} onClose={() => setParticipantsOpen(false)} />}
      </div>

      {/* 3. 우측 채팅 — 메시지 버튼으로 토글 */}
      <div
        style={{
          position: 'fixed', top: 16, right: 16, bottom: 16, width: 340, maxWidth: 'calc(100vw - 32px)', zIndex: 90,
          cursor: 'auto', transition: 'transform .25s ease', transform: chatOpen ? 'none' : 'translateX(120%)',
          pointerEvents: chatOpen ? 'auto' : 'none',
        }}
      >
        <ChatSidebar sessionId={sessionId} open={chatOpen} onUnreadChange={setUnread} />
      </div>

      {/* 수업 종료 모달(선생님) */}
      <EndSessionModal
        open={endOpen} saving={endSaving} progress={endProgress} setProgress={setEndProgress}
        onCancel={() => setEndOpen(false)} onCloseWithout={() => finishClose(false)} onCloseWith={() => finishClose(true)}
      />
    </div>
  )
}
