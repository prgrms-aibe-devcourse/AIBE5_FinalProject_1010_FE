/**
 * @file ChatWidget.jsx
 * @description 모든 페이지 오른쪽 아래에 떠 있는 전역 채팅 위젯입니다.
 * - 평소에는 동그란 채팅 버튼(FAB)만 보이고, 누르면 채팅 패널이 열립니다.
 * - 패널 안에서 [방 목록] ↔ [대화 화면]을 전환합니다.
 * - 현재는 더미 데이터 기반이며, 전송 시 데모용 자동 응답이 옵니다.
 *
 * 표시 규칙:
 * - 자체 채팅이 있는 강의실(/classroom)과 로그인 전 화면(/login)에서는 숨깁니다.
 *
 * 🔌 백엔드 연동 지점은 src/data/chatRooms.js 주석 참고.
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'
import { chatRooms, initialMessages, mockReply } from '../../data/chatRooms.js'

// 위젯을 숨길 경로. (강의실은 전용 채팅 사이드바가 있고, 로그인 전에는 채팅이 의미 없음)
const HIDDEN_PATHS = ['/classroom', '/login']

/** 현재 시각을 "오후 2:03" 형태로 만듭니다(목업용). */
function nowLabel() {
  const d = new Date()
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}:${m}`
}

export default function ChatWidget() {
  const { pathname } = useLocation()

  // 패널 열림 여부.
  const [open, setOpen] = useState(false)
  // 내부 화면: 'list'(방 목록) | 'room'(대화).
  const [view, setView] = useState('list')
  // 현재 보고 있는 방 id.
  const [activeRoomId, setActiveRoomId] = useState(null)
  // 방별 메시지 상태. 전송하면 여기에 누적됩니다.
  // TODO(API): GET /api/v1/chat-rooms/{roomId}/messages 결과로 초기화.
  const [messagesByRoom, setMessagesByRoom] = useState(initialMessages)
  // 입력창 값.
  const [input, setInput] = useState('')

  // 데모 자동응답 setTimeout id. 언마운트/닫기/방 전환 시 정리해 누수를 막습니다.
  const replyTimerRef = useRef(null)
  // 메시지 고유 key 카운터. Date.now()는 같은 ms에 충돌할 수 있어 카운터를 씁니다.
  const msgKeyRef = useRef(0)
  const nextKey = () => (msgKeyRef.current += 1)
  // 대화 자동 스크롤용 앵커.
  const bottomRef = useRef(null)

  const activeRoom = useMemo(
    () => chatRooms.find((r) => r.id === activeRoomId) || null,
    [activeRoomId],
  )
  const activeMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : []

  // 안 읽은 메시지 합계(FAB 배지). 더미 기준.
  const unreadTotal = useMemo(
    () => chatRooms.reduce((sum, r) => sum + (r.unread || 0), 0),
    [],
  )

  // 패널이 열려있고 대화 화면이면 새 메시지마다 맨 아래로 스크롤.
  useEffect(() => {
    if (open && view === 'room') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, view, activeMessages.length])

  // ESC로 패널 닫기.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // 언마운트 시 대기 중이던 자동응답 타이머 정리.
  useEffect(() => () => clearTimeout(replyTimerRef.current), [])

  function openRoom(id) {
    clearTimeout(replyTimerRef.current) // 이전 방의 대기 응답이 끼어들지 않게 정리
    setActiveRoomId(id)
    setInput('')
    setView('room')
  }

  function backToList() {
    clearTimeout(replyTimerRef.current)
    setView('list')
  }

  function handleSend() {
    const text = input.trim()
    if (!text || !activeRoomId) return

    const myMsg = { key: nextKey(), role: 'me', text, time: nowLabel() }
    setMessagesByRoom((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), myMsg],
    }))
    setInput('')

    // 데모: 잠시 뒤 상대가 답한 것처럼 자동 응답.
    // TODO(API): 이 블록을 WebSocket(STOMP) 전송/수신으로 교체하세요.
    const roomId = activeRoomId
    const replyName = activeRoom?.name || '상대'
    replyTimerRef.current = setTimeout(() => {
      const reply = { key: nextKey(), role: 'other', text: mockReply(replyName), time: nowLabel() }
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), reply],
      }))
    }, 900)
  }

  // 숨김 경로에서는 아무것도 렌더링하지 않습니다.
  if (HIDDEN_PATHS.includes(pathname)) return null

  return (
    <>
      {/* 플로팅 채팅 버튼 — 누르면 패널 토글 */}
      <button
        className={`cw-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? '채팅 닫기' : '채팅 열기'}
        aria-expanded={open}
      >
        {open ? <IconChevronDown /> : <IconChat />}
        {!open && unreadTotal > 0 && <span className="cw-fab-badge">{unreadTotal}</span>}
      </button>

      {/* 채팅 패널 */}
      {open && (
        <section className="cw-panel" role="dialog" aria-label="채팅">
          {view === 'list' ? (
            <RoomList
              rooms={chatRooms}
              onClose={() => setOpen(false)}
              onOpenRoom={openRoom}
            />
          ) : (
            <Conversation
              room={activeRoom}
              messages={activeMessages}
              input={input}
              onInput={setInput}
              onSend={handleSend}
              onBack={backToList}
              onClose={() => setOpen(false)}
              bottomRef={bottomRef}
            />
          )}
        </section>
      )}
    </>
  )
}

