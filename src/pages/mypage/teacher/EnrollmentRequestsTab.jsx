import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL, REQUEST_STATUS_LABEL, PAGE_SIZE } from '../../../utils/labels.js'
import { avatarBg } from '../../../utils/avatarColor.js'

const FILTERS = [
  { v: 'ALL', l: '전체' }, { v: 'PENDING', l: '대기 중' },
  { v: 'ACCEPTED', l: '수락됨' }, { v: 'REJECTED', l: '거절됨' },
]

const DETAIL_FIELDS = [
  { key: 'introduction',      label: '자기소개' },
  { key: 'goal',              label: '수강 목표' },
  { key: 'preferredSchedule', label: '희망 수업 일정' },
  { key: 'preferredStart',    label: '수업 시작 희망일' },
  { key: 'message',           label: '선생님께 한 마디' },
]

export default function EnrollmentRequestsTab() {
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('ALL')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    setLoading(true)
    setExpandedId(null)
    const q = filter !== 'ALL' ? `&status=${filter}` : ''
    authFetch(`${API_BASE}/api/v1/teachers/me/enrollment-requests?size=${PAGE_SIZE}${q}`)
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

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id)

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
        <div className="mp-empty">
          <p className="mp-empty__text">수강 신청이 없어요</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="mp-req-list">
          {requests.map((r) => {
            const name      = r.student?.name ?? '학생'
            const grade     = r.student?.grade ? (GRADE_LABEL[r.student.grade] ?? r.student.grade) : null
            const isOpen    = expandedId === r.requestId
            const hasDetail = DETAIL_FIELDS.some(f =>
              f.from === 'student' ? !!r.student?.[f.key] : !!r[f.key]
            )

            return (
              <div className="mp-req-card" key={r.requestId}>

                {/* ── 요약 행 ── */}
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
                        <button className="btn btn-secondary btn-sm" onClick={() => reject(r.requestId)}>거절</button>
                        <button className="btn btn-primary btn-sm"   onClick={() => accept(r.requestId)}>수락</button>
                      </div>
                    )}
                    {hasDetail && (
                      <button className="mp-req-toggle" onClick={() => toggle(r.requestId)}>
                        {isOpen ? '접기 ▲' : '상세 보기 ▼'}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── 상세 펼치기 ── */}
                {isOpen && (
                  <div className="mp-req-detail">
                    {DETAIL_FIELDS.map(f => {
                      const val = f.from === 'student' ? r.student?.[f.key] : r[f.key]
                      if (!val) return null
                      return (
                        <div className="mp-req-detail-row" key={f.key}>
                          <span className="mp-req-detail-label">{f.label}</span>
                          <p className="mp-req-detail-val">{val}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
