import { useState, useEffect } from 'react'
import { fetchTeacherEarnings } from '../../../api/paymentApi.js'

export default function TeacherEarningsTab() {
  const [data, setData] = useState({ totalEarnings: 0, content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let active = true
    setLoading(true)
    fetchTeacherEarnings(page, 10).then(res => {
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
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [page])

  return (
    <div className="tab-pane">
      <h2 className="tab-title">수익 관리</h2>
      <p className="tab-desc">학생들이 결제한 수강료에 대한 정산 내역입니다. (수수료 제외 실수익)</p>

      <div className="earnings-summary" style={{
        background: '#fffbeb',
        padding: '32px 24px',
        borderRadius: '16px',
        marginBottom: '32px',
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
                  <th style={{ padding: '16px 12px', color: 'var(--ink-main)' }}>사유</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--ink-main)' }}>수익 내역</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--ink-main)' }}>정산 후 잔액</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--soft-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 12px', color: 'var(--ink-soft)', fontSize: '14px' }}>
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>수강 신청 수입</span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '700', color: '#16a34a', fontSize: '15px' }}>
                      +{h.amount.toLocaleString()} M
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--ink-soft)', fontSize: '14px' }}>
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
