export default function CourseDoneModal({ onViewDashboard, onRegisterMore }) {
  return (
    <div className="cc-done-back" onClick={onRegisterMore}>
      <div className="cc-done-modal" onClick={e => e.stopPropagation()}>
        <div className="cc-done-modal__emoji">🎉</div>
        <h3 className="cc-done-modal__title">수업이 등록되었어요!</h3>
        <p className="cc-done-modal__sub">
          학생이 신청하면 상담을 통해<br />
          일정·수업료 등 세부 조건을 함께 맞춰가세요 ✨
        </p>
        <div className="cc-done-modal__actions">
          <button className="btn btn--coral btn--lg" onClick={onViewDashboard}>
            내 수업 대시보드 바로가기
          </button>
          <button className="btn btn--ghost" onClick={onRegisterMore}>
            수업 하나 더 등록하기
          </button>
        </div>
      </div>
    </div>
  )
}
