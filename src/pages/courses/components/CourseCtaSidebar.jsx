import { formatPrice } from '../../../utils/format.js'
import CoursePriceBlock from './CoursePriceBlock.jsx'

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }

export default function CourseCtaSidebar({ course, canApply, onApply, onChat }) {
  const { status, currentStudents, maxStudents, durationMinutes, pricePerSession, availableSchedule, startDate } = course
  const spotsLeft = (maxStudents ?? 0) - (currentStudents ?? 0)

  return (
    <aside className="cd-cta">
      <div className="cd-price-card">
        <div className="cd-price-card__label">수강 신청</div>
        <div className="cd-price-card__head">
          <span className={`cd-badge ${status === 'RECRUITING' ? 'cd-badge--status-ok' : 'cd-badge--status-closed'}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
          <span className="cd-price-card__spots">정원 {currentStudents ?? 0}/{maxStudents ?? '-'}</span>
        </div>
        <div className="cd-price-card__sub">회당 ({durationMinutes}분)</div>
        <div className="cd-price-card__price">{formatPrice(pricePerSession)}</div>
        <div className="cd-price-card__btns">
          <button className="cd-btn-apply" disabled={!canApply} onClick={() => canApply && onApply()}>
            {canApply ? '신청하기' : '모집 마감'}
          </button>
          <button className="cd-btn-chat" onClick={onChat}>채팅으로 문의하기</button>
        </div>
        <p className="cd-price-card__notice">매칭 확정 후 결제가 진행돼요</p>
      </div>

      <CoursePriceBlock />
    </aside>
  )
}
