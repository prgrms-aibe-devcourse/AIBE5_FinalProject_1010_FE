/**
 * @file EmptyState.jsx
 * @description 대화가 아직 없을 때 채팅 영역 가운데에 보여주는 환영 화면입니다.
 * - 둥둥 떠다니는(float) 그라데이션 오브 + 별 마스코트로 역동적인 첫인상을 줍니다.
 * - 선택된 과목의 예시 질문 카드를 보여주고, 누르면 바로 그 질문을 전송합니다.
 */

/**
 * 빈 상태(환영) 화면.
 * @param {object}   subject     현재 선택된 과목 (icon/name/desc/examples 사용)
 * @param {function} onPickExample 예시 질문 클릭 핸들러 (질문 문자열을 인자로 받음)
 */
export default function EmptyState({ subject, onPickExample }) {
  return (
    <div className="ai-empty">
      {/* 떠다니는 그라데이션 오브 + 마스코트. 순수 CSS 애니메이션으로 움직입니다. */}
      <div className="ai-orb">
        <span className="ai-orb-emoji">🤖</span>
        {/* 오브 주위를 도는 작은 과목 이모지들 — 장식용 */}
        <span className="ai-orb-spark s1">🧮</span>
        <span className="ai-orb-spark s2">🔬</span>
        <span className="ai-orb-spark s3">📖</span>
        <span className="ai-orb-spark s4">💻</span>
      </div>

      <h1 className="ai-empty-title">
        무엇이든 물어보세요, <span className="hand">{subject.name}</span> 도우미예요
      </h1>
      <p className="ai-empty-sub">{subject.desc} · 문제를 입력하면 단계별 풀이를 알려드려요</p>

      {/* 선택된 과목의 예시 질문 카드들 — 누르면 곧바로 질문이 전송됩니다.
          staggered 등장 애니메이션을 위해 인덱스 기반 delay를 인라인 스타일로 부여합니다. */}
      <div className="ai-example-grid">
        {subject.examples.map((ex, i) => (
          <button
            key={i}
            className="ai-example-card"
            style={{ animationDelay: `${0.08 * i}s` }}
            onClick={() => onPickExample(ex)}
          >
            <span className="ai-example-icon">{subject.icon}</span>
            <span className="ai-example-text">{ex}</span>
            <span className="ai-example-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
