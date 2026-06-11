/**
 * @file BottomControls.jsx
 * @description 강의실 하단 중앙 컨트롤러 컴포넌트
 * - 한글 레이블을 제공하여 사용자가 버튼의 기능을 명확히 인지할 수 있도록 합니다.
 * - 마이크, 카메라, 화면공유 등 핵심 제어 도구를 포함합니다.
 * - 선생님은 "수업 종료"(세션 close), 학생은 "나가기"(연결만 끊기) 버튼을 사용합니다.
 * @param {{isTeacher?:boolean, onLeave?:Function, onClose?:Function}} props
 */
import { useState } from 'react'

export default function BottomControls({ isTeacher = false, onLeave, onClose }) {
  /* 실시간 미디어 상태 제어 (데모용 로컬 스테이트 — B단계에서 LiveKit과 연결) */
  const [mic, setMic] = useState(true)
  const [cam, setCam] = useState(true)

  /* 컨트롤 버튼 설정 배열 */
  const actions = [
    { label: '마이크', icon: mic ? '🎙️' : '🔇', active: mic, toggle: () => setMic(!mic) },
    { label: '카메라', icon: cam ? '📹' : '📵', active: cam, toggle: () => setCam(!cam) },
    { label: '화면공유', icon: '🖥️', active: false },
    { label: '손들기', icon: '✋', active: false },
    { label: '설정', icon: '⚙️', active: false },
  ]

  return (
    <footer className="soft-bottom-nav">
      {/* 맵함수를 이용한 동적 버튼 렌더링 */}
      {actions.map((a, i) => (
        <div 
          key={i} 
          className={`nav-item ${a.active ? 'active' : ''}`} 
          onClick={a.toggle}
          title={`${a.label} ${a.active ? '끄기' : '켜기'}`}
        >
          <div className="nav-icon">{a.icon}</div>
          <span className="nav-text">{a.label} {a.active ? '켜짐' : '꺼짐'}</span>
        </div>
      ))}
      
      {/* 구분선 */}
      <div style={{ width: '1px', height: '30px', background: 'var(--soft-border)', margin: '0 10px' }}></div>

      {/* 선생님=수업 종료(세션 close) / 학생=나가기(연결만 끊기) */}
      <div
        className="nav-item danger"
        title={isTeacher ? '강의실 종료' : '강의실 나가기'}
        onClick={() => (isTeacher ? onClose?.() : onLeave?.())}
      >
        <div className="nav-icon">🚪</div>
        <span className="nav-text">{isTeacher ? '수업 종료' : '나가기'}</span>
      </div>
    </footer>
  )
}
