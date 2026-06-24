import { formatPrice, formatDate } from '../../../utils/format.js'
import { TEACHING_MODE_LABEL } from '../../../utils/labels.js'

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }

export default function CourseCtaSidebar({ course, canApply, onApply, onChat }) {
  const {
    status, currentStudents, maxStudents, durationMinutes, pricePerSession,
    teachingMode, location, firstClassDate, recruitDeadline,
  } = course

  const facts = [
    teachingMode    && { label: '수업 방식', value: TEACHING_MODE_LABEL[teachingMode] ?? teachingMode },
    teachingMode === 'OFFLINE' && location && { label: '수업 장소', value: location },
    firstClassDate  && { label: '첫 수업',   value: firstClassDate },
    recruitDeadline && { label: '모집 마감', value: formatDate(recruitDeadline) },
  ].filter(Boolean)

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
          <button className="cd-btn-apply" disabled={!canApply} onClick={() => canApply && onApply?.()}>
            {!canApply ? '모집 마감' : '수강신청'}
          </button>
          <button className="cd-btn-chat" onClick={onChat}>채팅으로 문의하기</button>
        </div>
        {canApply && recruitDeadline && (
          <p className="cd-price-card__notice">{formatDate(recruitDeadline)}까지 모집해요 · 선생님 수락 시 수강 확정</p>
        )}
      </div>

      {facts.length > 0 && (
        <div className="cd-quick">
          {facts.map(f => (
            <div key={f.label} className="cd-quick__row">
              <span>{f.label}</span>
              <span>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}