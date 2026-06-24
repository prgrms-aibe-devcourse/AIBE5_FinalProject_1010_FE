/**
 * @file BottomControls.jsx
 * @description 강의실 하단 중앙 컨트롤러 컴포넌트
 * - 한글 레이블을 제공하여 사용자가 버튼의 기능을 명확히 인지할 수 있도록 합니다.
 * - 마이크/카메라/화면공유를 LiveKit 로컬 참가자 제어(media prop)에 연결합니다.
 *   송출 권한(canPublish)이 없으면 이 버튼들은 비활성화됩니다.
 * - 선생님은 "수업 종료"(세션 close), 학생은 "나가기"(연결만 끊기) 버튼을 사용합니다.
 * @param {{isTeacher?:boolean, onLeave?:Function, onClose?:Function, media?:object, isFullscreen?:boolean, onToggleFullscreen?:Function, chatOpen?:boolean, unread?:number, onToggleChat?:Function, live?:boolean, elapsed?:string}} props
 */
export default function BottomControls({ isTeacher = false, onLeave, onClose, media, isFullscreen = false, onToggleFullscreen, chatOpen = false, unread = 0, onToggleChat, live = false, elapsed = '0:00:00', onReaction, onToggleParticipants, participantsOpen = false, participantCount = 0 }) {
  const canPublish = !!media?.canPublish
  const micOn = !!media?.micOn
  const camOn = !!media?.camOn
  const sharing = !!media?.sharing
  const shareLocked = !!media?.shareLockedByOther  // 다른 사람이 공유 중

  /* 컨트롤 버튼 — 송출 권한이 있을 때만 동작(LiveKit 로컬 참가자 토글) */
  const actions = [
    { label: '마이크', icon: micOn ? '🎙️' : '🔇', active: micOn, disabled: !canPublish, toggle: () => media?.toggleMic?.() },
    { label: '카메라', icon: camOn ? '📹' : '📵', active: camOn, disabled: !canPublish, toggle: () => media?.toggleCam?.() },
    { label: '화면공유', icon: '🖥️', active: sharing, disabled: !canPublish || shareLocked,
      lockedTitle: shareLocked ? '다른 참가자가 화면공유 중이에요' : null, toggle: () => media?.toggleShare?.() },
  ]

  return (
    <footer className="soft-bottom-nav">
      {/* LIVE 상태 + 강의 진행 시간(매초 갱신) */}
      {live && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 70 }} title="강의 진행 시간">
            <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', letterSpacing: 0.3 }}>● LIVE</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--soft-text)', fontVariantNumeric: 'tabular-nums' }}>{elapsed}</span>
          </div>
          <div style={{ width: '1px', height: '30px', background: 'var(--soft-border)', margin: '0 10px' }}></div>
        </>
      )}

      {/* 맵함수를 이용한 동적 버튼 렌더링 */}
      {actions.map((a, i) => (
        <div
          key={i}
          className={`nav-item ${a.active ? 'active' : ''}`}
          onClick={a.disabled ? undefined : a.toggle}
          title={a.disabled ? (a.lockedTitle || `${a.label} (송출 권한 없음)`) : `${a.label} ${a.active ? '끄기' : '켜기'}`}
          style={a.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          <div className="nav-icon">{a.icon}</div>
          <span className="nav-text">{a.label} {a.disabled ? '' : (a.active ? '켜짐' : '꺼짐')}</span>
        </div>
      ))}
      
      {/* 리액션 — 손흔들기 / 좋아요(휘발성, 전원에게 떠오르는 이모지) */}
      <div className="nav-item" title="손 흔들기" onClick={() => onReaction?.('hand')}>
        <div className="nav-icon">✋</div>
        <span className="nav-text">손흔들기</span>
      </div>
      <div className="nav-item" title="좋아요" onClick={() => onReaction?.('like')}>
        <div className="nav-icon">👍</div>
        <span className="nav-text">좋아요</span>
      </div>

      {/* 참가자 목록 토글 */}
      <div
        className={`nav-item ${participantsOpen ? 'active' : ''}`}
        title="참가자 목록"
        onClick={() => onToggleParticipants?.()}
      >
        <div className="nav-icon">👥</div>
        <span className="nav-text">참가자 {participantCount > 0 ? participantCount : ''}</span>
      </div>

      {/* 메시지(채팅) 토글 — 안읽음 배지 표시 */}
      <div
        className={`nav-item ${chatOpen ? 'active' : ''}`}
        title={chatOpen ? '메시지 닫기' : '메시지 열기'}
        onClick={() => onToggleChat?.()}
      >
        <div className="nav-icon" style={{ position: 'relative' }}>
          💬
          {!chatOpen && unread > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -10, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, lineHeight: '16px', textAlign: 'center', boxShadow: '0 0 0 2px #fff' }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        <span className="nav-text">메시지</span>
      </div>

      {/* 전체화면 토글 */}
      <div
        className="nav-item"
        title={isFullscreen ? '전체화면 종료' : '전체화면'}
        onClick={() => onToggleFullscreen?.()}
      >
        <div className="nav-icon">{isFullscreen ? '🗗' : '⛶'}</div>
        <span className="nav-text">전체화면 {isFullscreen ? '종료' : ''}</span>
      </div>

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
