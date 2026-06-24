/**
 * @file ChatWidget.jsx
 * @description 모든 페이지 오른쪽 아래에 떠 있는 전역 채팅 위젯(컨테이너)입니다.
 * - 로그인 사용자의 실제 채팅방을 백엔드와 실시간(STOMP)으로 연동합니다. (useChat)
 * - 강의실(/classroom)과 로그인(/login) 경로에서는 숨깁니다.
 * - UI 상태(open/view/input)만 여기서 관리하고, 데이터/전송은 useChat이 담당합니다.
 *
 * 화면 분리: ChatRoomList · ChatConversation(· ChatMessage · ChatComposer) · icons
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ChatRoomList from './ChatRoomList.jsx'
import ChatConversation from './ChatConversation.jsx'
import CourseChatManager from './CourseChatManager.jsx'
import { IconChevronDown, IconMessageMenu } from './icons.jsx'
import useChat from './useChat.js'
import useVoiceCall from './useVoiceCall.js'
import VoiceCallPanel from './VoiceCallPanel.jsx'
import useResizablePanel from './useResizablePanel.js'
import { getCurrentUserRole } from '../../auth/currentUser.js'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'

const HIDDEN_PATH_PREFIXES = ['/classroom', '/login']

function shouldHideWidget(pathname) {
  return HIDDEN_PATH_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export default function ChatWidget() {
  const { pathname } = useLocation()
  const hidden = shouldHideWidget(pathname)
  const { style, handleMouseDown } = useResizablePanel()

  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')
  const [input, setInput] = useState('')
  const [roomType, setRoomType] = useState('direct')
  const [courseManager, setCourseManager] = useState(null) // null | {mode:'create'|'manage'}
  const [voiceCallEnabled, setVoiceCallEnabled] = useState(true)

  const bottomRef = useRef(null)
  const role = getCurrentUserRole()
  const isTeacher = role === 'TEACHER' || role === 'ADMIN'

  const {
    authed,
    rooms,
    messagesByRoom,
    activeRoomId,
    connected,
    roomsState,
    error,
    clearError,
    openRoom,
    sendText,
    sendImages,
    refreshRooms,
  } = useChat({ open: open && !hidden })

  // 1. 로그인 시 DB에서 설정 불러오기
  useEffect(() => {
    if (!authed) return
    async function loadSetting() {
      try {
        const res = await authFetch(`${API_BASE}/api/v1/users/me`)
        if (res.ok) {
          const data = await res.json()
          if (data.voiceCallEnabled !== undefined) {
            setVoiceCallEnabled(data.voiceCallEnabled)
          }
        }
      } catch (e) {
        // 실패 시 기본값(true) 유지
      }
    }
    loadSetting()
  }, [authed])

  // 2. 토글 시 DB 업데이트
  const handleToggleVoiceCall = async () => {
    const nextVal = !voiceCallEnabled
    setVoiceCallEnabled(nextVal) // 낙관적 갱신
    try {
      const res = await authFetch(`${API_BASE}/api/v1/users/me/voice-call-setting`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceCallEnabled: nextVal })
      })
      if (!res.ok) throw new Error()
    } catch (e) {
      setVoiceCallEnabled(!nextVal) // 롤백
      console.error('보이스톡 설정 변경 실패', e)
    }
  }

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId],
  )
  const activeMessages = activeRoomId != null ? messagesByRoom[activeRoomId] || [] : []
  const voiceCall = useVoiceCall({ 
    rooms, 
    activeRoom: activeRoom?.type === 'DIRECT' ? activeRoom : null, 
    connected,
    enabled: voiceCallEnabled 
  })
  const roomCounts = useMemo(() => ({
    direct: rooms.filter((room) => room.type === 'DIRECT').length,
    course: rooms.filter((room) => room.type === 'COURSE_GROUP').length,
  }), [rooms])
  const visibleRooms = useMemo(
    () => rooms.filter((room) => (roomType === 'course' ? room.type === 'COURSE_GROUP' : room.type === 'DIRECT')),
    [rooms, roomType],
  )
  const unreadTotal = useMemo(
    () => rooms.reduce((sum, room) => sum + (room.unread || 0), 0),
    [rooms],
  )

  useEffect(() => {
    if (hidden) setOpen(false)
  }, [hidden])

  // 외부(선생님 상세 페이지 등)에서 chat:openRoom 이벤트로 특정 방을 바로 열 수 있게 합니다.
  const handleOpenRoomRef = useRef(null)
  handleOpenRoomRef.current = handleOpenRoom
  useEffect(() => {
    function onOpenRoom(e) {
      const { roomId } = e.detail ?? {}
      if (roomId == null) return
      setOpen(true)
      setView('room')
      handleOpenRoomRef.current?.(roomId)
    }
    window.addEventListener('chat:openRoom', onOpenRoom)
    return () => window.removeEventListener('chat:openRoom', onOpenRoom)
  }, [])

  useEffect(() => {
    if (open && view === 'room') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, view, activeMessages.length])

  // 보이스톡 수신 시 자동으로 채팅 위젯을 열기만 하고, 강제 이동은 하지 않음
  useEffect(() => {
    if (voiceCall?.status === 'incoming' && voiceCall?.roomId) {
      setOpen(true)
    }
  }, [voiceCall?.status, voiceCall?.roomId])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleOpenRoom(roomId) {
    setInput('')
    setView('room')
    clearError()
    openRoom(roomId)
  }

  function backToList() {
    setInput('')
    setView('list')
    refreshRooms()
  }

  function handleSend(payload = {}) {
    if (activeRoomId == null) return
    const text = typeof payload.text === 'string' ? payload.text : input
    const attachments = payload.attachments || []

    if (attachments.length > 0) {
      sendImages(activeRoomId, attachments, text)
    } else if ((text || '').trim()) {
      sendText(activeRoomId, text)
    }
    setInput('')
  }

  async function handleCourseChatCreated(room) {
    setCourseManager(null)
    setRoomType('course')
    await refreshRooms()
    if (room?.roomId != null) handleOpenRoom(room.roomId)
  }

  async function handleCourseChatChanged() {
    await refreshRooms()
  }

  if (hidden) return null

  return (
    <>
      <button
        className={`cw-fab ${open ? 'is-open' : ''}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? '채팅 닫기' : '채팅 열기'}
        aria-expanded={open}
        aria-controls="global-chat-panel"
      >
        <span className="cw-fab-menu-icon" aria-hidden="true">
          {open ? <IconChevronDown /> : <IconMessageMenu />}
        </span>
        <span className="cw-fab-copy" aria-hidden="true">
          <span>{open ? '닫기' : '메시지'}</span>
          <small>{open ? 'close' : 'inbox'}</small>
        </span>
        {!open && unreadTotal > 0 && <span className="cw-fab-badge">{unreadTotal}</span>}
      </button>

      <section
        id="global-chat-panel"
        className="cw-panel"
        style={{ ...style, display: open ? 'flex' : 'none' }}
        role="dialog"
        aria-label="채팅"
      >
        <div className="cw-resize-handle cw-resize-t" onMouseDown={handleMouseDown('t')} />
        <div className="cw-resize-handle cw-resize-b" onMouseDown={handleMouseDown('b')} />
        <div className="cw-resize-handle cw-resize-l" onMouseDown={handleMouseDown('l')} />
        <div className="cw-resize-handle cw-resize-r" onMouseDown={handleMouseDown('r')} />
        <div className="cw-resize-handle cw-resize-tl" onMouseDown={handleMouseDown('tl')} />
        <div className="cw-resize-handle cw-resize-tr" onMouseDown={handleMouseDown('tr')} />
        <div className="cw-resize-handle cw-resize-bl" onMouseDown={handleMouseDown('bl')} />
        <div className="cw-resize-handle cw-resize-br" onMouseDown={handleMouseDown('br')} />

        {voiceCall && <VoiceCallPanel call={voiceCall} />}

        {!authed ? (
            <ChatSignInNotice onClose={() => setOpen(false)} />
          ) : view === 'list' ? (
            <ChatRoomList
              rooms={visibleRooms}
              loading={roomsState === 'loading'}
              failed={roomsState === 'error'}
              onClose={() => setOpen(false)}
              onOpenRoom={handleOpenRoom}
              activeType={roomType}
              onTypeChange={setRoomType}
              counts={roomCounts}
              isTeacher={isTeacher}
              onCreateCourseChat={() => setCourseManager({ mode: 'create' })}
              voiceCallEnabled={voiceCallEnabled}
              onToggleVoiceCall={handleToggleVoiceCall}
            />
          ) : (
            <ChatConversation
              room={activeRoom}
              messages={activeMessages}
              input={input}
              onInput={setInput}
              onSend={handleSend}
              onBack={backToList}
              onClose={() => setOpen(false)}
              bottomRef={bottomRef}
              isTyping={false}
              voiceCall={activeRoom?.type === 'DIRECT' ? voiceCall : null}
              onManageCourseChat={() => setCourseManager({ mode: 'manage' })}
            />
          )}

          <CourseChatManager
            open={!!courseManager}
            mode={courseManager?.mode}
            room={courseManager?.mode === 'manage' ? activeRoom : null}
            onClose={() => setCourseManager(null)}
            onCreated={handleCourseChatCreated}
            onChanged={handleCourseChatChanged}
          />

          {authed && error && (
            <div className="cw-error" role="alert" onClick={clearError}>
              {error}
            </div>
          )}
        </section>
    </>
  )
}

/** 로그인 전 사용자에게 보여줄 안내 화면. */
function ChatSignInNotice({ onClose }) {
  return (
    <div className="cw-auth-notice">
      <div className="cw-auth-emoji">💬</div>
      <div className="cw-auth-title">로그인하고 대화를 시작하세요</div>
      <p className="cw-auth-desc">선생님·학생과 1:1 채팅을 하려면 로그인이 필요해요.</p>
      <a className="cw-auth-btn" href="#/login" onClick={onClose}>로그인하러 가기</a>
    </div>
  )
}
