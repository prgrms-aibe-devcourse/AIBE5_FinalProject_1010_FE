/**
 * @file HistorySidebar.jsx
 * @description AI 질문 페이지 좌측의 "대화 목록" 사이드바입니다. (ChatGPT의 대화 목록과 동일)
 * - 상단 "새 질문" 버튼으로 새 대화를 시작합니다.
 * - 아래에는 (선택 과목의) 대화 목록을 타이틀로 보여줍니다. 클릭하면 그 대화 전체가 열립니다.
 * - 데이터: GET /api/v1/ai/conversations
 */

/**
 * 좌측 대화 목록 사이드바.
 * @param {object[]} conversations 대화 목록 [{ conversationId, title, subjectId, time }]
 * @param {object[]} subjects      과목 목록(아이콘 조회용)
 * @param {number}   activeId      현재 열려 있는 대화 id(강조용)
 * @param {function} onNewChat     "새 질문" 클릭 핸들러
 * @param {function} onSelect      대화 클릭 핸들러(대화 객체를 인자로 받음)
 */
export default function HistorySidebar({ conversations = [], subjects = [], activeId, onNewChat, onSelect }) {
  const subjectIcon = Object.fromEntries(subjects.map((s) => [s.id, s.icon]))

  return (
    <aside className="ai-history">
      <button className="ai-new-btn" onClick={onNewChat}>
        <span className="ai-new-plus">+</span> 새 질문
      </button>

      <div className="ai-history-label">대화 목록</div>

      <ul className="ai-history-list">
        {conversations.length === 0 && (
          <li className="ai-history-empty">아직 대화가 없어요</li>
        )}

        {conversations.map((c) => (
          <li
            key={c.conversationId}
            className={`ai-history-item ${c.conversationId === activeId ? 'active' : ''}`}
            title={c.title}
            onClick={() => onSelect?.(c)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.(c)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <span className="ai-history-icon">{subjectIcon[c.subjectId] || '💬'}</span>
            <span className="ai-history-text">
              <span className="ai-history-title">{c.title}</span>
              <span className="ai-history-time">{c.time}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="ai-history-foot">
        <span className="ai-dot-live" /> AI 데모 모드
      </div>
    </aside>
  )
}
