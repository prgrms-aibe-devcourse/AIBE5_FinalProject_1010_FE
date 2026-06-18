import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL, PAGE_SIZE } from '../../../utils/labels.js'
import { dropEnrollment } from '../../../api/dashboardApi.js'

export default function EnrolledTab({ status }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [droppingId, setDroppingId] = useState(null)
  const [message, setMessage] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const isActive = status === 'ACTIVE'

  useEffect(() => {
    setLoading(true)
    authFetch(`${API_BASE}/api/v1/students/me/enrollments?status=${status}&size=${PAGE_SIZE}`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => { setCourses(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, refreshKey])

  async function handleDrop(enrollmentId) {
    if (!window.confirm('정말 이 수업을 중도 포기하시겠습니까?')) return
    setDroppingId(enrollmentId)
    setMessage(null)
    try {
      await dropEnrollment(enrollmentId)
      setMessage({ type: 'success', text: '수강이 포기되었습니다.' })
      setRefreshKey(k => k + 1)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || '수강 포기에 실패했습니다.' })
    } finally {
      setDroppingId(null)
    }
  }

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">{isActive ? '수강 중인 수업' : '수강했던 수업'}</h2>
      {message && (
        <p className={`mp-feedback mp-feedback--${message.type}`}>{message.text}</p>
      )}
      {loading && <div className="mp-loading">불러오는 중...</div>}
      {!loading && courses.length === 0 && (
        <div className="mp-empty">
          <p className="mp-empty__text">{isActive ? '수강 중인 수업이 없어요' : '수강 이력이 없어요'}</p>
        </div>
      )}
      {!loading && courses.length > 0 && (
        <div className="mp-course-list">
          {courses.map((c, i) =>
            isActive ? (
              <div
                className="mp-course-card mp-course-card--col"
                key={c.courseId}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="mp-course-card-row">
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
                </div>
                <div className="mp-course-card-actions">
                  <Link to={`/courses/${c.courseId}/dashboard`} className="mp-course-action-btn">수업 페이지</Link>
                  <Link to={`/courses/${c.courseId}`}           className="mp-course-action-btn">상세보기</Link>
                  <button
                    className="mp-course-action-btn mp-course-action-btn--danger"
                    onClick={() => handleDrop(c.enrollmentId)}
                    disabled={droppingId === c.enrollmentId}
                  >
                    {droppingId === c.enrollmentId ? '처리 중...' : '수강 포기'}
                  </button>
                </div>
              </div>
            ) : (
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
            )
          )}
        </div>
      )}
    </div>
  )
}
