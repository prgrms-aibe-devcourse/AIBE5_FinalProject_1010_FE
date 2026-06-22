import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'

/**
 * 로그인 기록 공용 뷰 컴포넌트.
 * variant="admin" → admin-* 클래스 / variant="mypage"(기본) → mp-login-history-* 클래스
 */
export default function LoginHistoryView({ variant = 'mypage' }) {
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

  const isAdmin = variant === 'admin'
  const tableCard   = isAdmin ? 'admin-table-card'           : 'mp-login-history-table'
  const headerCls   = isAdmin ? 'admin-login-history-header' : 'mp-login-history-header'
  const rowCls      = isAdmin ? 'admin-login-history-row'    : 'mp-login-history-row'
  const emptyCls    = isAdmin ? 'admin-table-empty'          : 'mp-login-history-empty'

  return (
    <>
      <div className={tableCard}>
        <div className={headerCls}>
          <span>로그인 일시</span>
          <span>IP 주소</span>
          <span>기기 정보</span>
          <span>브라우저</span>
        </div>

        {loading && <div className={emptyCls}>불러오는 중...</div>}
        {!loading && error && <div className={`${emptyCls} error`}>{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className={emptyCls}>로그인 기록이 없습니다.</div>
        )}
        {!loading && !error && rows.map((row) => (
          <div key={row.id} className={rowCls}>
            <span>{formatDate(row.loginAt)}</span>
            <span>{row.ipAddress || '-'}</span>
            <span>{row.deviceInfo || '-'}</span>
            <span>{row.browser || '-'}</span>
          </div>
        ))}
      </div>

      <WindowedPagination page={page} totalPages={totalPages} onPageChange={load} />
    </>
  )
}

function WindowedPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const WINDOW = 2
  const pages = []

  const add = (p) => {
    if (pages.at(-1) === '…' || pages.at(-1) === p) return
    if (pages.length > 0 && p - pages.at(-1) === 2) pages.push(p - 1)
    else if (pages.length > 0 && p - pages.at(-1) > 1) pages.push('…')
    pages.push(p)
  }

  add(0)
  for (let i = Math.max(1, page - WINDOW); i <= Math.min(totalPages - 2, page + WINDOW); i++) add(i)
  add(totalPages - 1)

  return (
    <div className="pagination" style={{ marginTop: 20 }}>
      <div className={`page-num${page === 0 ? ' disabled' : ''}`} onClick={() => page > 0 && onPageChange(page - 1)}>‹</div>
      {pages.map((p, i) =>
        p === '…'
          ? <div key={`e-${i}`} className="page-num page-num--ellipsis">…</div>
          : <div key={p} className={`page-num${p === page ? ' active' : ''}`} onClick={() => onPageChange(p)}>{p + 1}</div>
      )}
      <div className={`page-num${page === totalPages - 1 ? ' disabled' : ''}`} onClick={() => page < totalPages - 1 && onPageChange(page + 1)}>›</div>
    </div>
  )
}
