import { Link } from 'react-router-dom'
import { STATUS_LABELS } from '../courseUtils.js'

export default function CourseSidebar({ dashboard }) {
  const ringPercent = dashboard.maxStudents > 0
    ? Math.round((dashboard.enrolledCount / dashboard.maxStudents) * 100)
    : 0
  const modeLabel = dashboard.maxStudents === 1 ? '1:1' : `그룹 (최대 ${dashboard.maxStudents}명)`

  return (
    <aside className="db-info">
      {/* 수강 현황 */}
      <div className="db-info-card">
        <h3>📊 수강 현황</h3>
        <div className="db-ring-wrap">
          <div className="db-ring" style={{ '--ring-p': ringPercent }}>
            <div className="db-ring__text">
              <b>{dashboard.enrolledCount}</b>
              <small>/ {dashboard.maxStudents}명</small>
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-mute)' }}>
            {ringPercent}% 수강 중
          </span>
        </div>
        <div className="db-info-row">
          <span>상태</span>
          <span>{STATUS_LABELS[dashboard.status] ?? dashboard.status}</span>
        </div>
        <div className="db-info-row">
          <span>수강 인원</span>
          <span>{dashboard.enrolledCount} / {dashboard.maxStudents}명</span>
        </div>
        <div className="db-info-row">
          <span>수업 형태</span>
          <span>{modeLabel}</span>
        </div>
      </div>

      {/* 담당 선생님 */}
      <div className="db-info-card">
        <h3>👨‍🏫 담당 선생님</h3>
        <div className="db-teacher-mini">
          <span className="avatar md c1" style={{ flexShrink: 0 }}>
            {dashboard.teacherProfileImageUrl ? (
              <img
                src={dashboard.teacherProfileImageUrl}
                alt={dashboard.teacherName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              (dashboard.teacherName ?? '?')[0]
            )}
          </span>
          <div className="db-teacher-mini__info">
            <div className="db-teacher-mini__name">{dashboard.teacherName}</div>
            {dashboard.teacherEducation && (
              <div className="db-teacher-mini__sub">{dashboard.teacherEducation}</div>
            )}
            <div className="db-teacher-mini__sub">
              내공 {dashboard.teacherNaegongScore?.toLocaleString() ?? 0}점
            </div>
          </div>
        </div>
        <Link
          to={`/teachers/${dashboard.teacherProfileId}`}
          className="btn btn-secondary btn-sm btn-full"
        >
          선생님 프로필 보기
        </Link>
      </div>

    </aside>
  )
}
