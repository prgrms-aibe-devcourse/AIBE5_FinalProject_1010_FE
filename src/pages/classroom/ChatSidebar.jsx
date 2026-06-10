/**
 * @file ChatSidebar.jsx
 * @description 강의실 우측 실시간 채팅 패널 컴포넌트
 * - 세련된 비대칭 말풍선을 통해 가독성 높은 대화 환경을 제공합니다.
 */
export default function ChatSidebar() {
  return (
    <aside className="soft-sidebar">
      <div className="sidebar-title">실시간 채팅</div>

      <div className="amber-chat-feed">
        {/* 상대방 메시지: 왼쪽 정렬, 베이지색 말풍선 */}
        <div className="chat-msg">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--soft-text-dim)', marginLeft: '4px', marginBottom: '4px' }}>박선생님</div>
          <div className="chat-bubble other">
            안녕하세요 여러분! 오늘 수업은 조금 일찍 시작할게요.
          </div>
        </div>

        {/* 내 메시지: 오른쪽 정렬, 앰버색 말풍선 */}
        <div className="chat-bubble me">
          네 선생님! 지금 준비 다 됐습니다.
        </div>

        <div className="chat-msg">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--soft-text-dim)', marginLeft: '4px', marginBottom: '4px' }}>박선생님</div>
          <div className="chat-bubble other">
            좋아요. 칠판에 있는 문제부터 하나씩 풀어볼까요?
          </div>
        </div>
      </div>

      {/* 채팅 입력 영역 */}
      <div className="chat-input-area">
        <div className="modern-input-box">
          <input type="text" placeholder="메시지를 입력하세요..." />
          <button className="send-btn" title="전송">🚀</button>
        </div>
      </div>
    </aside>
  )
}
