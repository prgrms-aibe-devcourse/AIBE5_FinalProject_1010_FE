import { useState, useEffect, useCallback } from 'react'
import { fetchEnrollments, fetchAttendance } from '../../api/dashboardApi.js'
import { avatarColor, fmtDate } from './courseUtils.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { IcUsers, IcGraduationCap } from './components/DashboardIcons.jsx'

export default function StudentsTab({ courseId }) {
  const [students, setStudents]       = useState([])
  const [attendance, setAttendance]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [studentResult, attendanceResult] = await Promise.allSettled([
        fetchEnrollments(courseId),
        fetchAttendance(courseId),
      ])
      if (studentResult.status === 'fulfilled') {
        setStudents(Array.isArray(studentResult.value) ? studentResult.value : [])
      } else {
        setStudents([])
        setLoadError('수강생 목록을 불러오지 못했습니다. 새로고침해주세요.')
      }
      setAttendance(
        attendanceResult.status === 'fulfilled' && Array.isArray(attendanceResult.value)
          ? attendanceResult.value
          : []
      )
    } catch {
      setStudents([])
      setAttendance([])
      setLoadError('목록을 불러오지 못했습니다. 새로고침해주세요.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { load() }, [load])

  const attendanceMap = Object.fromEntries(attendance.map(a => [a.userId, a]))
  const totalSessions = attendance[0]?.totalSessions ?? 0

  return (
    <div className="db-block">
      <div className="db-block__head">
        <h2><IcUsers /> 수강생 목록</h2>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-mute)' }}>
          총 {loading ? '…' : students.length}명
        </span>
      </div>

      {loadError && <p className="db-api-error" role="alert">{loadError}</p>}

      {loading && <div className="db-loading">수강생 목록을 불러오는 중…</div>}

      {!loading && students.length === 0 && (
        <div className="db-empty">
          <span className="db-empty__icon"><IcGraduationCap size={36} /></span>
          <p>아직 수강생이 없습니다.</p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <>
          {totalSessions > 0 && (
            <p className="db-attendance-note">
              총 {totalSessions}회 실시간 강의 기준 출석 현황
            </p>
          )}
          <div className="db-students-grid">
            {students.map((s) => {
              const att = attendanceMap[s.userId]
              const attended = att?.attendedCount ?? 0
              const pct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : null

              return (
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
                    {totalSessions > 0 && (
                      <div className="db-student-att">
                        <div className="db-student-att__bar">
                          <div className="db-student-att__fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="db-student-att__label">{attended}/{totalSessions}회 ({pct}%)</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
