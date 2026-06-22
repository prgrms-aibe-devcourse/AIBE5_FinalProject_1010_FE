import { useState, useEffect } from 'react'
import { API_BASE } from '../../api/config.js'
import FilterPanel from './FilterPanel.jsx'
import CourseCard from './CourseCard.jsx'
import { SearchIcon, WarningIcon, EmptySearchIcon } from '../../components/icons/SearchIcons.jsx'

const PAGE_SIZE = 12

const SORT_OPTIONS = [
  { value: 'LATEST',     label: '최신순' },
  { value: 'OLDEST',     label: '오래된순' },
  { value: 'PRICE_ASC',  label: '가격 낮은순' },
  { value: 'PRICE_DESC', label: '가격 높은순' },
  { value: 'DISTANCE',   label: '가까운순' },
]

const DEFAULT_FILTERS = {
  keyword:      '',
  subjectIds:   [],
  targetGrades: [],
  teachingMode: null,
  regions:      [],
  minPrice:     null,
  maxPrice:     null,
  minGroupSize: null,
  maxGroupSize: null,
  sort:         'LATEST',
  // 가까운순(DISTANCE) 정렬에 쓰는 학생 현재 위치 — 브라우저 GPS로 채워짐
  studentLat:   null,
  studentLng:   null,
}

function buildQueryString(filters, page) {
  const params = new URLSearchParams()
  if (filters.keyword?.trim())     params.set('keyword', filters.keyword.trim())
  if (filters.subjectIds.length)   filters.subjectIds.forEach((id) => params.append('subjectIds', id))
  if (filters.targetGrades.length) filters.targetGrades.forEach((g) => params.append('targetGrades', g))
  if (filters.teachingMode)        params.set('teachingMode', filters.teachingMode)
  if (filters.regions?.length)     filters.regions.forEach((r) => params.append('regions', r))
  if (filters.minPrice != null)    params.set('minPrice', filters.minPrice)
  if (filters.maxPrice != null)    params.set('maxPrice', filters.maxPrice)
  if (filters.minGroupSize != null) params.set('minGroupSize', filters.minGroupSize)
  if (filters.maxGroupSize != null) params.set('maxGroupSize', filters.maxGroupSize)
  params.set('sort', filters.sort)
  // 가까운순일 때만 좌표 전송 (대면 수업 한정 정렬은 백엔드에서 강제)
  if (filters.sort === 'DISTANCE' && filters.studentLat != null && filters.studentLng != null) {
    params.set('studentLat', filters.studentLat)
    params.set('studentLng', filters.studentLng)
  }
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
  const [keywordInput, setKeywordInput] = useState('')
  const [locating, setLocating]       = useState(false)  // 가까운순 선택 시 GPS 좌표 확보 중

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
    setKeywordInput('')
    setCurrentPage(0)
    setLocating(false)  // GPS 확보 중에 초기화해도 locating 잠금이 남지 않도록
  }

  // 정렬 변경. 가까운순(DISTANCE)은 학생 현재 위치(GPS)가 필요하므로
  // 권한을 요청해 좌표를 확보한 뒤에만 정렬을 적용한다(거부 시 정렬 미변경).
  const handleSortChange = (value) => {
    if (value !== 'DISTANCE') {
      // 다른 정렬로 바꿀 땐 좌표를 비워 불필요한 전송을 막는다
      setFilters((prev) => ({ ...prev, sort: value, studentLat: null, studentLng: null }))
      setCurrentPage(0)
      return
    }
    if (!('geolocation' in navigator)) {
      alert('이 브라우저에서는 위치 기반 정렬을 사용할 수 없어요.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setFilters((prev) => ({
          ...prev,
          sort: 'DISTANCE',
          studentLat: pos.coords.latitude,
          studentLng: pos.coords.longitude,
        }))
        setCurrentPage(0)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1 /* PERMISSION_DENIED */) {
          alert('가까운순 정렬을 쓰려면 위치 권한이 필요해요. 브라우저에서 위치 접근을 허용해주세요.')
        } else {
          alert('현재 위치를 확인할 수 없어요. 잠시 후 다시 시도해주세요.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const submitKeyword = (e) => {
    e.preventDefault()
    handleFilterChange('keyword', keywordInput)
  }

  const clearKeyword = () => {
    setKeywordInput('')
    handleFilterChange('keyword', '')
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
          <span className="eyebrow coral">
            <SearchIcon size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            검색 & 추천
          </span>
          <h1>나에게 맞는 수업을 <span className="hand">찾아봐요</span></h1>
          <p>원하는 분야와 조건을 선택하면 딱 맞는 수업을 추천해드려요</p>

          <form className="search-box" onSubmit={submitKeyword}>
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="수업명을 검색해보세요"
            />
            {keywordInput && (
              <button type="button" className="search-box__clear" onClick={clearKeyword} aria-label="검색어 지우기">×</button>
            )}
            <button type="submit" className="search-btn" aria-label="검색">
              <SearchIcon size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* ===== 결과: 좌측 필터 + 우측 리스트 ===== */}
      <div className="search-main search-main--2col">
        <aside className="search-side">
          <FilterPanel filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />
        </aside>

        <main className="search-results">
          {/* 결과 헤더 */}
          <div className="result-header">
            <div className="result-count">
              {filters.keyword
                ? <>'<strong>{filters.keyword}</strong>' 검색 결과 </>
                : '총 '}
              <strong>{loading ? '...' : totalElements.toLocaleString()}개</strong>의 수업을 찾았어요
            </div>
            <div className="sort-tabs">
              {SORT_OPTIONS.map((opt) => {
                const isDistance = opt.value === 'DISTANCE'
                const isLocating = isDistance && locating
                return (
                  <button
                    key={opt.value}
                    className={`sort-tab${filters.sort === opt.value ? ' sort-tab--active' : ''}${isLocating ? ' sort-tab--locating' : ''}`}
                    onClick={() => handleSortChange(opt.value)}
                    disabled={locating}
                    title={isDistance ? '내 위치 기준으로 가까운 대면 수업부터 보여줘요' : undefined}
                  >
                    {isLocating ? '위치 확인 중…' : opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* GPS 확보 중 인라인 안내 */}
          {locating && (
            <p className="locating-notice">현재 위치를 확인하는 중이에요…</p>
          )}

          {/* 카드 리스트 — 한 줄 1개. 필터 변경 중에는 기존 카드 흐리게 유지 */}
          <div className={`results-list${loading && courses.length > 0 ? ' results-list--loading' : ''}`}>
            {loading && courses.length === 0 && (
              <div className="results-empty results-empty--loading">수업 목록을 불러오는 중...</div>
            )}
            {!loading && error && (
              <div className="results-empty">
                <div className="results-empty__ic"><WarningIcon size={48} /></div>
                <p>수업 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
              </div>
            )}
            {!loading && !error && courses.length === 0 && (
              <div className="results-empty">
                <div className="results-empty__ic"><EmptySearchIcon size={48} /></div>
                <p>조건에 맞는 수업을 찾지 못했어요</p>
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
