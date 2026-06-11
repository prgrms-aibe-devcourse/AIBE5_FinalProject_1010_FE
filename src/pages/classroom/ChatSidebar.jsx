/**
 * @file ChatSidebar.jsx
 * @description 강의실 우측 실시간 채팅 패널 (STOMP 실연동).
 * - 입장 시 이력(GET /classroom-sessions/{id}/chats)을 한 번 로드하고,
 *   /sub/classroom-sessions/{id}/chats 를 구독해 실시간 수신, /pub/.../chats 로 전송한다.
 * - 내 메시지(senderId === 현재 사용자)는 오른쪽 앰버, 상대는 왼쪽 베이지 말풍선으로 정렬한다.
 */
import { useEffect, useRef, useState } from 'react'
import {
  connectChat,
  onSocketStatus,
  subscribeClassroomChat,
  sendClassroomMessage,
} from '../../api/chatSocket.js'
import { fetchClassroomChats } from '../../api/classroomApi.js'
import { getCurrentUserId } from '../../auth/currentUser.js'

export default function ChatSidebar({ sessionId }) {
  const myId = getCurrentUserId()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [connected, setConnected] = useState(false)
  const feedRef = useRef(null)

  // 연결 상태 추적
  useEffect(() => {
    const off = onSocketStatus((s) => setConnected(s === 'connected'))
    return off
  }, [])

  // 이력 로드 + 연결 + 구독
  useEffect(() => {
    if (sessionId == null) return
    let cancelled = false
    let unsubscribe = () => {}

    // 1) 과거 메시지 로드
    fetchClassroomChats(sessionId)
      .then((list) => { if (!cancelled) setMessages(list || []) })
      .catch(() => { /* 이력 없거나 권한 문제 — 빈 채로 시작 */ })

    // 2) STOMP 연결 후 실시간 구독
    connectChat()
      .then(() => {
        if (cancelled) return
        setConnected(true)
        unsubscribe = subscribeClassroomChat(sessionId, (msg) => {
          setMessages((prev) =>
            // 같은 chatId 중복 수신 방지(내 메시지 echo 포함)
            prev.some((m) => m.chatId === msg.chatId) ? prev : [...prev, msg],
          )
        })
      })
      .catch(() => { /* 토큰 없음/연결 실패 — 전송은 비활성 상태로 둔다 */ })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [sessionId])

  // 새 메시지 도착 시 맨 아래로 스크롤
  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  function handleSend(e) {
    e?.preventDefault()
    const text = draft.trim()
    if (!text || sessionId == null) return
    const ok = sendClassroomMessage(sessionId, text)
    if (ok) setDraft('')
  }

  return (
    <aside className="soft-sidebar">
      <div className="sidebar-title">
        실시간 채팅
        {!connected && <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginLeft: 8 }}>● 연결 중</span>}
      </div>

      <div className="amber-chat-feed" ref={feedRef}>
        {messages.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--soft-text-dim)', textAlign: 'center', marginTop: 20 }}>
            아직 메시지가 없어요. 첫 메시지를 남겨보세요!
          </div>
        )}
        {messages.map((m) => {
          const mine = myId != null && m.senderId === myId
          return mine ? (
            <div key={m.chatId} className="chat-bubble me">{m.content}</div>
          ) : (
            <div key={m.chatId} className="chat-msg">
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--soft-text-dim)', marginLeft: '4px', marginBottom: '4px' }}>
                {m.senderName}
              </div>
              <div className="chat-bubble other">{m.content}</div>
            </div>
          )
        })}
      </div>

      {/* 채팅 입력 영역 */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="modern-input-box">
          <input
            type="text"
            placeholder={connected ? '메시지를 입력하세요...' : '연결 중...'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!connected}
          />
          <button type="submit" className="send-btn" title="전송" disabled={!connected || !draft.trim()}>🚀</button>
        </div>
      </form>
    </aside>
  )
}
