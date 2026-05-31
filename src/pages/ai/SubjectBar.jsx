/**
 * @file SubjectBar.jsx
 * @description 채팅 영역 상단의 과목 선택 바입니다.
 * - 과목 칩을 누르면 그 과목으로 질문 맥락이 바뀝니다(선택 상태 강조).
 * - 칩은 hover 시 살짝 흔들리는(wobble) 애니메이션으로 역동적인 느낌을 줍니다.
 * - 실연동 시 과목 목록은 `GET /api/v1/subjects`로 교체합니다.
 */

/**
 * 과목 선택 칩 바.
 * @param {object[]} subjects   과목 목록(aiSubjects)
 * @param {number}   selectedId 현재 선택된 과목 id
 * @param {function} onSelect   과목 선택 핸들러 (subject 객체를 인자로 받음)
 */
export default function SubjectBar({ subjects, selectedId, onSelect }) {
  return (
    <div className="ai-subject-bar">
      <span className="ai-subject-label">과목</span>

      <div className="ai-subject-chips">
        {subjects.map((s) => {
          // 선택된 과목만 active 클래스 + 색상 토큰을 입혀 강조합니다.
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              className={`ai-chip ${s.color} ${active ? 'active' : ''}`}
              onClick={() => onSelect(s)}
            >
              <span className="ai-chip-icon">{s.icon}</span>
              {s.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
