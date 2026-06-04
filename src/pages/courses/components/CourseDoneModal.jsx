export default function CourseDoneModal({ onViewCourses, onRegisterMore }) {
  return (
    <div className="cc-done-back">
      <div className="cc-done-modal" onClick={e => e.stopPropagation()}>
        <div className="cc-done-modal__emoji">🎉</div>
        <h3 className="cc-done-modal__title">수업이 등록되었어요!</h3>
        <p className="cc-done-modal__sub">
          검토 없이 바로 모집이 시작됩니다.<br />
          학생들이 곧 신청을 보내올 거예요 ✨
        </p>
        <div className="cc-done-modal__actions">
          <button className="btn btn--coral btn--lg" onClick={onViewCourses}>
            수업 검색에서 확인하기
          </button>
          <button className="btn btn--ghost" onClick={onRegisterMore}>
            수업 하나 더 등록하기
          </button>
        </div>
      </div>
    </div>
  )
}
