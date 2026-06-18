import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'

export default function LoginHistoryTab() {
  const [rows, setRows]             = useState([])
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const load = (p) => {
    setLoading(true); setError('')
    authFetch(`${API_BASE}/api/v1/auth/login-history?page=${p}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { setError(data.message || '불러오기에 실패했습니다.'); return }
        setRows(data.content ?? [])
        setTotalPages(data.totalPages ?? 1)
        setPage(data.number ?? p)
      })
      .catch(() => setError('네트워크 오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (iso) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">로그인 기록</h2>

      <div className="mp-login-history-table">
        <div className="mp-login-history-header">
          <span>로그인 일시</span>
          <span>IP 주소</span>
          <span>기기 정보</span>
          <span>브라우저</span>
        </div>

        {loading && <div className="mp-login-history-empty">불러오는 중...</div>}
        {!loading && error && <div className="mp-login-history-empty error">{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="mp-login-history-empty">로그인 기록이 없습니다.</div>
        )}
        {!loading && !error && rows.map((row, i) => (
          <div key={i} className="mp-login-history-row">
            <span>{formatDate(row.loginAt)}</span>
            <span>{row.ipAddress || '-'}</span>
            <span>{row.deviceInfo || '-'}</span>
            <span>{row.browser || '-'}</span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mp-login-history-pagination">
          {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
            <button
              key={p}
              className={`mp-login-history-page${p === page ? ' active' : ''}`}
              onClick={() => load(p)}
              disabled={p === page}
            >
              {p + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
