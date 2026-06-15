/**
 * @file BottomControls.jsx
 * @description 강의실 하단 중앙 컨트롤러 컴포넌트
 * - 한글 레이블을 제공하여 사용자가 버튼의 기능을 명확히 인지할 수 있도록 합니다.
 * - 마이크/카메라/화면공유를 LiveKit 로컬 참가자 제어(media prop)에 연결합니다.
 *   송출 권한(canPublish)이 없으면 이 버튼들은 비활성화됩니다.
 * - 선생님은 "수업 종료"(세션 close), 학생은 "나가기"(연결만 끊기) 버튼을 사용합니다.
 * @param {{isTeacher?:boolean, onLeave?:Function, onClose?:Function, media?:object}} props
 */
export default function BottomControls({ isTeacher = false, onLeave, onClose, media }) {
  const canPublish = !!media?.canPublish
  const micOn = !!media?.micOn
  const camOn = !!media?.camOn
  const sharing = !!media?.sharing

  /* 컨트롤 버튼 — 송출 권한이 있을 때만 동작(LiveKit 로컬 참가자 토글) */
  const actions = [
    { label: '마이크', icon: micOn ? '🎙️' : '🔇', active: micOn, disabled: !canPublish, toggle: () => media?.toggleMic?.() },
    { label: '카메라', icon: camOn ? '📹' : '📵', active: camOn, disabled: !canPublish, toggle: () => media?.toggleCam?.() },
    { label: '화면공유', icon: '🖥️', active: sharing, disabled: !canPublish, toggle: () => media?.toggleShare?.() },
  ]

  return (
    <footer className="soft-bottom-nav">
      {/* 맵함수를 이용한 동적 버튼 렌더링 */}
      {actions.map((a, i) => (
        <div
          key={i}
          className={`nav-item ${a.active ? 'active' : ''}`}
          onClick={a.disabled ? undefined : a.toggle}
          title={a.disabled ? `${a.label} (송출 권한 없음)` : `${a.label} ${a.active ? '끄기' : '켜기'}`}
          style={a.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          <div className="nav-icon">{a.icon}</div>
          <span className="nav-text">{a.label} {a.disabled ? '' : (a.active ? '켜짐' : '꺼짐')}</span>
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
