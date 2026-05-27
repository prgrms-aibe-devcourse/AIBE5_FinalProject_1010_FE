/**
 * @file ChatSidebar.jsx
 * @description 강의실 오른쪽 채팅/참여자/질문 사이드바입니다.
 * - 탭 전환 상태와 입력창 상태를 관리합니다.
 * - 현재 메시지는 정적 더미 데이터이며, 실시간 채팅 서버 연결 시 messages를 교체합니다.
 */
import { useState } from 'react'
import Avatar from '../../components/ui/Avatar.jsx'

// 사이드바 상단 탭 정의입니다. badge가 있으면 탭 오른쪽에 숫자 배지가 표시됩니다.
const tabs = [
  { key: 'chat', label: '채팅', badge: 3 },
  { key: 'members', label: '참여자' },
  { key: 'qna', label: '질문' },
]

// 데모용 채팅 메시지입니다. sys가 있으면 시스템 안내 메시지로 렌더링됩니다.
const messages = [
  { sys: '— 박지훈 선생님이 강의실을 열었어요 —' },
  { role: 'teacher', name: '박지훈 선생님', avatar: 'c1', initial: '박',
    text: '안녕하세요 여러분! 오늘은 미적분 II 8주차 수업이에요 ✏️', time: '오후 2:01' },
  { name: '김민지', avatar: 'c3', initial: '민',
    text: '네 선생님~ 잘 보여요!', time: '오후 2:01' },
  { name: '박서준', avatar: 'c4', initial: '서',
    text: '👍', time: '오후 2:01' },
  { role: 'teacher', name: '박지훈 선생님', avatar: 'c1', initial: '박',
    text: '오늘 다룰 문제는 극값 구하기예요. 칠판 같이 봐주세요!', time: '오후 2:02' },
  { role: 'me', name: '이재섭 (나)', avatar: 'c2', initial: '나',
    text: "f'(x)를 먼저 구하는 거 맞나요?", time: '오후 2:03' },
  { role: 'teacher', name: '박지훈 선생님', avatar: 'c1', initial: '박',
    text: '맞아요 재섭이! 정확합니다 👏', time: '오후 2:03' },
  { sys: '— 박서준 학생이 화면을 공유합니다 —' },
  { name: '최하윤', avatar: 'c5', initial: '하',
    text: '선생님, 극댓값과 극솟값을 표로 정리해주실 수 있나요?', time: '오후 2:05' },
]

/**
 * 우측 채팅 사이드바.
 */
export default function ChatSidebar() {
  // 현재 선택된 탭입니다. 추후 tab 값에 따라 참여자 목록/질문 목록을 조건부 렌더링하면 됩니다.
  const [tab, setTab] = useState('chat')

  // 채팅 입력창 값입니다. 현재는 전송 API 없이 입력 상태만 유지합니다.
  const [input, setInput] = useState('')

  return (
    <aside className="right-sidebar">
      <div className="sidebar-tabs">
        {tabs.map((t) => (
          <div key={t.key}
            className={`sidebar-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
            {t.badge && <span className="tab-badge">{t.badge}</span>}
          </div>
        ))}
      </div>

      <div className="chat-messages">
        {messages.map((m, i) =>
          m.sys
            ? <div className="system-msg" key={i}>{m.sys}</div>
            : <ChatMessage key={i} {...m} />
        )}
      </div>

      <div className="chat-input-wrap">
        <div className="chat-input">
          <input type="text" placeholder="메시지를 입력하세요"
            value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="chat-send" aria-label="전송">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

/**
 * 일반 채팅 메시지 한 줄입니다.
 * role 값이 teacher/me이면 CSS에서 말풍선 색상과 정렬을 다르게 줄 수 있습니다.
 */
function ChatMessage({ role, name, avatar, initial, text, time }) {
  const cls = `msg ${role || ''}`
  return (
    <div className={cls}>
      <Avatar size="sm" color={avatar}>{initial}</Avatar>
      <div>
        <div className="msg-name">{name}</div>
        <div className="msg-body">{text}</div>
        <div className="msg-time">{time}</div>
      </div>
    </div>
  )
}
