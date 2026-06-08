/**
 * @file SearchPage.jsx
 * @description 수업 찾기 페이지입니다.
 * - GET /api/v1/courses 로 강의 목록을 불러옵니다.
 * - 학년·가격·정렬·키워드 필터를 쿼리 파라미터로 전송합니다.
 */
import { useState, useEffect } from 'react'
import { API_BASE } from '../../api/config.js'
import FilterPanel from './FilterPanel.jsx'
import CourseCard from './CourseCard.jsx'

const PAGE_SIZE = 12

const DEFAULT_FILTERS = {
  keyword:      '',
  targetGrades: [],
  minPrice:     null,
  maxPrice:     null,
  sort:         'LATEST',
}

const POPULAR_CHIPS = ['수능 미적분', '중등 영문법', '코딩테스트', '토익 800+', '내신 화학']

function buildQueryString(filters, page) {
  const params = new URLSearchParams()
  if (filters.keyword)              params.set('keyword', filters.keyword)
  if (filters.targetGrades.length)  filters.targetGrades.forEach((g) => params.append('targetGrades', g))
  if (filters.minPrice != null)     params.set('minPrice', filters.minPrice)
  if (filters.maxPrice != null)     params.set('maxPrice', filters.maxPrice)
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
  const [inputValue, setInputValue]   = useState('')  // 검색창 입력 (Enter/버튼 시 filters.keyword 에 반영)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`${API_BASE}/api/v1/courses?${buildQueryString(filters, currentPage)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setCourses(data.content ?? [])
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
    setInputValue('')
    setCurrentPage(0)
  }

  const applySearch = (keyword) => {
    handleFilterChange('keyword', keyword)
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

          <div className="search-box">
            <input
              type="text"
              placeholder="과목, 학년, 수업 이름을 입력하세요"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch(inputValue)}
            />
            <button className="search-btn" onClick={() => applySearch(inputValue)} aria-label="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>

          <div className="chips">
            <span>인기 검색:</span>
            {POPULAR_CHIPS.map((chip) => (
              <button key={chip} className="chip" onClick={() => { setInputValue(chip); applySearch(chip) }}>
                # {chip}
              </button>
            ))}
          </div>

          <FilterPanel filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />
        </div>
      </section>

      {/* ===== 결과 ===== */}
      <div className="search-main">
        <main>
          {/* AI 추천 배너 */}
          <div className="ai-banner">
            <div className="ai-icon">✨</div>
            <div>
              <h3>AI가 추천하는 <span className="hand">맞춤 강의</span></h3>
              <p>학습 이력과 관심 분야를 분석해 가장 잘 맞는 선생님을 찾아드려요</p>
            </div>
            <button>AI 추천 받기 →</button>
          </div>

          {/* 결과 헤더 */}
          <div className="result-header">
            <div className="result-count">
              총 <strong>{loading ? '...' : totalElements.toLocaleString()}개</strong>의 수업을 찾았어요
            </div>
            <select
              className="sort-select"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="LATEST">최신순</option>
              <option value="PRICE_ASC">가격 낮은순</option>
              <option value="PRICE_DESC">가격 높은순</option>
            </select>
          </div>

          {/* 카드 그리드 */}
          <div className="results-grid">
            {loading && (
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
            {!loading && courses.map((c) => <CourseCard key={c.id} course={c} />)}
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
