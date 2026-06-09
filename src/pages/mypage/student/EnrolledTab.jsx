import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL } from '../../../utils/labels.js'

export default function EnrolledTab({ status }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const isActive = status === 'ACTIVE'

  useEffect(() => {
    setLoading(true)
    authFetch(`${API_BASE}/api/v1/students/me/enrollments?status=${status}&size=50`)
      .then(r => r.json())
      .then(data => { setCourses(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">{isActive ? '수강 중인 수업' : '수강했던 수업'}</h2>
      {loading && <div className="mp-loading">불러오는 중...</div>}
      {!loading && courses.length === 0 && (
        <div className="mp-empty">
          <p className="mp-empty__text">{isActive ? '수강 중인 수업이 없어요' : '수강 이력이 없어요'}</p>
        </div>
      )}
      {!loading && courses.length > 0 && (
        <div className="mp-course-list">
          {courses.map((c, i) => (
            <Link
              to={`/courses/${c.courseId}`}
              className="mp-course-card"
              key={c.courseId}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="mp-course-thumb">
                {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt={c.title} /> : c.subjectName}
              </div>
              <div className="mp-course-info">
                <p className="mp-course-title">{c.title}</p>
                <div className="mp-course-meta">
                  <span className="badge">{c.subjectName}</span>
                  <span className="badge">{GRADE_LABEL[c.targetGrade] ?? c.targetGrade}</span>
                </div>
                <p className="mp-course-teacher">{c.teacherName} 선생님</p>
              </div>
              <div className="mp-course-price-wrap">
                <p className="mp-course-price">
                  {c.pricePerSession?.toLocaleString()}원<span>/회</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
