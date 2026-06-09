/**
 * @file QnaPage.jsx
 * @description 질문게시판 전체 목록 페이지. 필터(과목/검색/상태)·정렬·페이지네이션을 모두
 *              백엔드 API로 처리한다(서버사이드). 상단 통계는 전용 통계 엔드포인트로 받는다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchQuestions, fetchQuestionStats, mapSummaryToPost } from '../../api/qnaApi.js'
import { fetchSubjects } from '../../api/subjectApi.js'
import QnaCard from './QnaCard.jsx'
import QnaToolbar from './QnaToolbar.jsx'

const DEFAULT_FILTERS = {
  keyword: '',
  subject: '전체',
  status: 'all',
  sort: 'latest',
}
const PAGE_SIZE = 12

// 정렬 키 → 서버 sort 파라미터
const SORT_PARAM = {
  latest: 'createdAt,desc',
  answers: 'answerCount,desc',
  views: 'viewCount,desc',
}

export default function QnaPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [pageData, setPageData] = useState({ content: [], totalPages: 0, totalElements: 0, number: 0 })
  const [subjects, setSubjects] = useState([])
  const [stats, setStats] = useState({ totalQuestions: 0, resolvedQuestions: 0, waitingQuestions: 0, totalAnswers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 검색어는 타이핑마다 요청하지 않도록 디바운스
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(filters.keyword.trim()), 300)
    return () => clearTimeout(timer)
  }, [filters.keyword])

  // 과목 목록(필터용) + 전역 통계는 최초 1회 로드
  useEffect(() => {
    fetchSubjects()
      .then((list) => setSubjects(Array.isArray(list) ? list : []))
      .catch(() => setSubjects([]))
    fetchQuestionStats()
      .then((s) => setStats(s))
      .catch(() => {})
  }, [])

  // 필터 → 서버 파라미터 변환
  const subjectId = useMemo(() => {
    if (filters.subject === '전체') return undefined
    return subjects.find((s) => s.name === filters.subject)?.subjectId
  }, [filters.subject, subjects])
  const resolvedParam = filters.status === 'all' ? undefined : filters.status === 'resolved'
  const sortParam = SORT_PARAM[filters.sort] ?? SORT_PARAM.latest

  // 목록 로드 (필터/정렬/페이지가 바뀔 때마다 서버에 요청)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchQuestions({
      subjectId,
      keyword: debouncedKeyword || undefined,
      resolved: resolvedParam,
      sort: sortParam,
      page,
      size: PAGE_SIZE,
    })
      .then((res) => {
        if (active) setPageData(res)
      })
      .catch((err) => {
        if (active) setError(err.message || '질문 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [subjectId, debouncedKeyword, resolvedParam, sortParam, page])

  const subjectOptions = useMemo(() => ['전체', ...subjects.map((s) => s.name)], [subjects])

  // 필터 변경 시 항상 첫 페이지로
  const handleFilterChange = useCallback((next) => {
    setFilters(next)
    setPage(0)
  }, [])
  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(0)
  }, [])

  const posts = useMemo(() => (pageData.content || []).map(mapSummaryToPost), [pageData])
  const totalPages = pageData.totalPages || 0
  const currentPage = pageData.number || 0

  return (
    <main className="qna-page">
      <section className="qna-hero">
        <div className="container qna-hero__inner">
          <div className="qna-hero__copy">
            <span className="qna-hero__label">질문게시판</span>
            <h1>막힌 문제를 올리고 <span className="hand">같이 해결해요</span></h1>
            <p>과목별 질문을 카드로 빠르게 훑어보고, 필요한 질문은 검색과 필터로 바로 찾을 수 있습니다.</p>
          </div>

          <div className="qna-hero__stats" aria-label="질문게시판 통계">
            <Stat label="전체 질문" value={stats.totalQuestions} />
            <Stat label="답변 대기" value={stats.waitingQuestions} />
            <Stat label="해결됨" value={stats.resolvedQuestions} />
            <Stat label="누적 답변" value={stats.totalAnswers} />
          </div>
        </div>
      </section>

      <section className="qna-main container">
        <QnaToolbar
          filters={filters}
          resultCount={pageData.totalElements || 0}
          subjectOptions={subjectOptions}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onOpenWrite={() => navigate('/qna/write')}
        />

        {loading ? (
          <div className="qna-empty"><p>질문을 불러오는 중…</p></div>
        ) : error ? (
          <div className="qna-empty">
            <h2>질문을 불러오지 못했습니다</h2>
            <p>{error}</p>
            <button className="btn btn-secondary" type="button" onClick={() => setPage((p) => p)}>다시 시도</button>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="qna-list-grid" aria-label="질문 목록">
              {posts.map((post, index) => <QnaCard key={post.id} post={post} index={index} />)}
            </div>
            {totalPages > 1 && (
              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        ) : (
          <div className="qna-empty">
            <h2>{(pageData.totalElements || 0) === 0 ? '아직 등록된 질문이 없습니다' : '검색 결과가 없습니다'}</h2>
            <p>조건에 맞는 질문이 없어요. 검색어를 줄이거나 필터를 초기화해보세요.</p>
            <button className="btn btn-secondary" type="button" onClick={handleReset}>필터 초기화</button>
          </div>
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div className="qna-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

/** 페이지네이션 — 이전/다음 + 페이지 번호(현재 기준 최대 5개 노출). */
function Pagination({ page, totalPages, onChange }) {
  const windowSize = 5
  const start = Math.max(0, Math.min(page - 2, totalPages - windowSize))
  const numbers = Array.from({ length: Math.min(windowSize, totalPages) }, (_, i) => start + i)

  return (
    <nav className="qna-pagination" aria-label="질문 목록 페이지">
      <button type="button" className="qna-pagination__nav" disabled={page === 0} onClick={() => onChange(page - 1)}>
        이전
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          className={`qna-pagination__num ${n === page ? 'is-active' : ''}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n + 1}
        </button>
      ))}
      <button
        type="button"
        className="qna-pagination__nav"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </nav>
  )
}
