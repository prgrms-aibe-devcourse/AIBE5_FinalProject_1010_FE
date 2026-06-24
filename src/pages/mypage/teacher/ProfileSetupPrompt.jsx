import { useState, useEffect } from 'react'

export default function ProfileSetupPrompt({ userName, onClose, onGoVerify }) {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const handleClose = () => onClose?.(dontShowAgain)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dontShowAgain])

  return (
    <div className="ps-overlay" role="dialog" aria-modal="true" aria-labelledby="ps-title" onClick={handleClose}>
      <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ps-close" onClick={handleClose} aria-label="닫기">✕</button>
        <div className="ps-icon">👋</div>
        <h3 id="ps-title" className="ps-title">
          {userName ? `${userName} 선생님, 환영해요!` : '선생님, 환영해요!'}
        </h3>
        <p className="ps-desc">
          수업 등록·강의실 열기 등의 기능은 <strong>인증</strong>이 완료된 선생님만 이용할 수 있어요.
        </p>
        <div className="ps-actions">
          <button type="button" className="ps-btn ps-btn--primary" onClick={() => onGoVerify?.()}>
            프로필 관리하러 가기
          </button>
        </div>
        <label className="ps-dont-show">
          <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
          <span>앞으로 이 알림 안 볼래요</span>
        </label>
      </div>
    </div>
  )
}
