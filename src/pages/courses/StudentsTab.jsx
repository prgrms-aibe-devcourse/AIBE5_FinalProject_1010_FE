/**
 * @file StudentsTab.jsx
 * @description 수업별 페이지 — 수강생 목록 탭
 * - ACTIVE 상태 수강생만 표시
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchEnrollments } from '../../api/dashboardApi.js'
import { avatarColor, fmtDate } from './courseUtils.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'

export default function StudentsTab({ courseId }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchEnrollments(courseId)
      setStudents(Array.isArray(data) ? data : [])
    } catch {
      setStudents([])
      setLoadError('목록을 불러오지 못했습니다. 새로고침해주세요.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { load() }, [load])

  return (
    <div className="db-block">
      <div className="db-block__head">
        <h2>👥 수강생 목록</h2>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-mute)' }}>
          총 {loading ? '…' : students.length}명
        </span>
      </div>

      {loadError && <p className="db-api-error" role="alert">{loadError}</p>}

      {loading && <div className="db-loading">수강생 목록을 불러오는 중…</div>}

      {!loading && students.length === 0 && (
        <div className="db-empty">
          <span className="db-empty__icon">🎓</span>
          <p>아직 수강생이 없습니다.</p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="db-students-grid">
          {students.map((s) => (
            <div key={s.userId} className="db-student-card">
              {s.profileImageUrl ? (
                <img
                  src={toAbsoluteFileUrl(s.profileImageUrl)}
                  alt={s.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #1F2937', flexShrink: 0 }}
                />
              ) : (
                <span
                  className={`avatar md ${avatarColor(s.userId)}`}
                  style={{ width: 44, height: 44, fontSize: 16, flexShrink: 0 }}
                >
                  {(s.name ?? '?')[0]}
                </span>
              )}
              <div className="db-student-card__info">
                <div className="db-student-card__name">{s.name}</div>
                <div className="db-student-card__date">{fmtDate(s.enrolledAt)} 등록</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