/* ───────────────────────── 방 목록 화면 ───────────────────────── */
function RoomList({ rooms, onClose, onOpenRoom }) {
  return (
    <>
      <header className="cw-head">
        <div className="cw-head-title">
          <span className="cw-head-emoji">💬</span> 메시지
        </div>
        <button className="cw-icon-btn" onClick={onClose} aria-label="닫기"><IconClose /></button>
      </header>

      <ul className="cw-rooms">
        {rooms.map((r) => (
          <li key={r.id}>
            <button className="cw-room" onClick={() => onOpenRoom(r.id)}>
              <div className="cw-room-avatar">
                <Avatar size="sm" color={r.avatar}>{r.initial}</Avatar>
                {r.online && <span className="cw-online-dot" aria-hidden="true" />}
              </div>
              <div className="cw-room-main">
                <div className="cw-room-row">
                  <span className="cw-room-name">{r.name}</span>
                  <span className="cw-room-time">{r.time}</span>
                </div>
                <div className="cw-room-row">
                  <span className="cw-room-last">{r.last}</span>
                  {r.unread > 0 && <span className="cw-unread">{r.unread}</span>}
                </div>
                <div className="cw-room-subject">{r.subject}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="cw-foot">
        <span className="cw-foot-dot" /> 채팅 데모 모드 · 실시간 연동 예정
      </div>
    </>
  )
}

/* ───────────────────────── 대화 화면 ───────────────────────── */
function Conversation({ room, messages, input, onInput, onSend, onBack, onClose, bottomRef }) {
  // 한글 조합 중 Enter 오작동 방지를 위한 IME 조합 상태.
  const composingRef = useRef(false)

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !composingRef.current) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <>
      <header className="cw-head">
        <button className="cw-icon-btn" onClick={onBack} aria-label="목록으로"><IconBack /></button>
        <div className="cw-convo-title">
          <Avatar size="sm" color={room?.avatar || 'c1'}>{room?.initial || '?'}</Avatar>
          <div>
            <div className="cw-convo-name">{room?.name}</div>
            <div className="cw-convo-sub">{room?.online ? '접속 중' : room?.subject}</div>
          </div>
        </div>
        <button className="cw-icon-btn" onClick={onClose} aria-label="닫기"><IconClose /></button>
      </header>

      <div className="cw-msgs">
        {messages.map((m, i) =>
          m.sys
            ? <div className="cw-sys" key={m.key ?? `sys-${i}`}>{m.sys}</div>
            : (
              <div className={`cw-msg ${m.role === 'me' ? 'me' : ''}`} key={m.key ?? i}>
                <div className="cw-bubble">{m.text}</div>
                <div className="cw-msg-time">{m.time}</div>
              </div>
            )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="cw-composer">
        <input
          type="text"
          className="cw-input"
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
        />
        <button className="cw-send" onClick={onSend} disabled={!input.trim()} aria-label="전송">
          <IconSend />
        </button>
      </div>
    </>
  )
}

/* ───────────────────────── 아이콘들 (인라인 SVG) ───────────────────────── */
function IconChat() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}
function IconChevronDown() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
