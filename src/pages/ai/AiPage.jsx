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
import { streamAiQuestion, fetchConversations, fetchConversation, deleteConversation } from '../../api/aiApi.js'
import { fetchSubscriptionSummary } from '../../api/subscriptionApi.js'
import { createWrongAnswerNote } from '../../api/wrongAnswerNoteApi.js'
import { uploadImage, prepareImageForUpload, toAbsoluteFileUrl } from '../../api/fileApi.js'
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
  const [hasAiSubscription, setHasAiSubscription] = useState(true) // 기본값은 깜빡임 방지용 true

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
  const [wrongNoteError, setWrongNoteError] = useState('')
  const [wrongNoteDraft, setWrongNoteDraft] = useState(null)
  const [savingWrongNote, setSavingWrongNote] = useState(false)

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
  }, [messages, thinking, wrongNoteDraft])

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
    setWrongNoteDraft(null)
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
    
    Promise.all([
      fetchSubjects().catch((e) => {
        if (alive) setSubjectsError(e?.message || '과목을 불러오지 못했어요.')
        return []
      }),
      fetchSubscriptionSummary().catch(() => null)
    ]).then(([list, subSummary]) => {
      if (!alive) return
      
      const decorated = decorateSubjects(list)
      setSubjects(decorated)
      const first = decorated[0] ?? null
      setSubject(first)
      if (first) loadConversations(first.id)
      
      if (subSummary?.subscriptions) {
        const activeAi = subSummary.subscriptions.some(s => s.type === 'AI_QUESTION' && s.status === 'ACTIVE')
        setHasAiSubscription(activeAi)
      } else {
        setHasAiSubscription(false)
      }
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
    setWrongNoteDraft(null)
    setWrongNoteError('')
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
          setWrongNoteDraft(buildAiWrongNoteDraft(saved, subject))
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
    setWrongNoteError('')
    setWrongNoteDraft(null)
    loadConversations(s.id)
  }

  /** 대화 클릭 → 그 대화 전체 로드. */
  function handleSelectConversation(conv) {
    if (conv.conversationId === currentConversationId) return
    loadConversation(conv.conversationId)
  }

  /** 대화 삭제 → 확인 후 백엔드 삭제 + 사이드바에서 제거. 보고 있던 대화면 새 대화로 초기화. */
  async function handleDeleteConversation(conv) {
    const ok = window.confirm(`'${conv.title}' 대화를 삭제할까요?\n질문·답변 기록이 함께 삭제되며 되돌릴 수 없어요.`)
    if (!ok) return
    try {
      await deleteConversation(conv.conversationId)
      setConversations((prev) => prev.filter((c) => c.conversationId !== conv.conversationId))
      if (conv.conversationId === currentConversationId) {
        // 지금 보고 있던 대화를 지웠다면 진행 중 스트림을 멈추고 새 대화 상태로 돌아간다.
        abortRef.current?.abort()
        streamingIdRef.current = null
        setThinking(false)
        setCurrentConversationId(null)
        setMessages([])
        setWrongNoteDraft(null)
        setWrongNoteError('')
      }
    } catch (e) {
      window.alert(e?.message || '대화 삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
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
    setWrongNoteError('')
    setWrongNoteDraft(null)
  }

  async function handleCreateWrongNote() {
    if (!wrongNoteDraft) return
    setSavingWrongNote(true)
    setWrongNoteError('')
    try {
      await createWrongAnswerNote(wrongNoteDraft)
      setWrongNoteDraft(null)
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: 'ai', text: '오답노트에 추가했어요. 내정보 > 오답노트에서 다시 볼 수 있습니다.', time: nowLabel() },
      ])
    } catch (e) {
      setWrongNoteError(e?.message || '오답노트 추가에 실패했어요.')
    } finally {
      setSavingWrongNote(false)
    }
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
        onDelete={handleDeleteConversation}
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

              {wrongNoteDraft && (
                <div className="ai-wrong-note-prompt">
                  <div>
                    <strong>이 AI 답변을 오답노트에 추가할까요?</strong>
                    <p>질문, 첨부 이미지, AI 답변을 오답노트로 복사합니다.</p>
                  </div>
                  {wrongNoteError && <p className="mp-feedback mp-feedback--error">{wrongNoteError}</p>}
                  <div className="ai-wrong-note-prompt__actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={savingWrongNote}
                      onClick={() => {
                        setWrongNoteDraft(null)
                        setWrongNoteError('')
                      }}
                    >
                      나중에
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={savingWrongNote}
                      onClick={handleCreateWrongNote}
                    >
                      {savingWrongNote ? '추가 중...' : '오답노트 추가'}
                    </button>
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
          disabledText={hasAiSubscription ? '' : 'AI 질문 구독권을 구매해야 사용할 수 있어요.'}
        />
      </section>
    </div>
  )
}

function buildAiWrongNoteDraft(saved, fallbackSubject) {
  const sourceQuestionId = Number(saved.aiQuestionId ?? saved.questionId ?? saved.id)
  if (!Number.isFinite(sourceQuestionId)) {
    console.warn('[buildAiWrongNoteDraft] sourceQuestionId를 찾을 수 없습니다', saved)
    return null
  }

  const subjectId = saved.subject?.subjectId ?? saved.subject?.id ?? saved.subjectId ?? fallbackSubject?.id ?? null
  const subjectName = saved.subject?.name ?? fallbackSubject?.name
  return {
    sourceType: 'AI',
    sourceQuestionId,
    subjectId,
    title: toTitle(saved.questionText),
    questionContent: contentWithImages({
      content: saved.questionText,
      images: saved.questionImageUrls ?? saved.imageUrls ?? [],
      imageLabel: 'AI 질문 첨부',
    }),
    answerContent: normalizeAiNoteText(saved.answerText),
    wrongReason: 'AI 질문 답변을 오답노트로 옮겼습니다.',
    tags: ['AI 질문', subjectName].filter(Boolean),
  }
}

function contentWithImages({ content, images, imageLabel }) {
  const lines = []
  const normalizedContent = normalizeAiNoteText(content)
  if (normalizedContent) lines.push(normalizedContent)
  ;(images ?? []).forEach((url, index) => {
    if (url) lines.push(`![${imageLabel} ${index + 1}](${toAbsoluteFileUrl(url)})`)
  })
  return lines.join('\n\n')
}

/**
 * AI 답변을 오답노트로 옮길 때 텍스트 가공.
 * "받은 그대로 정확하게" 보이도록, 줄바꿈 정규화(\r\n→\n)와 양끝 공백 제거만 한다.
 * (수식 구분자 변환·렌더링은 오답노트가 AI 말풍선과 동일한 normalizeMath로 처리하므로 여기서 손대지 않는다)
 */
function normalizeAiNoteText(text) {
  if (!text) return ''
  return text.replace(/\r\n?/g, '\n').trim()
}
