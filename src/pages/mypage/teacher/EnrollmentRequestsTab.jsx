import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL, REQUEST_STATUS_LABEL, PAGE_SIZE } from '../../../utils/labels.js'
import { avatarBg } from '../../../utils/avatarColor.js'

const FILTERS = [
  { v: 'ALL', l: '전체' }, { v: 'PENDING', l: '대기 중' },
  { v: 'ACCEPTED', l: '수락됨' }, { v: 'REJECTED', l: '거절됨' },
]

export default function EnrollmentRequestsTab() {
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('ALL')

  useEffect(() => {
    setLoading(true)
    const q = filter !== 'ALL' ? `&status=${filter}` : ''
    authFetch(`${API_BASE}/api/v1/teachers/me/enrollment-requests?size=${PAGE_SIZE}${q}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(data => { setRequests(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  const updateStatus = (id, s) =>
    setRequests(prev => prev.map(r => r.requestId === id ? { ...r, status: s } : r))

  const accept = async (e, id) => {
    e.stopPropagation()
    try {
      const res = await authFetch(`${API_BASE}/api/v1/enrollment-requests/${id}/accept`, { method: 'PATCH' })
      if (!res.ok) throw new Error(res.status)
      updateStatus(id, 'ACCEPTED')
    } catch {
      alert('수락에 실패했어요. 다시 시도해주세요.')
    }
  }

  const reject = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('이 신청을 거절할까요?')) return
    try {
      const res = await authFetch(`${API_BASE}/api/v1/enrollment-requests/${id}/reject`, { method: 'PATCH' })
      if (!res.ok) throw new Error(res.status)
      updateStatus(id, 'REJECTED')
    } catch {
      alert('거절에 실패했어요. 다시 시도해주세요.')
    }
  }

  const goToStudent = (r) =>
    navigate(`/mypage/students/${r.requestId}`, {
      state: {
        requestId:         r.requestId,
        student:           r.student,
        courseTitle:       r.courseTitle,
        status:            r.status,
        message:           r.message           ?? null,
        preferredSchedule: r.preferredSchedule ?? null,
        preferredStart:    r.preferredStart    ?? null,
        createdAt:         r.createdAt         ?? null,
      },
    })

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">
        수강 신청 받은 목록
        {pendingCount > 0 && (
          <span className="mp-req-status PENDING" style={{ marginLeft: 'auto' }}>
            {pendingCount}건 대기 중
          </span>
        )}
      </h2>

      <div className="mp-filter-row">
        {FILTERS.map(f => (
          <button key={f.v} className={`mp-filter-btn${filter === f.v ? ' active' : ''}`} onClick={() => setFilter(f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {loading && <div className="mp-loading">불러오는 중...</div>}
      {!loading && requests.length === 0 && (
        <div className="mp-empty">수강 신청이 없어요.</div>
      )}
      {!loading && requests.length > 0 && (
        <div className="mp-req-list">
          {requests.map((r) => {
            const name  = r.student?.name ?? '학생'
            const grade = r.student?.grade ? (GRADE_LABEL[r.student.grade] ?? r.student.grade) : null

            return (
              <div
                className="mp-req-card mp-req-card--clickable"
                key={r.requestId}
                onClick={() => goToStudent(r)}
              >
                <div className="mp-req-row">
                  <div className="mp-req-avatar" style={{ background: avatarBg(name), flexShrink: 0 }}>
                    {name[0]}
                  </div>

                  <div className="mp-req-row-info">
                    <p className="mp-req-course">
                      <span className="mp-req-course__title">{r.courseTitle}</span>
                      <span className={`mp-req-status ${r.status}`}>
                        {REQUEST_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </p>
                    <p className="mp-req-student">
                      {name}
                      {grade && <span>{grade}</span>}
                      {r.student?.region && <span>{r.student.region}</span>}
                      <span className="mp-req-date-inline">
                        {new Date(r.createdAt).toLocaleDateString('ko-KR')} 신청
                      </span>
                    </p>
                  </div>

                  <div className="mp-req-row-right">
                    {r.status === 'PENDING' && (
                      <div className="mp-req-actions">
                        <button className="btn btn-secondary btn-sm" onClick={(e) => reject(e, r.requestId)}>거절</button>
                        <button className="btn btn-primary btn-sm"   onClick={(e) => accept(e, r.requestId)}>수락</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
