/**
 * @file BottomControls.jsx
 * @description 강의실 하단의 마이크, 카메라, 화면공유, 채팅 등 컨트롤 바입니다.
 * - Set 상태로 active 버튼 목록을 관리합니다.
 * - 현재는 UI 토글만 구현되어 있으며 실제 WebRTC 제어는 추후 연결 대상입니다.
 */
import { useState } from 'react'

/**
 * 강의실 하단 컨트롤 바.
 * 클릭 시 active 토글 (마이크/카메라/화면공유 등). 나가기 버튼만 별도.
 */
const controls = [
  { key: 'mic',    icon: '🎤', label: '마이크',    defaultActive: true },
  { key: 'cam',    icon: '🎥', label: '카메라',    defaultActive: true },
  { key: 'screen', icon: '🖥️', label: '화면공유' },
  { key: 'wb',     icon: '✏️', label: '화이트보드' },
  { key: 'chat',   icon: '💬', label: '채팅' },
  { key: 'members',icon: '👥', label: '참여자' },
  { key: 'record', icon: '⏺️', label: '녹화' },
]

export default function BottomControls() {
  // active는 현재 켜져 있는 컨트롤 key 목록입니다.
  // 배열보다 Set을 쓰면 has/delete/add가 명확해서 토글 UI에 잘 맞습니다.
  const [active, setActive] = useState(
    new Set(controls.filter((c) => c.defaultActive).map((c) => c.key))
  )

  const toggle = (key) => {
    // React state는 직접 수정하면 안 되므로 기존 Set을 복사한 뒤 변경합니다.
    const next = new Set(active)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setActive(next)
  }

  return (
    <footer className="room-bottom">
      <div className="ctrl-left">
        <button className="ctrl-btn">
          <span className="icon">✋</span>
          <span className="label">손들기</span>
        </button>
      </div>

      {controls.map((c) => (
        <button key={c.key}
          className={`ctrl-btn ${active.has(c.key) ? 'active' : ''}`}
          onClick={() => toggle(c.key)} title={c.label}>
          <span className="icon">{c.icon}</span>
          <span className="label">{c.label}</span>
        </button>
      ))}

      <button className="ctrl-btn ctrl-end" title="나가기">
        <span className="icon">📞</span>
        <span className="label">나가기</span>
      </button>

      <div className="ctrl-right">
        <button className="ctrl-btn" title="더보기">
          <span className="icon">⋯</span>
          <span className="label">더보기</span>
        </button>
      </div>
    </footer>
  )
}
