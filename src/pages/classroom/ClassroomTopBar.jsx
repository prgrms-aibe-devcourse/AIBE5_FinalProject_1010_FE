/**
 * @file ClassroomTopBar.jsx
 * @description 강의실 상단 정보 바입니다.
 * - 현재 수업명, 녹화 상태, 참여 인원, 수업 진행 시간을 표시합니다.
 * - 타이머는 데모용이며 1초마다 증가합니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * 강의실 상단 바.
 * 로고 + 과목/수업명 + REC 표시 + 인원 수 + 타이머 + 설정.
 */
export default function ClassroomTopBar() {
  // 데모 수업이 이미 32분 14초 진행된 상태로 시작하도록 초기값을 둡니다.
  // 실제 서비스에서는 수업 시작 시각과 현재 시각의 차이로 계산하면 됩니다.
  const [seconds, setSeconds] = useState(32 * 60 + 14)

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // 초 단위 상태를 HH:MM:SS 형태로 변환합니다. padStart로 항상 두 자리 표시를 유지합니다.
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')

  return (
    <header className="room-topbar">
      <div className="room-info">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          Study Flow
        </Link>
        <span style={{ color: 'var(--ink-mute)' }}>|</span>
        <div className="room-title">
          <span className="subject">미적분 II</span>
          [수능대비] 킬러문항 마스터 — 8주차
        </div>
        <span className="recording">REC</span>
      </div>
      <div className="members-count">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
        24명
      </div>
      <span className="timer">⏱ {h}:{m}:{s}</span>
      <button className="btn-icon" title="설정">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </header>
  )
}
