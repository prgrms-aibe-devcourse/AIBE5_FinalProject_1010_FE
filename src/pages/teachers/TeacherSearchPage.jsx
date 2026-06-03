/**
 * @file TeacherSearchPage.jsx
 * @description 선생님 찾기 페이지입니다.
 * - GET /api/v1/teachers?keyword=&minNaegongScore=&page=&size= 로 서버사이드 필터링합니다.
 */
import { useState, useEffect } from 'react'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import TeacherCard from './TeacherCard.jsx'
import TeacherFilterPanel from './TeacherFilterPanel.jsx'

const PAGE_SIZE = 12

// 내공 티어 → 백엔드 minNaegongScore 파라미터 매핑
const NAEGONG_MIN = { all: 0, master: 1000, expert: 500, mid: 100 }

const DEFAULT_FILTERS = { naegongTier: 'all', keyword: '' }

const POPULAR_CHIPS = ['서울대 수학', '영어 회화', '코딩 멘토', '내신 전문']

function buildQuery(filters, page) {
  const params = new URLSearchParams()
  if (filters.keyword.trim())          params.set('keyword', filters.keyword.trim())
  const minScore = NAEGONG_MIN[filters.naegongTier] ?? 0
  if (minScore > 0)                    params.set('minNaegongScore', minScore)
  params.set('page', page)
  params.set('size', PAGE_SIZE)
  return params.toString()
}

export default function TeacherSearchPage() {
  const [teachers, setTeachers]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [currentPage, setCurrentPage]     = useState(0)
  const [totalPages, setTotalPages]       = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters]             = useState(DEFAULT_FILTERS)
  const [inputValue, setInputValue]       = useState('')  // 검색창 입력값 (Enter/버튼 시 적용)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    authFetch(`${API_BASE}/api/v1/teachers?${buildQuery(filters, currentPage)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setTeachers(data.content ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)
      })
      .catch(() => { if (!cancelled) setTeachers([]) })
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
    setFilters((prev) => ({ ...prev, keyword }))
    setCurrentPage(0)
  }

  const goPage = (p) => {
    if (p < 0 || p >= totalPages) return
    setCurrentPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* ===== Hero: 제목 + 검색창 ===== */}
      <section className="teacher-search-hero">
        <div className="teacher-search-hero-inner">
          <span className="eyebrow coral">🧑‍🏫 선생님 탐색</span>
          <h1 className="mt-16">
            마음에 꼭 맞는 선생님을 <span className="hand">만나보세요</span>
          </h1>
          <p>학력·경력·내공으로 검증된 선생님을 한눈에 비교해보세요</p>

          <div className="search-box">
            <input
              type="text"
              placeholder="과목, 학교, 선생님 이름을 입력하세요"
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

          <div className="chips" style={{ marginTop: 16 }}>
            <span>인기 선생님:</span>
            {POPULAR_CHIPS.map((chip) => (
              <button key={chip} className="chip" onClick={() => { setInputValue(chip); applySearch(chip) }}>
                # {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 본문: 필터 + 결과 ===== */}
      <div className="teacher-search-main">
        <TeacherFilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        <section>
          {/* AI 매칭 배너 */}
          <div className="ai-banner">
            <div className="ai-icon">✨</div>
            <div>
              <h3>나에게 딱 맞는 <span className="hand">선생님 추천</span></h3>
              <p>학습 성향과 목표를 분석해 가장 잘 맞는 선생님을 매칭해드려요</p>
            </div>
            <button>AI 매칭 받기 →</button>
          </div>

          {/* 결과 헤더 */}
          <div className="result-header">
            <div className="result-count">
              총 <strong>{loading ? '...' : totalElements.toLocaleString()}명</strong>의 선생님을 찾았어요
            </div>
          </div>

          {/* 카드 그리드 */}
          <div className="teacher-grid">
            {loading && (
              <div className="teacher-loading">선생님 목록을 불러오는 중...</div>
            )}
            {!loading && teachers.length === 0 && (
              <div className="teacher-empty">
                <div style={{ fontSize: 48 }}>🔍</div>
                <p>조건에 맞는 선생님을 찾지 못했어요</p>
              </div>
            )}
            {!loading && teachers.map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
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
        </section>
      </div>
    </>
  )
}
