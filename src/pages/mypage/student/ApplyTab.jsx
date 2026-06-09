import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { REQUEST_STATUS_LABEL, PAGE_SIZE } from '../../../utils/labels.js'

const FILTERS = [
  { v: 'ALL', l: '전체' }, { v: 'PENDING', l: '대기 중' },
  { v: 'ACCEPTED', l: '수락됨' }, { v: 'REJECTED', l: '거절됨' },
]

export default function ApplyTab() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('ALL')

  useEffect(() => {
    setLoading(true)
    const q = filter !== 'ALL' ? `&status=${filter}` : ''
    authFetch(`${API_BASE}/api/v1/students/me/enrollment-requests?size=${PAGE_SIZE}${q}`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => { setRequests(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  const cancel = async (requestId) => {
    if (!window.confirm('신청을 취소할까요?')) return
    try {
      const res = await authFetch(`${API_BASE}/api/v1/enrollment-requests/${requestId}/cancel`, { method: 'PATCH' })
      if (!res.ok) throw new Error(res.statusText)
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: 'CANCELLED' } : r))
    } catch {
      alert('취소에 실패했어요. 다시 시도해주세요.')
    }
  }

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">신청 내역</h2>

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
          <p className="mp-empty__text">신청 내역이 없어요</p>
        </div>
      )}
      {!loading && requests.length > 0 && (
        <div className="mp-req-list">
          {requests.map((r, i) => (
            <div className="mp-req-card" key={r.requestId} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="mp-req-header">
                <div className="mp-req-avatar" style={{ background: '#E0F2FE' }}>{r.courseTitle?.[0] ?? 'C'}</div>
                <div className="mp-req-header-info">
                  <p className="mp-req-course">{r.courseTitle}</p>
                  <p className="mp-req-student">{r.teacherName} 선생님</p>
                </div>
                <span className={`mp-req-status ${r.status}`}>{REQUEST_STATUS_LABEL[r.status] ?? r.status}</span>
              </div>
              <div className="mp-req-footer">
                <span className="mp-req-date">{new Date(r.createdAt).toLocaleDateString('ko-KR')} 신청</span>
                {r.status === 'PENDING' && (
                  <div className="mp-req-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => cancel(r.requestId)}>
                      신청 취소
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
