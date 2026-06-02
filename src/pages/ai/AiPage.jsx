/**
 * @file AiPage.jsx
 * @description 과목별 AI 문제풀이 질문 페이지(/ai)의 최상위 컴포넌트입니다.
 * - 좌측: 질문 기록 사이드바(HistorySidebar)
 * - 우측: 과목 선택 바(SubjectBar) + 대화 영역(EmptyState / 말풍선들) + 입력창(Composer)
 *
 * 백엔드 연동(명세 §26 / SubjectController · AiQuestionController):
 *   - 과목 목록: GET  /api/v1/subjects            → 수능 8개 과목 칩
 *   - 질문(스트리밍): POST /api/v1/ai/questions/stream (SSE) → 토큰이 올 때마다 말풍선 갱신
 *   - 질문 기록: GET  /api/v1/ai/questions         → HistorySidebar
 *   인증 토큰은 authFetch가 자동 첨부합니다.
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { fetchSubjects } from '../../api/subjectApi.js'
import { streamAiQuestion, fetchAiHistory, fetchAiQuestion } from '../../api/aiApi.js'
import { decorateSubjects } from '../../data/aiSubjectMeta.js'
import HistorySidebar from './HistorySidebar.jsx'
import SubjectBar from './SubjectBar.jsx'
import MessageBubble from './MessageBubble.jsx'
import EmptyState from './EmptyState.jsx'
import Composer from './Composer.jsx'

/** 주어진(또는 현재) 시각을 "오후 2:03" 형태로 만들어 말풍선에 붙입니다. */
function nowLabel(d = new Date()) {
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}:${m}`
}

/** 기록 항목의 createdAt을 짧은 라벨(예: "6. 2.")로 변환합니다. */
function historyTimeLabel(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

export default function AiPage() {
  // 과목 목록(백엔드 8과목, 표시 메타 합성) + 선택 과목 + 로딩/에러 상태.
  const [subjects, setSubjects] = useState([])
  const [subject, setSubject] = useState(null)
  const [subjectsError, setSubjectsError] = useState('')

  // 현재 대화의 메시지 목록. { id, role:'user'|'ai', text, time }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  // 요청이 진행 중인지(입력 잠금). 스트리밍 첫 토큰 전에는 타이핑 인디케이터를 보여준다.
  const [thinking, setThinking] = useState(false)

  // 좌측 질문 기록.
  const [history, setHistory] = useState([])

  // subjectId → 표시 메타(아이콘 등) 빠른 조회용.
  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects],
  )

  // 스트리밍 중인 AI 메시지 id(첫 토큰에 생성). 콜백에서 stale 없이 쓰려고 ref로 둔다.
  const streamingIdRef = useRef(null)
  // 진행 중 스트림 취소용(언마운트/새 질문 시).
  const abortRef = useRef(null)

  // 메시지 고유 id 카운터.
  const msgIdRef = useRef(0)
  const nextMsgId = () => (msgIdRef.current += 1)

  // 새 메시지/타이핑 시 맨 아래로 스크롤.
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // 마운트 시 과목 목록과 질문 기록을 불러온다.
  useEffect(() => {
    let alive = true
    fetchSubjects()
      .then((list) => {
        if (!alive) return
        const decorated = decorateSubjects(list)
        setSubjects(decorated)
        setSubject((prev) => prev ?? decorated[0] ?? null)
      })
      .catch((e) => {
        if (alive) setSubjectsError(e?.message || '과목을 불러오지 못했어요.')
      })

    // 과목별로 걸러서 보여주므로, 한 번에 넉넉히 받아 클라이언트에서 필터한다.
    fetchAiHistory({ size: 100 })
      .then((page) => {
        if (!alive) return
        const items = (page?.content ?? []).map((h) => ({
          aiQuestionId: h.aiQuestionId,
          subjectId: h.subject?.subjectId,
          title: h.questionText,
          time: historyTimeLabel(h.createdAt),
        }))
        setHistory(items)
      })
      .catch(() => { /* 기록 조회 실패는 화면을 막지 않는다(빈 목록 유지). */ })

    return () => {
      alive = false
      abortRef.current?.abort()
    }
  }, [])

  /** 질문 전송 → 스트리밍 답변 수신. @param {string} [preset] 예시 카드로 들어온 질문 */
  function handleSend(preset) {
    const text = (typeof preset === 'string' ? preset : input).trim()
    if (!text || thinking || !subject) return

    const currentSubject = subject
    // 사용자 말풍선 추가.
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
          return prev.map((m) =>
            m.id === id ? { ...m, text: m.text ? `${m.text}\n\n${note}` : note } : m,
          )
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
            // 첫 토큰: AI 말풍선을 새로 만든다.
            const id = nextMsgId()
            streamingIdRef.current = id
            setMessages((prev) => [...prev, { id, role: 'ai', text: chunk, time: nowLabel() }])
          } else {
            const id = streamingIdRef.current
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, text: m.text + chunk } : m)),
            )
          }
        },
        onDone: (saved) => {
          streamingIdRef.current = null
          setThinking(false)
          if (saved?.aiQuestionId != null) {
            // 방금 질문을 기록 맨 위에 추가.
            setHistory((prev) => [
              {
                aiQuestionId: saved.aiQuestionId,
                subjectId: saved.subjectId,
                title: saved.questionText,
                time: '방금 전',
              },
              ...prev,
            ])
          }
        },
        onError: handleError,
      },
    ).catch(() => handleError())
  }

  /** 과목 변경(대화는 유지). 좌측 기록은 이 과목 것만 보이도록 필터된다. */
  function handleSelectSubject(s) {
    setSubject(s)
  }

  /** 좌측 기록 클릭 → 과거 질문+답변을 불러와 대화 영역에 복원. */
  function handleSelectHistory(item) {
    if (thinking) return
    abortRef.current?.abort()
    streamingIdRef.current = null
    // 해당 과목으로 맞춰주고(있으면), 불러오는 동안 대화를 비운다.
    const matched = subjectsById[item.subjectId]
    if (matched) setSubject(matched)
    setMessages([])

    fetchAiQuestion(item.aiQuestionId)
      .then((q) => {
        const t = q.createdAt ? nowLabel(new Date(q.createdAt)) : nowLabel()
        setMessages([
          { id: nextMsgId(), role: 'user', text: q.questionText, time: t },
          { id: nextMsgId(), role: 'ai', text: q.answerText, time: t },
        ])
      })
      .catch(() => {
        setMessages([
          { id: nextMsgId(), role: 'ai', text: '⚠️ 이 기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.', time: nowLabel() },
        ])
      })
  }

  /** 새 질문 — 진행 중 스트림 취소하고 대화 초기화. */
  function handleNewChat() {
    abortRef.current?.abort()
    streamingIdRef.current = null
    setMessages([])
    setInput('')
    setThinking(false)
  }

  // 첫 토큰 전(요청 직후)에만 타이핑 인디케이터를 보여준다.
  const showTyping = thinking && streamingIdRef.current == null

  // 좌측 기록은 현재 선택된 과목의 질문만 보여준다.
  const visibleHistory = subject
    ? history.filter((h) => h.subjectId === subject.id)
    : history

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
          <SubjectBar
            subjects={subjects}
            selectedId={subject.id}
            onSelect={handleSelectSubject}
          />
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
          ) : messages.length === 0 ? (
            <EmptyState subject={subject} onPickExample={(ex) => handleSend(ex)} />
          ) : (
            <div className="ai-msg-list">
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} text={m.text} time={m.time} />
              ))}

              {showTyping && (
                <div className="ai-msg ai">
                  <div className="ai-msg-avatar">✨</div>
                  <div className="ai-msg-body">
                    <div className="ai-msg-name">StudyFlow AI</div>
                    <div className="ai-bubble ai-typing">
                      <span /><span /><span />
                    </div>
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
