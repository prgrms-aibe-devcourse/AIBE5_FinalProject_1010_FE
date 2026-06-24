import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '../../../components/ui/Badge.jsx'
import { GRADE_LABEL } from '../../../utils/labels.js'
import { formatPrice } from '../../../utils/format.js'

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }
const PREVIEW = 4

export default function TeacherCoursesBlock({ courses = [] }) {
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)

  const sorted  = [...courses].sort((a, b) => b.id - a.id)
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW)

  return (
    <div className="td-block">
      <div className="td-block-head">
        <h2 className="td-block__title" style={{ margin: 0 }}>운영 중인 수업</h2>
      </div>
      {sorted.length === 0 ? (
        <p style={{ color: 'var(--ink-mute)', margin: 0 }}>현재 모집 중인 강의가 없어요</p>
      ) : (
        <>
          <div className="teacher-detail__courses-grid">
            {visible.map(course => (
              <div
                key={course.id}
                className="teacher-course-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="teacher-course-card__title">{course.title}</div>
                <div className="teacher-course-card__meta">
                  {course.subjectName && <Badge variant="sky">{course.subjectName}</Badge>}
                  {course.targetGrade && <Badge variant="butter">{GRADE_LABEL[course.targetGrade] ?? course.targetGrade}</Badge>}
                  <span className={`status-badge ${course.status}`}>{STATUS_LABELS[course.status] ?? course.status}</span>
                </div>
                <div className="teacher-course-card__price">
                  {formatPrice(course.pricePerSession)}
                  <span> / 1회 · {course.durationMinutes}분 · 최대 {course.maxStudents}명</span>
                </div>
              </div>
            ))}
          </div>
          {sorted.length > PREVIEW && (
            <button className="td-review-more" onClick={() => setShowAll(prev => !prev)}>
              {showAll ? '접기' : `더보기 (${sorted.length - PREVIEW}개 더)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
