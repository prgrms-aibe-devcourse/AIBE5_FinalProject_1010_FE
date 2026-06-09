import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL } from '../../../utils/labels.js'
import { avatarBg } from '../../../utils/avatarColor.js'

const REQ_STATUS_LBL = { PENDING: '대기 중', ACCEPTED: '수락됨', REJECTED: '거절됨', CANCELLED: '취소됨' }
const FILTERS = [
  { v: 'ALL', l: '전체' }, { v: 'PENDING', l: '대기 중' },
  { v: 'ACCEPTED', l: '수락됨' }, { v: 'REJECTED', l: '거절됨' },
]

export default function EnrollmentRequestsTab() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('ALL')

  useEffect(() => {
    setLoading(true)
    const q = filter !== 'ALL' ? `&status=${filter}` : ''
    authFetch(`${API_BASE}/api/v1/teachers/me/enrollment-requests?size=50${q}`)
      .then(r => r.json())
      .then(data => { setRequests(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  const updateStatus = (id, s) =>
    setRequests(prev => prev.map(r => r.requestId === id ? { ...r, status: s } : r))

  const accept = async (id) => {
    try {
      await authFetch(`${API_BASE}/api/v1/enrollment-requests/${id}/accept`, { method: 'PATCH' })
      updateStatus(id, 'ACCEPTED')
    } catch {
      alert('수락에 실패했어요. 다시 시도해주세요.')
    }
  }
  const reject = async (id) => {
    if (!window.confirm('이 신청을 거절할까요?')) return
    try {
      await authFetch(`${API_BASE}/api/v1/enrollment-requests/${id}/reject`, { method: 'PATCH' })
      updateStatus(id, 'REJECTED')
    } catch {
      alert('거절에 실패했어요. 다시 시도해주세요.')
    }
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">
        수강 신청 받은 목록
        {pendingCount > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, background: '#FEF2F2', color: '#DC2626', borderRadius: 999, padding: '3px 10px', fontWeight: 700 }}>
            {pendingCount}건 대기
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
        <div className="mp-empty">
          <p className="mp-empty__text">수강 신청이 없어요</p>
        </div>
      )}
      {!loading && requests.length > 0 && (
        <div className="mp-req-list">
          {requests.map((r, i) => {
            const grade   = r.student?.grade ? (GRADE_LABEL[r.student.grade] ?? r.student.grade) : null
            const name    = r.student?.name ?? '학생'
            return (
              <div className="mp-req-card" key={r.requestId} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="mp-req-header">
                  <div className="mp-req-avatar" style={{ background: avatarBg(name) }}>{name[0]}</div>
                  <div className="mp-req-header-info">
                    <p className="mp-req-course">{r.courseTitle}</p>
                    <p className="mp-req-student">
                      {name}
                      {grade && ` · ${grade}`}
                      {r.student?.region && ` · ${r.student.region}`}
                    </p>
                  </div>
                  <span className={`mp-req-status ${r.status}`}>{REQ_STATUS_LBL[r.status] ?? r.status}</span>
                </div>

                {(r.student?.goal || r.message || r.preferredSchedule) && (
                  <div className="mp-req-body">
                    {r.student?.goal && (
                      <p style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500, marginBottom: 6 }}>{r.student.goal}</p>
                    )}
                    {r.message && <p className="mp-req-msg">{r.message}</p>}
                    {(r.preferredSchedule || r.preferredStart) && (
                      <div className="mp-req-meta-row">
                        {r.preferredSchedule && <span className="mp-req-meta-item">{r.preferredSchedule}</span>}
                        {r.preferredStart    && <span className="mp-req-meta-item">{r.preferredStart}</span>}
                      </div>
                    )}
                  </div>
                )}

                <div className="mp-req-footer">
                  <span className="mp-req-date">{new Date(r.createdAt).toLocaleDateString('ko-KR')} 신청</span>
                  {r.status === 'PENDING' && (
                    <div className="mp-req-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => reject(r.requestId)}>거절</button>
                      <button className="btn btn-primary btn-sm"   onClick={() => accept(r.requestId)}>수락</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
