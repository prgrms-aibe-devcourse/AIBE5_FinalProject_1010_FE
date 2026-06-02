/**
 * @file HistorySidebar.jsx
 * @description AI 질문 페이지 좌측의 "질문 기록" 사이드바입니다.
 * - 상단의 "새 질문" 버튼으로 대화를 초기화합니다.
 * - 아래에는 과거 질문 목록(더미)을 보여줍니다.
 * - history는 `GET /api/v1/ai/questions` 응답({ aiQuestionId, subjectId, title, time })으로 채웁니다.
 */

/**
 * 좌측 기록 사이드바.
 * @param {object[]} history   질문 기록 목록
 * @param {object[]} subjects  과목 목록(아이콘 조회용, 백엔드 GET /subjects 기반)
 * @param {function} onNewChat "새 질문" 클릭 핸들러
 *
 * NOTE: 모바일 펼침 토글(`open` 클래스)은 토글 UI가 생기면 다시 도입한다.
 *       현재는 전달되는 곳이 없어 죽은 prop이라 제거했다.
 */
export default function HistorySidebar({ history, subjects = [], onNewChat }) {
  // subjectId로 과목 아이콘을 빠르게 찾기 위한 조회용 맵(현재 과목 목록 기반).
  const subjectIcon = Object.fromEntries(subjects.map((s) => [s.id, s.icon]))

  return (
    <aside className="ai-history">
      {/* 새 대화 시작 버튼 — 누르면 부모에서 messages/선택과목을 초기화합니다. */}
      <button className="ai-new-btn" onClick={onNewChat}>
        <span className="ai-new-plus">+</span> 새 질문
      </button>

      <div className="ai-history-label">최근 질문</div>

      <ul className="ai-history-list">
        {/* 기록이 없을 때의 안내 (첫 방문/초기화 직후) */}
        {history.length === 0 && (
          <li className="ai-history-empty">아직 질문 기록이 없어요</li>
        )}

        {/* 더미 기록을 반복 렌더링. 실제로는 클릭 시 해당 대화를 다시 불러오게 됩니다. */}
        {history.map((h) => (
          <li key={h.aiQuestionId} className="ai-history-item" title={h.title}>
            <span className="ai-history-icon">{subjectIcon[h.subjectId] || '💬'}</span>
            <span className="ai-history-text">
              <span className="ai-history-title">{h.title}</span>
              <span className="ai-history-time">{h.time}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* 하단 안내 배지 — 데모 단계임을 표시 */}
      <div className="ai-history-foot">
        <span className="ai-dot-live" /> AI 데모 모드
      </div>
    </aside>
  )
}
