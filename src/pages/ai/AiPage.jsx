/**
 * @file AiPage.jsx
 * @description 과목별 AI 문제풀이 질문 페이지(/ai)의 최상위 컴포넌트입니다.
 * - 좌측: 질문 기록 사이드바(HistorySidebar)
 * - 우측: 과목 선택 바(SubjectBar) + 대화 영역(EmptyState / 말풍선들) + 입력창(Composer)
 *
 * 데이터 흐름:
 *   사용자가 질문을 보내면 → 화면에 user 말풍선 추가 → "생각 중" 표시 →
 *   (지금은) mockAnswer로 가짜 답변을 잠시 뒤 ai 말풍선으로 추가합니다.
 *
 * 🔌 백엔드 연동 지점(명세 §26):
 *   - 질문 전송: POST /api/v1/ai/questions  body { subjectId, questionText, questionImageUrl }
 *                응답 data.answerText 를 ai 말풍선에 사용
 *   - 기록 조회: GET  /api/v1/ai/questions  → HistorySidebar의 history 초기화
 *   해당 위치에 TODO(API) 주석을 달아두었습니다.
 */
import { useState, useRef, useEffect } from 'react'
import { aiSubjects, initialHistory, mockAnswer } from '../../data/aiSubjects.js'
import HistorySidebar from './HistorySidebar.jsx'
import SubjectBar from './SubjectBar.jsx'
import MessageBubble from './MessageBubble.jsx'
import EmptyState from './EmptyState.jsx'
import Composer from './Composer.jsx'

/** 현재 시각을 "오후 2:03" 형태로 만들어 말풍선에 붙입니다(목업용). */
function nowLabel() {
  const d = new Date()
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}:${m}`
}

export default function AiPage() {
  // 현재 선택된 과목. 기본값은 첫 번째 과목(수학).
  const [subject, setSubject] = useState(aiSubjects[0])

  // 현재 대화의 메시지 목록. { id, role:'user'|'ai', text, time }
  const [messages, setMessages] = useState([])

  // 입력창 값.
  const [input, setInput] = useState('')

  // AI가 답변을 생성 중인지 여부(타이핑 인디케이터 + 입력 잠금).
  const [thinking, setThinking] = useState(false)

  // 좌측 기록 목록. 실연동 시 GET /api/v1/ai/questions 결과로 채웁니다.
  // TODO(API): useEffect(()=>{ fetch('/api/v1/ai/questions')... setHistory(data) }, [])
  const [history] = useState(initialHistory)

  // 메시지가 추가될 때 항상 맨 아래로 스크롤하기 위한 앵커 ref입니다.
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  /**
   * 질문 전송 처리.
   * @param {string} [preset] 예시 카드 클릭 등으로 들어온 미리 채워진 질문(있으면 입력값 대신 사용)
   */
  function handleSend(preset) {
    const text = (typeof preset === 'string' ? preset : input).trim()
    if (!text || thinking) return

    // 1) 사용자 말풍선 추가
    const userMsg = { id: Date.now(), role: 'user', text, time: nowLabel() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    // 2) 답변 생성
    // ─────────────────────────────────────────────────────────────
    // TODO(API): 아래 setTimeout 블록을 실제 호출로 교체하세요.
    //   const res = await fetch('/api/v1/ai/questions', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    //     body: JSON.stringify({ subjectId: subject.id, questionText: text, questionImageUrl: null }),
    //   })
    //   const { data } = await res.json()
    //   answer = data.answerText
    // ─────────────────────────────────────────────────────────────
    const answer = mockAnswer(subject.name, text)
    // 데모: 약간의 지연을 줘서 "생각 중" 애니메이션이 보이도록 합니다.
    setTimeout(() => {
      const aiMsg = { id: Date.now() + 1, role: 'ai', text: answer, time: nowLabel() }
      setMessages((prev) => [...prev, aiMsg])
      setThinking(false)
    }, 1100)
  }

  /** 과목을 바꿉니다. (대화는 유지 — 같은 창에서 과목만 전환) */
  function handleSelectSubject(s) {
    setSubject(s)
  }

  /** "새 질문" — 대화를 비우고 처음 상태로 되돌립니다. */
  function handleNewChat() {
    setMessages([])
    setInput('')
    setThinking(false)
  }

  return (
    <div className="ai-layout">
      {/* 좌측: 질문 기록 */}
      <HistorySidebar history={history} onNewChat={handleNewChat} />

      {/* 우측: 과목 선택 + 대화 + 입력 */}
      <section className="ai-main">
        <SubjectBar
          subjects={aiSubjects}
          selectedId={subject.id}
          onSelect={handleSelectSubject}
        />

        <div className="ai-chat">
          {messages.length === 0 ? (
            // 대화 시작 전: 환영(빈) 화면. 예시 카드를 누르면 바로 질문이 전송됩니다.
            <EmptyState subject={subject} onPickExample={(ex) => handleSend(ex)} />
          ) : (
            // 대화 중: 말풍선 목록
            <div className="ai-msg-list">
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} text={m.text} time={m.time} />
              ))}

              {/* AI 생각 중 표시(점 3개가 통통 튀는 인디케이터) */}
              {thinking && (
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

              {/* 자동 스크롤용 앵커 */}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          thinking={thinking}
          subjectName={subject.name}
        />
      </section>
    </div>
  )
}
