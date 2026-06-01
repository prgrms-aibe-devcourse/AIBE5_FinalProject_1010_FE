/**
 * @file ChatWidget.jsx
 * @description Global floating chat widget shell.
 * - Hidden on login and classroom routes.
 * - Keeps widget state, demo messages, and route visibility logic.
 * - Presentation is split into ChatRoomList, ChatConversation, ChatComposer,
 *   ChatMessage, and icons.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ChatRoomList from './ChatRoomList.jsx'
import ChatConversation from './ChatConversation.jsx'
import { IconChevronDown, IconMessageMenu } from './icons.jsx'
import { chatRooms, initialMessages, mockReply } from '../../data/chatRooms.js'

const HIDDEN_PATH_PREFIXES = ['/classroom', '/login']

function shouldHideWidget(pathname) {
  return HIDDEN_PATH_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

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
  const hidden = shouldHideWidget(pathname)

  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [messagesByRoom, setMessagesByRoom] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [typingRoomId, setTypingRoomId] = useState(null)

  const replyTimerRef = useRef(null)
  const msgKeyRef = useRef(0)
  const bottomRef = useRef(null)

  const activeRoom = useMemo(
    () => chatRooms.find((room) => room.id === activeRoomId) || null,
    [activeRoomId],
  )

  const activeMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : []

  const unreadTotal = useMemo(
    () => chatRooms.reduce((sum, room) => sum + (room.unread || 0), 0),
    [],
  )

  useEffect(() => {
    if (hidden) {
      setOpen(false)
      setTypingRoomId(null)
      clearTimeout(replyTimerRef.current)
    }
  }, [hidden])

  useEffect(() => {
    if (open && view === 'room') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, view, activeMessages.length, typingRoomId])

  useEffect(() => {
    if (!open) return undefined

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => () => clearTimeout(replyTimerRef.current), [])

  function nextKey() {
    msgKeyRef.current += 1
    return msgKeyRef.current
  }

  function openRoom(roomId) {
    clearTimeout(replyTimerRef.current)
    setTypingRoomId(null)
    setActiveRoomId(roomId)
    setInput('')
    setView('room')
  }

  function backToList() {
    clearTimeout(replyTimerRef.current)
    setTypingRoomId(null)
    setInput('')
    setView('list')
  }

  function handleSend(payload = {}) {
    const text = (payload.text ?? input).trim()
    const attachments = payload.attachments || []
    if ((!text && attachments.length === 0) || !activeRoomId) return

    const myMessage = {
      key: nextKey(),
      role: 'me',
      text,
      attachments,
      time: nowLabel(),
    }

    setMessagesByRoom((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), myMessage],
    }))
    setInput('')

    // Demo reply. Replace this block with WebSocket/STOMP receive handling later.
    const roomId = activeRoomId
    const replyName = activeRoom?.name || '상대'
    setTypingRoomId(roomId)
    replyTimerRef.current = setTimeout(() => {
      const reply = {
        key: nextKey(),
        role: 'other',
        text: mockReply(replyName),
        time: nowLabel(),
      }

      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), reply],
      }))
      setTypingRoomId(null)
    }, 800)
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
        {!open && unreadTotal > 0 && <span className="cw-fab-badge">{unreadTotal}</span>}
      </button>

      {open && (
        <section id="global-chat-panel" className="cw-panel" role="dialog" aria-label="채팅">
          {view === 'list' ? (
            <ChatRoomList
              rooms={chatRooms}
              onClose={() => setOpen(false)}
              onOpenRoom={openRoom}
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
              isTyping={typingRoomId === activeRoomId}
            />
          )}
        </section>
      )}
    </>
  )
}
