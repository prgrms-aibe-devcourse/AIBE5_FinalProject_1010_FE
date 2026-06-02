/**
 * @file AiPage.jsx
 * @description 과목별 AI 문제풀이 질문 페이지(/ai).
 *
 * 대화 모델: "과목 = 하나의 연속 대화".
 *  - 과목을 선택하면 그 과목으로 했던 모든 질문·답변을 시간순으로 한 화면에 쭉 보여준다.
 *  - 새 질문은 그 대화 맨 아래에 계속 쌓인다(스트리밍).
 *  - 좌측 기록(현재 과목 것만) 클릭 시 해당 질문 위치로 스크롤한다.
 *
 * 백엔드(SubjectController · AiQuestionController):
 *  - GET  /api/v1/subjects            과목 8개
 *  - GET  /api/v1/ai/questions        기록 목록(답변 제외)
 *  - GET  /api/v1/ai/questions/{id}   기록 상세(질문+답변) — 대화 복원용
 *  - POST /api/v1/ai/questions/stream 질문(SSE 스트리밍)
 */
import { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import { fetchSubjects } from '../../api/subjectApi.js'
import { streamAiQuestion, fetchAiHistory, fetchAiQuestion } from '../../api/aiApi.js'
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

/** 기록 항목의 createdAt을 짧은 라벨(예: "6. 2.")로 변환한다. */
function historyTimeLabel(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

/** 백엔드 기록 페이지 → 사이드바용 항목 목록. */
function mapHistory(page) {
  return (page?.content ?? []).map((h) => ({
    aiQuestionId: h.aiQuestionId,
    subjectId: h.subject?.subjectId,
    title: h.questionText,
    time: historyTimeLabel(h.createdAt),
  }))
}

export default function AiPage() {
  const [subjects, setSubjects] = useState([])
  const [subject, setSubject] = useState(null)
  const [subjectsError, setSubjectsError] = useState('')

  const [messages, setMessages] = useState([]) // { id, role, text, time, qid? }
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)

  const [history, setHistory] = useState([])
  const [scrollToQid, setScrollToQid] = useState(null)

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects],
  )

  const streamingIdRef = useRef(null)
  const abortRef = useRef(null)
  const msgIdRef = useRef(0)
  const nextMsgId = () => (msgIdRef.current += 1)
  const bottomRef = useRef(null)

  // 메시지/타이핑 변화 시 맨 아래로 스크롤.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // 기록 클릭 시 해당 질문 위치로 스크롤.
  useEffect(() => {
    if (scrollToQid == null) return
    const el = document.getElementById(`thread-q-${scrollToQid}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setScrollToQid(null)
  }, [scrollToQid, messages])

  /**
   * 한 과목의 전체 대화(과거 질문+답변)를 시간순으로 불러와 messages로 만든다.
   * @param {object} subj  대상 과목
   * @param {object[]} items 현재 기록 목록(상태 타이밍 의존을 피하려 인자로 받음)
   */
  function loadSubjectThread(subj, items) {
    const ids = items.filter((h) => h.subjectId === subj.id).map((h) => h.aiQuestionId)
    if (ids.length === 0) {
      setMessages([])
      return
    }
    setThreadLoading(true)
    Promise.all(ids.map((id) => fetchAiQuestion(id).catch(() => null)))
      .then((results) => {
        const valid = results
          .filter(Boolean)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // 오래된 순(위 → 아래)
        const msgs = []
        for (const q of valid) {
          const t = q.createdAt ? nowLabel(new Date(q.createdAt)) : ''
          msgs.push({ id: nextMsgId(), role: 'user', text: q.questionText, time: t, qid: q.aiQuestionId })
          msgs.push({ id: nextMsgId(), role: 'ai', text: q.answerText, time: t })
        }
        setMessages(msgs)
      })
      .finally(() => setThreadLoading(false))
  }

  // 마운트: 과목 → 기록 → 첫 과목 대화 로드.
  useEffect(() => {
    let alive = true
    fetchSubjects()
      .then((list) => {
        if (!alive) return
        const decorated = decorateSubjects(list)
        setSubjects(decorated)
        const first = decorated[0] ?? null
        setSubject(first)
        return fetchAiHistory({ size: 100 })
          .then((page) => {
            if (!alive) return
            const items = mapHistory(page)
            setHistory(items)
            if (first) loadSubjectThread(first, items)
          })
          .catch(() => { if (alive && first) setMessages([]) })
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

  /** 질문 전송 → 스트리밍 답변을 현재 대화 맨 아래에 이어붙인다. */
  function handleSend(preset) {
    const text = (typeof preset === 'string' ? preset : input).trim()
    if (!text || thinking || !subject) return

    const currentSubject = subject
    setMessages((prev) => [...prev, { id: nextMsgId(), role: 'user', text, time: nowLabel() }])
    setInput('')
    setThinking(true)
    streamingIdRef.current = null

    const controller = new AbortController()
    abortRef.current = controller

    const handleError = (msg) => {
      const id = streamingIdRef.current
      streamingIdRef.current = null
      setThinking(false)
      const note = `⚠️ ${msg || 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'}`
      setMessages((prev) => {
        if (id != null) {
          return prev.map((m) => (m.id === id ? { ...m, text: m.text ? `${m.text}\n\n${note}` : note } : m))
        }
        return [...prev, { id: nextMsgId(), role: 'ai', text: note, time: nowLabel() }]
      })
    }

    streamAiQuestion(
      { subjectId: currentSubject.id, questionText: text },
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
          if (saved?.aiQuestionId != null) {
            setHistory((prev) => [
              { aiQuestionId: saved.aiQuestionId, subjectId: saved.subjectId, title: saved.questionText, time: '방금 전' },
              ...prev,
            ])
          }
        },
        onError: handleError,
      },
    ).catch(() => handleError())
  }

  /** 과목 변경 → 그 과목의 전체 대화를 불러온다. */
  function handleSelectSubject(s) {
    if (s.id === subject?.id) return
    abortRef.current?.abort()
    streamingIdRef.current = null
    setThinking(false)
    setSubject(s)
    loadSubjectThread(s, history)
  }

  /** 좌측 기록 클릭 → (같은 과목 대화 안에서) 해당 질문 위치로 스크롤. */
  function handleSelectHistory(item) {
    // 기록은 현재 과목으로 필터되어 있으므로 같은 대화 안에 이미 렌더되어 있다.
    setScrollToQid(item.aiQuestionId)
  }

  /** "새 질문" → 대화는 유지하고 입력창(맨 아래)으로 이동해 새 질문을 입력. */
  function handleNewChat() {
    setInput('')
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const showTyping = thinking && streamingIdRef.current == null
  const visibleHistory = subject ? history.filter((h) => h.subjectId === subject.id) : history

  return (
    <div className="ai-layout">
      <HistorySidebar
        history={visibleHistory}
        subjects={subjects}
        onNewChat={handleNewChat}
        onSelect={handleSelectHistory}
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
              <p className="ai-empty-sub">{subject.name} 대화를 불러오는 중…</p>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState subject={subject} onPickExample={(ex) => handleSend(ex)} />
          ) : (
            <div className="ai-msg-list">
              {messages.map((m) => (
                <Fragment key={m.id}>
                  {m.qid != null && <div id={`thread-q-${m.qid}`} className="ai-thread-anchor" />}
                  <MessageBubble role={m.role} text={m.text} time={m.time} />
                </Fragment>
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
        />
      </section>
    </div>
  )
}
