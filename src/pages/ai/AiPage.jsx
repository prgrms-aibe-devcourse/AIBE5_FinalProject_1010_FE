/**
 * @file AiPage.jsx
 * @description 과목별 AI 문제풀이 질문 페이지(/ai). ChatGPT식 "대화(Conversation)" 모델.
 *
 *  - 좌측 사이드바 = 대화 목록(타이틀). "새 질문"으로 새 대화 시작.
 *  - 한 대화 안에서 질문을 이어서 하면 한 화면에 쭉 쌓인다(스트리밍).
 *  - 대화 타이틀 클릭 → 그 대화의 질문·답변 전체를 불러와 복원.
 *  - 대화는 과목에 소속(과목 전환 시 그 과목의 대화 목록을 로드).
 *
 * 백엔드:
 *  GET  /api/v1/subjects
 *  GET  /api/v1/ai/conversations?subjectId=     대화 목록(타이틀)
 *  GET  /api/v1/ai/conversations/{id}           대화 상세(질문+답변)
 *  POST /api/v1/ai/questions/stream             질문(SSE). conversationId 없으면 새 대화 생성
 */
import { useState, useRef, useEffect } from 'react'
import { fetchSubjects } from '../../api/subjectApi.js'
import { streamAiQuestion, fetchConversations, fetchConversation } from '../../api/aiApi.js'
import { uploadImage, prepareImageForUpload } from '../../api/fileApi.js'
import { decorateSubjects } from '../../data/aiSubjectMeta.js'
import HistorySidebar from './HistorySidebar.jsx'
import SubjectBar from './SubjectBar.jsx'
import MessageBubble from './MessageBubble.jsx'
import EmptyState from './EmptyState.jsx'
import Composer from './Composer.jsx'

