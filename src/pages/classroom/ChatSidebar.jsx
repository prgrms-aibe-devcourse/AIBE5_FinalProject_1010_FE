/**
 * @file ChatSidebar.jsx
 * @description 강의실 우측 실시간 채팅 패널 (STOMP 실연동).
 * - 1:1 채팅처럼 텍스트 + 이미지(사진) 전송을 지원한다(이미지는 업로드 후 fileIds로 전송).
 * - 입장 시 이력(GET /classroom-sessions/{id}/chats)을 함수형 머지로 합치고(실시간 수신분 보존),
 *   연결될 때마다 /sub/classroom-sessions/{id}/chats 를 (재)구독한다(재연결 시 수신 복구).
 * - 내 메시지(senderId === 현재 사용자)는 오른쪽 앰버, 상대는 왼쪽 베이지 말풍선으로 정렬한다.
 */
import { useEffect, useRef, useState } from 'react'
import {
  connectChat,
  onSocketStatus,
  subscribeClassroomChat,
  subscribeErrors,
  sendClassroomMessage,
} from '../../api/chatSocket.js'
import { fetchClassroomChats } from '../../api/classroomApi.js'
import { uploadImage, prepareImageForUpload, toAbsoluteFileUrl } from '../../api/fileApi.js'
import { getCurrentUserId } from '../../auth/currentUser.js'

/** 메시지 본문 — IMAGE면 첨부 이미지(+캡션), 아니면 텍스트 */
function MessageBody({ m }) {
  const isImage = m.messageType === 'IMAGE' && Array.isArray(m.attachments) && m.attachments.length > 0
  return (
    <>
      {isImage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {m.attachments.map((a) => (
            <img
              key={a.fileId}
              src={toAbsoluteFileUrl(a.thumbnailUrl || a.fileUrl)}
              alt={a.originalFileName || '이미지'}
              onClick={() => window.open(toAbsoluteFileUrl(a.fileUrl), '_blank', 'noopener')}
              style={{ maxWidth: 200, maxHeight: 240, borderRadius: 8, cursor: 'zoom-in', display: 'block', objectFit: 'cover' }}
            />
          ))}
        </div>
      )}
      {m.content && <div style={{ marginTop: isImage ? 4 : 0, whiteSpace: 'pre-wrap' }}>{m.content}</div>}
    </>
  )
}

export default function ChatSidebar({ sessionId, open = true, onUnreadChange }) {
  const myId = getCurrentUserId()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [connected, setConnected] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
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

  // 전송 실패(서버 거부) 표시 — 그동안 /user/sub/errors로만 가서 조용히 실패하던 것을 화면에 보여준다.
  useEffect(() => {
    if (!connected) return undefined
    const off = subscribeErrors((err) => setErrorMsg(err?.message || '전송에 실패했어요.'))
    return off
  }, [connected])
  useEffect(() => {
    if (!errorMsg) return undefined
    const t = setTimeout(() => setErrorMsg(''), 4000)
    return () => clearTimeout(t)
  }, [errorMsg])

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
    const ok = sendClassroomMessage(sessionId, { messageType: 'TEXT', content: text })
    if (ok) setDraft('')
  }

  // 사진 전송 — 선택한 이미지들을 업로드(정규화 후)하고 fileIds로 IMAGE 메시지 1건 전송. draft가 있으면 캡션.
  async function handlePickImages(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (!files.length || sessionId == null) return
    setUploading(true)
    try {
      const fileIds = []
      for (const f of files) {
        const prepared = await prepareImageForUpload(f).catch(() => f)
        const up = await uploadImage(prepared)
        if (up?.fileId != null) fileIds.push(up.fileId)
      }
      if (fileIds.length) {
        sendClassroomMessage(sessionId, { messageType: 'IMAGE', content: draft.trim(), fileIds })
        setDraft('')
      }
    } catch (err) {
      console.error('[classroom-chat] 이미지 전송 실패', err)
    } finally {
      setUploading(false)
    }
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
            <div key={m.chatId} className="chat-bubble me"><MessageBody m={m} /></div>
          ) : (
            <div key={m.chatId} className="chat-msg">
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--soft-text-dim)', marginLeft: '4px', marginBottom: '4px' }}>
                {m.senderName}
              </div>
              <div className="chat-bubble other"><MessageBody m={m} /></div>
            </div>
          )
        })}
      </div>

      {errorMsg && (
        <div style={{ margin: '0 12px 6px', fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>⚠️ {errorMsg}</div>
      )}

      {/* 채팅 입력 영역 — 텍스트 + 사진 첨부 */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="modern-input-box">
          {/* 사진 첨부 */}
          <label className="send-btn" title="사진 보내기" style={{ cursor: uploading || !connected ? 'not-allowed' : 'pointer', opacity: uploading || !connected ? 0.5 : 1 }}>
            🖼️
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              disabled={!connected || uploading}
              onChange={(e) => { handlePickImages(e.target.files); e.target.value = '' }}
            />
          </label>
          <input
            type="text"
            placeholder={uploading ? '사진 업로드 중...' : (connected ? '메시지를 입력하세요...' : '연결 중...')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!connected || uploading}
          />
          <button type="submit" className="send-btn" title="전송" disabled={!connected || uploading || !draft.trim()}>🚀</button>
        </div>
      </form>
    </aside>
  )
}
