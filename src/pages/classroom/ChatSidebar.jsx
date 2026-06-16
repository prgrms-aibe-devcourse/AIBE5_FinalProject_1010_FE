/**
 * @file ChatSidebar.jsx
 * @description 강의실 우측 실시간 채팅 패널 (STOMP 실연동).
 * - 입장 시 이력(GET /classroom-sessions/{id}/chats)을 함수형 머지로 합치고(실시간 수신분 보존),
 *   연결될 때마다 /sub/classroom-sessions/{id}/chats 를 (재)구독한다(재연결 시 수신 복구).
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

export default function ChatSidebar({ sessionId, open = true, onUnreadChange }) {
  const myId = getCurrentUserId()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [connected, setConnected] = useState(false)
  const feedRef = useRef(null)
  const seenRef = useRef(0) // 사용자가 "본" 메시지 개수(패널이 열려 있을 때 갱신)

  // 안읽음 계산 — 패널이 열려 있으면 모두 읽음(0), 닫혀 있으면 그동안 쌓인 개수.
  useEffect(() => {
    if (open) {
      seenRef.current = messages.length
      onUnreadChange?.(0)
    } else {
      onUnreadChange?.(Math.max(0, messages.length - seenRef.current))
    }
  }, [messages, open, onUnreadChange])

  // 연결 상태 추적 + 연결 시도 (상태 변화는 재연결 감지에 쓰인다)
  useEffect(() => {
    const off = onSocketStatus((s) => setConnected(s === 'connected'))
    connectChat()
      .then(() => setConnected(true))
      .catch(() => { /* 토큰 없음/연결 실패 — 전송 비활성 */ })
    return off
  }, [])

  // 이력 로드 (sessionId 단위 1회). 실시간 구독과 병렬이므로 배열 통째 교체 대신
  // 함수형 머지로 합쳐, 그 사이 도착한 실시간 메시지가 유실되지 않게 한다.
  useEffect(() => {
    if (sessionId == null) return
    let cancelled = false
    fetchClassroomChats(sessionId)
      .then((list) => {
        if (cancelled) return
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.chatId))
          const history = (list || []).filter((m) => !seen.has(m.chatId))
          return [...history, ...prev] // 이력을 앞에, 실시간분은 뒤에 유지
        })
      })
      .catch(() => { /* 이력 없거나 권한 문제 — 빈 채로 시작 */ })
    return () => { cancelled = true }
  }, [sessionId])

  // 실시간 구독 — connected가 true로 전환될 때마다 (재)등록해 재연결 시 수신을 복구한다.
  useEffect(() => {
    if (!connected || sessionId == null) return
    const unsubscribe = subscribeClassroomChat(sessionId, (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.chatId === msg.chatId) ? prev : [...prev, msg],
      )
    })
    return unsubscribe
  }, [connected, sessionId])

  // 자동 스크롤 — 패널을 열 때, 또는 사용자가 바닥 근처에 있을 때만(지난 대화 읽는 중엔 방해하지 않음)
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (open || nearBottom) el.scrollTop = el.scrollHeight
  }, [messages, open])

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
