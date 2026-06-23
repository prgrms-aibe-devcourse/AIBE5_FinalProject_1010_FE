import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice, formatDate } from '../../../utils/format.js'
import { TEACHING_MODE_LABEL } from '../../../utils/labels.js'
import { enrollWithCredit } from '../../../api/courseApi.js'

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }

export default function CourseCtaSidebar({ course, courseId, canApply, onApply, onChat }) {
  const {
    status, currentStudents, maxStudents, durationMinutes, pricePerSession,
    teachingMode, location, firstClassDate, recruitDeadline,
  } = course
  const spotsLeft = (maxStudents ?? 0) - (currentStudents ?? 0)

  const navigate = useNavigate()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [needCharge, setNeedCharge] = useState(false)

  // 수강신청 = 크레딧 결제. 학생 크레딧에서 수강료가 차감되고(선생님에게 90% 적립) 바로 수강 확정된다.
  async function handlePayAndApply() {
    if (!canApply || paying) return
    setPayError('')
    setNeedCharge(false)
    setPaying(true)
    try {
      const res = await enrollWithCredit(courseId)
      const balance = res?.creditBalance
      window.alert(`수강 신청이 완료되었어요!${balance != null ? ` (남은 크레딧 ${balance.toLocaleString()})` : ''}`)
      if (onApply) onApply()
      else window.location.reload()
    } catch (e) {
      if (e?.code === 'INSUFFICIENT_CREDIT') {
        setNeedCharge(true)
        setPayError('크레딧이 부족합니다. 충전 후 다시 시도해 주세요.')
      } else {
        setPayError(e?.message || '수강 신청에 실패했습니다.')
      }
      setPaying(false)
    }
  }

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
          <button className="cd-btn-apply" disabled={!canApply || paying} onClick={handlePayAndApply}>
            {!canApply ? '모집 마감' : paying ? '결제 중…' : '크레딧으로 수강신청'}
          </button>
          <button className="cd-btn-chat" onClick={onChat}>채팅으로 문의하기</button>
        </div>
        {payError && <p className="cd-price-card__notice" style={{ color: '#dc2626' }}>{payError}</p>}
        {needCharge && (
          <button className="cd-btn-chat" style={{ marginTop: 6 }} onClick={() => navigate('/payment/charge')}>
            크레딧 충전하러 가기
          </button>
        )}
        {canApply && recruitDeadline && (
          <p className="cd-price-card__notice">{formatDate(recruitDeadline)}까지 모집해요 · 크레딧 결제 시 바로 수강 확정</p>
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
