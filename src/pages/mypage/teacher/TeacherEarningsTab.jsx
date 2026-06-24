import { useState, useEffect } from 'react'
import { fetchTeacherEarnings } from '../../../api/paymentApi.js'

export default function TeacherEarningsTab() {
  const [data, setData] = useState({ totalEarnings: 0, content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetchTeacherEarnings(page, 10, startDate, endDate).then(res => {
      if (active) {
        setData({
          totalEarnings: res.totalEarnings || 0,
          content: res.content || [],
          totalPages: res.totalPages || 0
        })
        setLoading(false)
      }
    }).catch(e => {
      console.error(e)
      if (active) {
        setError('수익 내역을 불러오지 못했습니다.')
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [page, startDate, endDate])

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value)
    setPage(0)
  }

  const handleEndDateChange = (e) => {
    if (startDate && e.target.value && e.target.value < startDate) {
      alert('종료일은 시작일보다 빠를 수 없습니다.')
      return
    }
    setEndDate(e.target.value)
    setPage(0)
  }

  return (
    <div className="tab-pane">
      <h2 className="tab-title">수익 관리</h2>
      <p className="tab-desc">학생들이 결제한 수강료에 대한 정산 내역입니다. (수수료 제외 실수익)</p>
      {error && <p style={{ color: '#dc2626', textAlign: 'center', fontWeight: 'bold', margin: '16px 0' }}>{error}</p>}

      <div className="earnings-summary" style={{
        background: '#fffbeb',
        padding: '32px 24px',
        borderRadius: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #fde68a',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.05)'
      }}>
        <span style={{ fontSize: '15px', color: '#b45309', fontWeight: '700', marginBottom: '8px' }}>총 누적 정산 수익</span>
        <strong style={{ fontSize: '36px', color: '#92400e', letterSpacing: '-0.5px' }}>
          {data.totalEarnings.toLocaleString()} <span style={{ fontSize: '20px', fontWeight: '600' }}>M</span>
        </strong>
      </div>

      <div className="earnings-filters" style={{ display: 'flex', gap: '24px', marginBottom: '32px', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
        <div>
          <label style={{ marginRight: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--ink-main)' }}>시작일</label>
          <input type="date" value={startDate} onChange={handleStartDateChange} className="form-input" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
        </div>
        <span style={{ color: 'var(--ink-soft)' }}>~</span>
        <div>
          <label style={{ marginRight: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--ink-main)' }}>종료일</label>
          <input type="date" value={endDate} onChange={handleEndDateChange} className="form-input" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
        </div>
      </div>

      <div className="history-list">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '40px 0' }}>불러오는 중...</p>
        ) : data.content.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>💰</span>
            아직 수익 내역이 없습니다.<br/>새로운 강의를 열어보세요!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '16px 12px', color: 'var(--ink-main)' }}>발생 일시</th>
                  <th style={{ padding: '16px 12px', color: 'var(--ink-main)' }}>수업명</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--ink-main)' }}>정산 수익</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--ink-main)' }}>정산 후 잔액</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--soft-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 12px', color: 'var(--ink-soft)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 12px', fontWeight: 'bold', color: 'var(--ink-dark)' }}>
                      {h.courseTitle || '알 수 없는 수업'}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '700', color: '#16a34a', fontSize: '15px', whiteSpace: 'nowrap' }}>
                      +{h.amount.toLocaleString()} M
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--ink-soft)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      {h.balanceAfter.toLocaleString()} M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            이전
          </button>
          <span style={{ padding: '4px 16px', background: '#f8fafc', borderRadius: '8px', fontWeight: '600', color: 'var(--ink-main)' }}>
            {page + 1} / {data.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= data.totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
