import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { getNaegongTier } from '../../../utils/naegong.js'

export default function NaegongTab() {
  const [totalScore, setTotalScore] = useState(null)
  const [rows, setRows]             = useState([])
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const load = useCallback((p) => {
    setLoading(true); setError('')
    authFetch(`${API_BASE}/api/v1/teachers/me/naegong-history?page=${p}&size=20`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { setError(data.message || '불러오기에 실패했습니다.'); return }
        setTotalScore(data.totalScore ?? 0)
        setRows(data.histories?.content ?? [])
        setTotalPages(data.histories?.totalPages ?? 1)
        setPage(data.histories?.number ?? p)
      })
      .catch(() => setError('네트워크 오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(0) }, [load])

  const formatDate = (iso) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const tier = getNaegongTier(totalScore ?? 0)

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">내공</h2>

      <div className="mp-naegong-score-card">
        <span className="mp-naegong-score-label">누적 내공</span>
        {loading ? (
          <span className="mp-naegong-score-value">불러오는 중</span>
        ) : totalScore === null ? (
          <span className="mp-naegong-score-value">-</span>
        ) : (
          <>
            <span className="mp-naegong-score-value">{totalScore.toLocaleString()}점</span>
            <span className={`mp-naegong-tier mp-naegong-tier--${tier.cls}`}>{tier.label}</span>
          </>
        )}
      </div>

      <div className="mp-naegong-table">
        <div className="mp-naegong-header">
          <span>날짜</span>
          <span>구분</span>
          <span>내용</span>
          <span>획득 내공</span>
        </div>

        {loading && <div className="mp-naegong-empty">불러오는 중...</div>}
        {!loading && error && <div className="mp-naegong-empty error">{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="mp-naegong-empty">내공 획득 이력이 없습니다.</div>
        )}
        {!loading && !error && rows.map((row) => (
          <div key={row.id ?? `${row.createdAt}-${row.reason}`} className="mp-naegong-row">
            <span>{formatDate(row.createdAt)}</span>
            <span>{row.reasonLabel ?? '-'}</span>
            <span>{row.relatedTitle ?? '-'}</span>
            <span className="mp-naegong-score-change">+{row.scoreChange}</span>
          </div>
        ))}
      </div>

      <WindowedPagination page={page} totalPages={totalPages} onPageChange={load} />
    </div>
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
