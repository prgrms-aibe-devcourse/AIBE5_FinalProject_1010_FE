/**
 * @file MessageBubble.jsx
 * @description 채팅 대화의 말풍선 한 개를 그리는 컴포넌트입니다.
 * - role === 'user' 이면 오른쪽 정렬(코랄 계열), 'ai' 이면 왼쪽 정렬(민트 계열).
 * - 새 말풍선은 CSS 애니메이션(ai-bubble-in)으로 아래에서 떠오르며 나타납니다.
 */

/**
 * 말풍선 하나.
 * @param {'user'|'ai'} role 메시지 작성 주체
 * @param {string} text      메시지 본문(줄바꿈 \n 포함 가능)
 * @param {string} [time]    표시할 시각 문자열
 */
export default function MessageBubble({ role, text, time }) {
  const isAi = role === 'ai'

  return (
    <div className={`ai-msg ${role}`}>
      {/* AI 메시지에만 아바타(별 마스코트)를 붙입니다. */}
      {isAi && <div className="ai-msg-avatar">✨</div>}

      <div className="ai-msg-body">
        {/* 작성자 라벨 */}
        <div className="ai-msg-name">{isAi ? 'StudyFlow AI' : '나'}</div>

        {/* 본문: \n 기준으로 줄을 나눠 단락처럼 렌더링합니다. */}
        <div className="ai-bubble">
          {text.split('\n').map((line, i) =>
            // 빈 줄은 간격용 여백으로, 일반 줄은 문단으로 출력합니다.
            line === ''
              ? <span key={i} className="ai-bubble-gap" />
              : <p key={i} className="ai-bubble-line">{line}</p>
          )}
        </div>

        {time && <div className="ai-msg-time">{time}</div>}
      </div>
    </div>
  )
}
