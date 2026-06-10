import { useLocation, useNavigate } from 'react-router-dom'
import { GRADE_LABEL, REQUEST_STATUS_LABEL } from '../../../utils/labels.js'
import { avatarBg } from '../../../utils/avatarColor.js'

export default function StudentDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state ?? {}

  const student           = state.student           ?? {}
  const courseTitle       = state.courseTitle       ?? null
  const status            = state.status            ?? null
  const message           = state.message           ?? null
  const preferredSchedule = state.preferredSchedule ?? null
  const preferredStart    = state.preferredStart    ?? null
  const createdAt         = state.createdAt         ?? null

  const name   = student.name   ?? '학생'
  const grade  = student.grade  ? (GRADE_LABEL[student.grade] ?? student.grade) : null
  const region = student.region ?? null
  const goal   = student.goal   ?? null

  const STUDENT_ROWS = [
    { label: '학년',      value: grade },
    { label: '지역',      value: region },
    { label: '학습 목표', value: goal },
  ].filter(r => r.value)

  const ENROLL_ROWS = [
    { label: '희망 수업 일정',   value: preferredSchedule },
    { label: '수업 시작 희망일', value: preferredStart },
    { label: '선생님께 한 마디', value: message },
  ].filter(r => r.value)

  return (
    <div className="mp-std-page">

      <nav className="mp-std-crumb">
        <button onClick={() => navigate('/mypage')}>마이페이지</button>
        <span className="mp-std-crumb__sep">›</span>
        <button onClick={() => navigate(-1)}>수강 신청 목록</button>
        <span className="mp-std-crumb__sep">›</span>
        <span>{name} 학생</span>
      </nav>

      {/* 프로필 카드 */}
      <div className="mp-block">
        <div className="mp-std-profile-head">
          <div className="mp-std-profile">
            <div className="mp-req-avatar mp-std-avatar" style={{ background: avatarBg(name) }}>
              {name[0]}
            </div>
            <div className="mp-std-profile-info">
              <h1 className="mp-std-name">{name} 학생</h1>
              <p className="mp-std-sub">
                {[grade, region].filter(Boolean).join(' · ') || '정보 없음'}
              </p>
            </div>
          </div>
          {status && (
            <span className={`mp-req-status ${status}`}>
              {REQUEST_STATUS_LABEL[status] ?? status}
            </span>
          )}
        </div>

        {(courseTitle || createdAt) && (
          <div className="mp-std-meta-row">
            {courseTitle && (
              <div className="mp-std-meta-badge">
                <span className="mp-std-meta-label">신청 수업</span>
                <span className="mp-std-meta-value">{courseTitle}</span>
              </div>
            )}
            {createdAt && (
              <div className="mp-std-meta-badge">
                <span className="mp-std-meta-label">신청일</span>
                <span className="mp-std-meta-value">
                  {new Date(createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 학생 정보 */}
      <div className="mp-block">
        <h2 className="mp-block-title">학생 정보</h2>
        {STUDENT_ROWS.length > 0 ? (
          <div className="mp-req-detail">
            {STUDENT_ROWS.map(({ label, value }) => (
              <div className="mp-req-detail-row" key={label}>
                <span className="mp-req-detail-label">{label}</span>
                <p className="mp-req-detail-val">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mp-std-empty">등록된 학생 정보가 없습니다.</p>
        )}
      </div>

      {/* 신청 정보 */}
      <div className="mp-block">
        <h2 className="mp-block-title">신청 정보</h2>
        {ENROLL_ROWS.length > 0 ? (
          <div className="mp-req-detail">
            {ENROLL_ROWS.map(({ label, value }) => (
              <div className="mp-req-detail-row" key={label}>
                <span className="mp-req-detail-label">{label}</span>
                <p className="mp-req-detail-val">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mp-std-empty">등록된 신청 정보가 없습니다.</p>
        )}
      </div>

    </div>
  )
}
