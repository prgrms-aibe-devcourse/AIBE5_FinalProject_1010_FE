import { useState, useEffect } from 'react'
import { API_BASE } from '../../api/config.js'
import FilterPanel from './FilterPanel.jsx'
import CourseCard from './CourseCard.jsx'

const PAGE_SIZE = 12

const DEFAULT_FILTERS = {
  subjectIds:   [],
  targetGrades: [],
  minPrice:     null,
  maxPrice:     null,
  minGroupSize: null,
  maxGroupSize: null,
  sort:         'LATEST',
}

function buildQueryString(filters, page) {
  const params = new URLSearchParams()
  if (filters.subjectIds.length)   filters.subjectIds.forEach((id) => params.append('subjectIds', id))
  if (filters.targetGrades.length) filters.targetGrades.forEach((g) => params.append('targetGrades', g))
  if (filters.minPrice != null)    params.set('minPrice', filters.minPrice)
  if (filters.maxPrice != null)    params.set('maxPrice', filters.maxPrice)
  if (filters.minGroupSize != null) params.set('minGroupSize', filters.minGroupSize)
  if (filters.maxGroupSize != null) params.set('maxGroupSize', filters.maxGroupSize)
  params.set('sort', filters.sort)
  params.set('page', page)
  params.set('size', PAGE_SIZE)
  return params.toString()
}

export default function SearchPage() {
  const [courses, setCourses]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters]         = useState(DEFAULT_FILTERS)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`${API_BASE}/api/v1/courses?${buildQueryString(filters, currentPage)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const content = (data.content ?? []).filter(c => c.status === 'RECRUITING')
        setCourses(content)
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)
      })
      .catch(() => { if (!cancelled) { setCourses([]); setError(true) } })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [filters, currentPage])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(0)
  }

  const goPage = (p) => {
    if (p < 0 || p >= totalPages) return
    setCurrentPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="search-hero">
        <div className="search-hero-inner">
          <span className="eyebrow coral">🔎 검색 & 추천</span>
          <h1>나에게 맞는 수업을 <span className="hand">찾아봐요</span></h1>
          <p>원하는 분야와 조건을 선택하면 딱 맞는 수업을 추천해드려요</p>

          <FilterPanel filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />
        </div>
      </section>

      {/* ===== 결과 ===== */}
      <div className="search-main">
        <main>
          {/* 결과 헤더 */}
          <div className="result-header">
            <div className="result-count">
              총 <strong>{loading ? '...' : totalElements.toLocaleString()}개</strong>의 수업을 찾았어요
            </div>
          </div>

          {/* 카드 그리드 — 필터 변경 중에는 기존 카드 흐리게 유지 */}
          <div className={`results-grid${loading && courses.length > 0 ? ' results-grid--loading' : ''}`}>
            {loading && courses.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)', fontWeight: 700 }}>
                수업 목록을 불러오는 중...
              </div>
            )}
            {!loading && error && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48 }}>⚠️</div>
                <p style={{ color: 'var(--ink-mute)', marginTop: 12, fontWeight: 600 }}>
                  수업 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
                </p>
              </div>
            )}
            {!loading && !error && courses.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <p style={{ color: 'var(--ink-mute)', marginTop: 12, fontWeight: 600 }}>
                  조건에 맞는 수업을 찾지 못했어요
                </p>
              </div>
            )}
            {courses.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>

          {/* 페이지네이션 */}
          {!loading && totalPages > 1 && (
            <div className="pagination">
              <div className="page-num" onClick={() => goPage(currentPage - 1)}>‹</div>
              {Array.from({ length: totalPages }, (_, i) => (
                <div
                  key={i}
                  className={`page-num${i === currentPage ? ' active' : ''}`}
                  onClick={() => goPage(i)}
                >
                  {i + 1}
                </div>
              ))}
              <div className="page-num" onClick={() => goPage(currentPage + 1)}>›</div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
