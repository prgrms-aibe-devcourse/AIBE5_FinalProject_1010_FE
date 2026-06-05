import { useNavigate } from 'react-router-dom'
import { GRADE_LABELS, STATUS_LABELS, STATUS_CLS } from '../courseUtils.js'

/**
 * 수업별 페이지 — 상단 히어로 배너.
 */
export default function CourseHero({ dashboard, courseId, isTeacher }) {
  const navigate = useNavigate()

  const gradeLabel = GRADE_LABELS[dashboard.targetGrade] ?? dashboard.targetGrade
  const modeLabel  = dashboard.maxStudents === 1 ? '1:1' : `그룹 (최대 ${dashboard.maxStudents}명)`

  return (
    <div className="db-hero">
      <span className="avatar lg c1" style={{ flexShrink: 0 }}>
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

      <div className="db-hero__info">
        <div className="db-hero__chips">
          <span className="db-chip subject">{dashboard.subjectName}</span>
          <span className="db-chip grade">{gradeLabel}</span>
          <span className="db-chip mode">{modeLabel}</span>
          <span className={`db-chip ${STATUS_CLS[dashboard.status] ?? 'status-closed'}`}>
            {STATUS_LABELS[dashboard.status] ?? dashboard.status}
          </span>
        </div>
        <div className="db-hero__title">{dashboard.title}</div>
        <div className="db-hero__teacher">
          {dashboard.teacherName} 선생님
          {dashboard.teacherEducation && (
            <span style={{ color: 'var(--ink-mute)', marginLeft: 8 }}>
              · {dashboard.teacherEducation}
            </span>
          )}
        </div>
      </div>

      {/* TODO: 수업실 페이지 연동 후 활성화 */}
      <div className="db-hero__cta">
        <button
          className="btn btn-coral"
          disabled
          title="수업실 기능은 준비 중입니다"
          onClick={() => navigate(`/classroom?courseId=${courseId}`)}
        >
          🎥 수업실 입장
        </button>
        <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 700 }}>
          {isTeacher ? '선생님 전용' : '수업 참여'}
        </span>
      </div>
    </div>
  )
}
