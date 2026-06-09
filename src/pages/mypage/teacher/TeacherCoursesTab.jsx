import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL } from '../../../utils/labels.js'

export default function TeacherCoursesTab({ status }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const isActive = status === 'RECRUITING'

  useEffect(() => {
    setLoading(true)
    authFetch(`${API_BASE}/api/v1/teachers/me/courses?status=${status}&size=50`)
      .then(r => r.json())
      .then(data => { setCourses(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  const deleteCourse = async (id) => {
    if (!window.confirm('수업을 삭제할까요?\n수강 중인 학생이 있으면 삭제할 수 없습니다.')) return
    try {
      await authFetch(`${API_BASE}/api/v1/courses/${id}`, { method: 'DELETE' })
      setCourses(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('삭제할 수 없어요. 수강 중인 학생이 있는지 확인해주세요.')
    }
  }

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">{isActive ? '진행 중인 수업' : '이전에 진행한 수업'}</h2>
      {loading && <div className="mp-loading">불러오는 중...</div>}
      {!loading && courses.length === 0 && (
        <div className="mp-empty">
          <p className="mp-empty__text">{isActive ? '진행 중인 수업이 없어요' : '이전 수업 이력이 없어요'}</p>
        </div>
      )}
      {!loading && courses.length > 0 && (
        <div className="mp-course-list">
          {courses.map((c, i) => (
            <div
              className="mp-course-card mp-course-card--col"
              key={c.id}
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
                  <p className="mp-course-teacher">최대 {c.maxStudents}명 · {c.durationMinutes}분/회</p>
                </div>
                <div className="mp-course-price-wrap">
                  <p className="mp-course-price">{c.pricePerSession?.toLocaleString()}원<span>/회</span></p>
                </div>
              </div>
              <div className="mp-course-card-actions">
                <Link to={`/courses/${c.id}/dashboard`} className="mp-course-action-btn">수업 페이지</Link>
                <Link to={`/courses/${c.id}`}           className="mp-course-action-btn">상세보기</Link>
                {isActive && (
                  <button className="mp-course-action-btn mp-course-delete-btn" onClick={() => deleteCourse(c.id)}>삭제</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
