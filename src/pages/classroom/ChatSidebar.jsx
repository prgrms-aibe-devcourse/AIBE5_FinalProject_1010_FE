/**
 * @file ChatSidebar.jsx
 * @description 강의실 우측 실시간 채팅 패널 (STOMP 실연동).
 * - 1:1 채팅처럼 텍스트 + 이미지(사진)를 함께 보낼 수 있다(사진 첨부 후 텍스트 입력 → 한 번에 전송).
 * - 메시지의 사진을 클릭하면 모달(라이트박스)로 원본을 본다.
 * - 입장 시 이력을 함수형 머지로 합치고, 연결될 때마다 (재)구독한다. 전송 실패는 화면에 표시.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  connectChat,
  onSocketStatus,
  subscribeClassroomChat,
  subscribeErrors,
  sendClassroomMessage,
  sendChatLike,
  subscribeChatLikes,
} from '../../api/chatSocket.js'
import { fetchClassroomChats } from '../../api/classroomApi.js'
import { uploadImage, prepareImageForUpload, toAbsoluteFileUrl } from '../../api/fileApi.js'
import { getCurrentUserId } from '../../auth/currentUser.js'

/** 메시지 본문 — IMAGE면 첨부 이미지(+캡션), 아니면 텍스트. 이미지 클릭 시 onImageClick(원본URL). */
function MessageBody({ m, onImageClick }) {
  const isImage = m.messageType === 'IMAGE' && Array.isArray(m.attachments) && m.attachments.length > 0
  return (
    <>
      {isImage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {m.attachments.map((a) => {
            const full = toAbsoluteFileUrl(a.fileUrl)
            return (
              <img
                key={a.fileId}
                src={toAbsoluteFileUrl(a.thumbnailUrl || a.fileUrl)}
                alt={a.originalFileName || '이미지'}
                onClick={() => onImageClick?.(full)}
                style={{ maxWidth: 200, maxHeight: 240, borderRadius: 8, cursor: 'zoom-in', display: 'block', objectFit: 'cover' }}
              />
            )
          })}
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
  const [pending, setPending] = useState([]) // 전송 대기 사진 [{ fileId, url }]
  const [lightboxUrl, setLightboxUrl] = useState(null) // 모달로 볼 원본 이미지
  const feedRef = useRef(null)
  const seenRef = useRef(0)

  // 안읽음 계산 — 열려 있으면 0, 닫혀 있으면 그동안 쌓인 개수.
  useEffect(() => {
    if (open) {
      seenRef.current = messages.length
      onUnreadChange?.(0)
    } else {
      onUnreadChange?.(Math.max(0, messages.length - seenRef.current))
    }
  }, [messages, open, onUnreadChange])

  // 연결 상태 추적 + 연결 시도
  useEffect(() => {
    const off = onSocketStatus((s) => setConnected(s === 'connected'))
    connectChat().then(() => setConnected(true)).catch(() => {})
    return off
  }, [])

  // 이력 로드(함수형 머지로 실시간분 보존)
  useEffect(() => {
    if (sessionId == null) return
    let cancelled = false
    fetchClassroomChats(sessionId)
      .then((list) => {
        if (cancelled) return
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.chatId))
          const history = (list || []).filter((m) => !seen.has(m.chatId))
          return [...history, ...prev]
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [sessionId])

  // 실시간 구독(재연결 시 복구)
  useEffect(() => {
    if (!connected || sessionId == null) return
    return subscribeClassroomChat(sessionId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.chatId === msg.chatId) ? prev : [...prev, msg]))
    })
  }, [connected, sessionId])

  // 전송 실패(서버 거부) 표시
  useEffect(() => {
    if (!connected) return undefined
    return subscribeErrors((err) => setErrorMsg(err?.message || '전송에 실패했어요.'))
  }, [connected])

  // 채팅 좋아요 변경 구독 — 해당 메시지의 likeCount를 서버 값으로 갱신(전원 동기화)
  useEffect(() => {
    if (!connected || sessionId == null) return undefined
    return subscribeChatLikes(sessionId, ({ chatId, likeCount }) => {
      setMessages((prev) => prev.map((m) => (m.chatId === chatId ? { ...m, likeCount } : m)))
    })
  }, [connected, sessionId])

  // 좋아요 토글 — 낙관적으로 내 상태/카운트 즉시 반영(브로드캐스트가 최종 카운트로 확정)
  function handleLike(chatId) {
    setMessages((prev) => prev.map((m) => (
      m.chatId === chatId
        ? { ...m, likedByMe: !m.likedByMe, likeCount: Math.max(0, (m.likeCount || 0) + (m.likedByMe ? -1 : 1)) }
        : m
    )))
    sendChatLike(sessionId, chatId)
  }
  useEffect(() => {
    if (!errorMsg) return undefined
    const t = setTimeout(() => setErrorMsg(''), 4000)
    return () => clearTimeout(t)
  }, [errorMsg])

  // 자동 스크롤
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (open || nearBottom) el.scrollTop = el.scrollHeight
  }, [messages, open, pending])

  // 사진 선택 → 업로드해서 "전송 대기"에 올린다(아직 전송 X). 텍스트와 함께 보낼 수 있게.
  async function handlePickImages(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    setUploading(true)
    try {
      for (const f of files) {
        const prepared = await prepareImageForUpload(f).catch(() => f)
        const up = await uploadImage(prepared)
        if (up?.fileId != null) {
          setPending((prev) => [...prev, { fileId: up.fileId, url: toAbsoluteFileUrl(up.fileUrl) }])
        }
      }
    } catch (err) {
      console.error('[classroom-chat] 이미지 업로드 실패', err)
      setErrorMsg('이미지 업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  const removePending = (fileId) => setPending((prev) => prev.filter((p) => p.fileId !== fileId))

  // 전송 — 대기 사진이 있으면 IMAGE(+캡션), 없으면 TEXT.
  function handleSend(e) {
    e?.preventDefault()
    if (sessionId == null || uploading) return
    const text = draft.trim()
    if (pending.length > 0) {
      const ok = sendClassroomMessage(sessionId, { messageType: 'IMAGE', content: text, fileIds: pending.map((p) => p.fileId) })
      if (ok) { setDraft(''); setPending([]) }
    } else if (text) {
      const ok = sendClassroomMessage(sessionId, { messageType: 'TEXT', content: text })
      if (ok) setDraft('')
    }
  }

  const canSend = connected && !uploading && (draft.trim().length > 0 || pending.length > 0)

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
          const likeBtn = (
            <button
              type="button"
              onClick={() => handleLike(m.chatId)}
              title="좋아요"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, padding: '2px 4px', display: 'inline-flex', alignItems: 'center', gap: 3, opacity: m.likedByMe ? 1 : 0.5 }}
            >
              <span>{m.likedByMe ? '❤️' : '🤍'}</span>
              {m.likeCount > 0 && <span style={{ fontWeight: 800, color: 'var(--soft-text-dim)' }}>{m.likeCount}</span>}
            </button>
          )
          return mine ? (
            <div key={m.chatId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div className="chat-bubble me"><MessageBody m={m} onImageClick={setLightboxUrl} /></div>
              {likeBtn}
            </div>
          ) : (
            <div key={m.chatId} className="chat-msg">
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--soft-text-dim)', marginLeft: '4px', marginBottom: '4px' }}>
                {m.senderName}
              </div>
              <div className="chat-bubble other"><MessageBody m={m} onImageClick={setLightboxUrl} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>{likeBtn}</div>
            </div>
          )
        })}
      </div>

      {errorMsg && (
        <div style={{ margin: '0 12px 6px', fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>⚠️ {errorMsg}</div>
      )}

      {/* 전송 대기 사진 미리보기(여러 장) — ✕로 제거 */}
      {(pending.length > 0 || uploading) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 12px 8px' }}>
          {pending.map((p) => (
            <div key={p.fileId} style={{ position: 'relative' }}>
              <img src={p.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--soft-border)' }} />
              <button
                type="button"
                onClick={() => removePending(p.fileId)}
                title="제거"
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#111827', color: '#fff', fontSize: 11, lineHeight: '18px', cursor: 'pointer', padding: 0 }}
              >✕</button>
            </div>
          ))}
          {uploading && <div style={{ width: 48, height: 48, borderRadius: 6, border: '1px dashed var(--soft-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--soft-text-dim)' }}>…</div>}
        </div>
      )}

      {/* 입력 영역 — 사진 첨부 + 텍스트, 함께 전송 */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="modern-input-box">
          <label className="send-btn" title="사진 첨부" style={{ cursor: !connected ? 'not-allowed' : 'pointer', opacity: !connected ? 0.5 : 1 }}>
            🖼️
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              disabled={!connected}
              onChange={(e) => { handlePickImages(e.target.files); e.target.value = '' }}
            />
          </label>
          <input
            type="text"
            placeholder={connected ? (pending.length ? '사진과 함께 보낼 메시지(선택)...' : '메시지를 입력하세요...') : '연결 중...'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!connected}
          />
          <button type="submit" className="send-btn" title="전송" disabled={!canSend}>🚀</button>
        </div>
      </form>

      {/* 사진 모달(라이트박스) — body로 포털해 패널/오버플로우 영향 없이 전체 화면 */}
      {lightboxUrl && createPortal(
        <div
          onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img src={lightboxUrl} alt="" style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 8, boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }} />
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null) }}
            title="닫기"
            style={{ position: 'absolute', top: 20, right: 24, width: 40, height: 40, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 20, cursor: 'pointer' }}
          >✕</button>
        </div>,
        document.body,
      )}
    </aside>
  )
}