/** 주어진(또는 현재) 시각을 "오후 2:03" 형태로 만든다. */
function nowLabel(d = new Date()) {
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}:${m}`
}

/** 날짜를 짧은 라벨(예: "6. 2.")로 변환한다. */
function shortDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

/** 첫 질문을 대화 제목용으로 자른다(백엔드 규칙과 동일: 30자 + …). */
function toTitle(q) {
  const t = (q ?? '').trim()
  if (!t) return '새 대화'
  return t.length <= 30 ? t : `${t.slice(0, 30)}…`
}

/** 백엔드 대화 목록 → 사이드바 항목. */
function mapConversations(list) {
  return (list ?? []).map((c) => ({
    conversationId: c.conversationId,
    title: c.title,
    subjectId: c.subjectId,
    time: shortDate(c.updatedAt || c.createdAt),
  }))
}

export default function AiPage() {
  const [subjects, setSubjects] = useState([])
  const [subject, setSubject] = useState(null)
  const [subjectsError, setSubjectsError] = useState('')

  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)

  const [messages, setMessages] = useState([]) // { id, role, text, time, images? }
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)
  // 첨부 대기 이미지: { key, file, previewUrl, name }
  const [attachments, setAttachments] = useState([])
  const [preparing, setPreparing] = useState(false) // 이미지 변환/축소 진행 중
  const [attachError, setAttachError] = useState('')

  const streamingIdRef = useRef(null)
  const abortRef = useRef(null)
  const msgIdRef = useRef(0)
  const nextMsgId = () => (msgIdRef.current += 1)
  const attachKeyRef = useRef(0)
  const bottomRef = useRef(null)

  /**
   * 첨부 후보 추가(파일 선택).
   * 업로드 직전이 아니라 이 시점에 정규화(HEIC→JPEG·축소)해서, 미리보기도 변환된 이미지로
   * 바로 보이고(아이폰 HEIC는 변환 전엔 썸네일이 안 뜸) 전송도 빨라지게 한다.
   */
  async function handleAddFiles(fileList) {
    setAttachError('')
    setPreparing(true)
    try {
      for (const original of Array.from(fileList)) {
        try {
          const prepared = await prepareImageForUpload(original)
          const key = (attachKeyRef.current += 1)
          setAttachments((prev) => [
            ...prev,
            { key, file: prepared, previewUrl: URL.createObjectURL(prepared), name: original.name },
          ])
        } catch {
          setAttachError(`'${original.name}'을(를) 불러오지 못했어요. JPG·PNG로 변환해 다시 시도해주세요.`)
        }
      }
    } finally {
      setPreparing(false)
    }
  }

  /** 첨부 후보 제거. blob URL도 해제한다. */
  function handleRemoveAttachment(key) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.key === key)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((a) => a.key !== key)
    })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  /** 과목의 대화 목록을 불러온다. */
  function loadConversations(subjectId) {
    fetchConversations(subjectId)
      .then((list) => setConversations(mapConversations(list)))
      .catch(() => setConversations([]))
  }

  /** 대화 하나를 통째로 불러와 대화창에 복원한다. */
  function loadConversation(conversationId) {
    abortRef.current?.abort()
    streamingIdRef.current = null
    setThinking(false)
    setCurrentConversationId(conversationId)
    setThreadLoading(true)
    fetchConversation(conversationId)
      .then((detail) => {
        const msgs = []
        for (const q of detail.questions ?? []) {
          const t = q.createdAt ? nowLabel(new Date(q.createdAt)) : ''
          msgs.push({ id: nextMsgId(), role: 'user', text: q.questionText, time: t, images: q.questionImageUrls ?? [] })
          msgs.push({ id: nextMsgId(), role: 'ai', text: q.answerText, time: t })
        }
        setMessages(msgs)
      })
      .catch(() => {
        setMessages([{ id: nextMsgId(), role: 'ai', text: '⚠️ 대화를 불러오지 못했어요. 잠시 후 다시 시도해주세요.', time: nowLabel() }])
      })
      .finally(() => setThreadLoading(false))
  }

  // 마운트: 과목 → 첫 과목의 대화 목록. 대화창은 "새 대화"(빈 상태)로 시작.
  useEffect(() => {
    let alive = true
    fetchSubjects()
      .then((list) => {
        if (!alive) return
        const decorated = decorateSubjects(list)
        setSubjects(decorated)
        const first = decorated[0] ?? null
        setSubject(first)
        if (first) loadConversations(first.id)
      })
      .catch((e) => {
        if (alive) setSubjectsError(e?.message || '과목을 불러오지 못했어요.')
      })
    return () => {
      alive = false
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 질문 전송(현재 대화에 이어쓰기; 대화 없으면 새 대화 생성). */
  async function handleSend(preset) {
    const typed = (typeof preset === 'string' ? preset : input).trim()
    // 첨부만 보내는 경우 기본 질문 문구를 채운다(백엔드는 questionText 필수).
    const pending = attachments
    const text = typed || (pending.length > 0 ? '첨부한 이미지를 풀이해줘.' : '')
    if (!text || thinking || !subject) return

    const subjectId = subject.id
    const convId = currentConversationId // null이면 새 대화

    // 낙관적 사용자 말풍선: 첨부 미리보기(blob URL)를 그대로 보여준다.
    setMessages((prev) => [
      ...prev,
      { id: nextMsgId(), role: 'user', text, time: nowLabel(), images: pending.map((a) => a.previewUrl) },
    ])
    setInput('')
    setAttachments([]) // 입력창의 첨부 후보는 비운다(미리보기 blob URL은 말풍선이 계속 사용)
    setThinking(true)
    streamingIdRef.current = null

    const controller = new AbortController()
    abortRef.current = controller

    // 첨부 이미지를 먼저 업로드해 fileId 목록을 얻는다. 실패하면 전송을 중단한다.
    let questionImageFileIds = null
    if (pending.length > 0) {
      try {
        const uploaded = await Promise.all(pending.map((a) => uploadImage(a.file)))
        questionImageFileIds = uploaded.map((u) => u.fileId)
      } catch (e) {
        setThinking(false)
        setMessages((prev) => [
          ...prev,
          { id: nextMsgId(), role: 'ai', text: `⚠️ 이미지 업로드에 실패했어요. ${e?.message || ''}`.trim(), time: nowLabel() },
        ])
        return
      }
    }

    const handleError = (msg) => {
      const id = streamingIdRef.current
      streamingIdRef.current = null
      setThinking(false)
      const note = `⚠️ ${msg || 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'}`
      setMessages((prev) => {
        if (id != null) return prev.map((m) => (m.id === id ? { ...m, text: m.text ? `${m.text}\n\n${note}` : note } : m))
        return [...prev, { id: nextMsgId(), role: 'ai', text: note, time: nowLabel() }]
      })
    }

    streamAiQuestion(
      { subjectId, questionText: text, questionImageFileIds, conversationId: convId },
      {
        signal: controller.signal,
        onToken: (chunk) => {
          if (streamingIdRef.current == null) {
            const id = nextMsgId()
            streamingIdRef.current = id
            setMessages((prev) => [...prev, { id, role: 'ai', text: chunk, time: nowLabel() }])
          } else {
            const id = streamingIdRef.current
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.text + chunk } : m)))
          }
        },
        onDone: (saved) => {
          streamingIdRef.current = null
          setThinking(false)
          if (saved?.conversationId == null) return
          // 새 대화였다면: 현재 대화로 고정 + 사이드바 맨 위에 추가(타이틀=첫 질문).
          if (convId == null) {
            setCurrentConversationId(saved.conversationId)
            setConversations((prev) => [
              { conversationId: saved.conversationId, title: toTitle(saved.questionText), subjectId: saved.subjectId, time: '방금 전' },
              ...prev,
            ])
          }
        },
        onError: handleError,
      },
    ).catch(() => handleError())
  }

  /** 과목 변경 → 그 과목의 대화 목록 로드 + 새 대화로 초기화. */
  function handleSelectSubject(s) {
    if (s.id === subject?.id) return
    abortRef.current?.abort()
    streamingIdRef.current = null
    setThinking(false)
    setSubject(s)
    setCurrentConversationId(null)
    setMessages([])
    setAttachments([])
    setAttachError('')
    loadConversations(s.id)
  }

  /** 대화 클릭 → 그 대화 전체 로드. */
  function handleSelectConversation(conv) {
    if (conv.conversationId === currentConversationId) return
    loadConversation(conv.conversationId)
  }

  /** "새 질문" → 새 대화 시작(현재 대화 비움). */
  function handleNewChat() {
    abortRef.current?.abort()
    streamingIdRef.current = null
    setThinking(false)
    setCurrentConversationId(null)
    setMessages([])
    setInput('')
    setAttachments([])
    setAttachError('')
  }

  const showTyping = thinking && streamingIdRef.current == null

  return (
    <div className="ai-layout">
      <HistorySidebar
        conversations={conversations}
        subjects={subjects}
        activeId={currentConversationId}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
      />

      <section className="ai-main">
        {subject && (
          <SubjectBar subjects={subjects} selectedId={subject.id} onSelect={handleSelectSubject} />
        )}

        <div className="ai-chat">
          {subjectsError ? (
            <div className="ai-empty">
              <div className="ai-orb"><span className="ai-orb-emoji">⚠️</span></div>
              <h1 className="ai-empty-title">과목을 불러오지 못했어요</h1>
              <p className="ai-empty-sub">{subjectsError} · 로그인 상태와 서버를 확인해주세요</p>
            </div>
          ) : !subject ? (
            <div className="ai-empty">
              <div className="ai-orb"><span className="ai-orb-emoji">⏳</span></div>
              <p className="ai-empty-sub">과목을 불러오는 중…</p>
            </div>
          ) : threadLoading ? (
            <div className="ai-empty">
              <div className="ai-orb"><span className="ai-orb-emoji">💬</span></div>
              <p className="ai-empty-sub">대화를 불러오는 중…</p>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState subject={subject} onPickExample={(ex) => handleSend(ex)} />
          ) : (
            <div className="ai-msg-list">
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} text={m.text} time={m.time} images={m.images} />
              ))}

              {showTyping && (
                <div className="ai-msg ai">
                  <div className="ai-msg-avatar">✨</div>
                  <div className="ai-msg-body">
                    <div className="ai-msg-name">StudyFlow AI</div>
                    <div className="ai-bubble ai-typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          thinking={thinking}
          subjectName={subject?.name ?? ''}
          attachments={attachments}
          onAddFiles={handleAddFiles}
          onRemoveAttachment={handleRemoveAttachment}
          preparing={preparing}
          attachError={attachError}
        />
      </section>
    </div>
  )
}
