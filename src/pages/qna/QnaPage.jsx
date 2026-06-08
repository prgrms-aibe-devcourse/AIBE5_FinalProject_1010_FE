/**
 * @file QnaPage.jsx
 * @description 질문게시판 전체 목록 페이지입니다. 백엔드 QnA API로 목록/과목을 불러옵니다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchQuestions, mapSummaryToPost } from '../../api/qnaApi.js'
import { fetchSubjects } from '../../api/subjectApi.js'
import QnaCard from './QnaCard.jsx'
import QnaToolbar from './QnaToolbar.jsx'
import QnaWriteModal from './QnaWriteModal.jsx'

const DEFAULT_FILTERS = {
  keyword: '',
  subject: '전체',
  status: 'all',
  sort: 'latest',
}

export default function QnaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const writeOpen = searchParams.get('write') === '1'

  // 질문 목록 로드 (한 페이지에 충분히 받아 클라이언트에서 필터/정렬/통계)
  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const page = await fetchQuestions({ size: 100 })
      setPosts((page.content || []).map(mapSummaryToPost))
    } catch (err) {
      setError(err.message || '질문 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  // 과목 목록(작성 모달·필터용)
  useEffect(() => {
    fetchSubjects()
      .then((list) => setSubjects(Array.isArray(list) ? list : []))
      .catch(() => setSubjects([]))
  }, [])

  const subjectOptions = useMemo(
    () => ['전체', ...subjects.map((subject) => subject.name)],
    [subjects],
  )

  const filteredPosts = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    const next = posts.filter((post) => {
      const text = `${post.title} ${post.body} ${post.subject}`.toLowerCase()
      const matchesKeyword = !keyword || text.includes(keyword)
      const matchesSubject = filters.subject === '전체' || post.subject === filters.subject
      const matchesStatus = filters.status === 'all' || post.status === filters.status
      return matchesKeyword && matchesSubject && matchesStatus
    })

    return [...next].sort((a, b) => {
      if (filters.sort === 'answers') return b.answers - a.answers
      if (filters.sort === 'views') return b.views - a.views
      return String(b.id).localeCompare(String(a.id), 'ko', { numeric: true })
    })
  }, [filters, posts])

  const stats = useMemo(() => {
    const resolved = posts.filter((post) => post.status === 'resolved').length
    const waiting = posts.length - resolved
    const answers = posts.reduce((sum, post) => sum + post.answers, 0)
    return { total: posts.length, resolved, waiting, answers }
  }, [posts])

  const openWrite = () => setSearchParams({ write: '1' })
  const closeWrite = () => setSearchParams({})

  // 작성 성공 시: 모달 닫고 목록 새로고침
  const handleCreated = () => {
    closeWrite()
    loadPosts()
  }

  return (
    <main className="qna-page">
      <section className="qna-hero">
        <div className="container qna-hero__inner">
          <div className="qna-hero__copy">
            {/* 칩(도형) 없이 텍스트만 — 둥근 한글 폰트(Jua)로 크게 보여주는 섹션 라벨 */}
            <span className="qna-hero__label">질문게시판</span>
            <h1>막힌 문제를 올리고 <span className="hand">같이 해결해요</span></h1>
            <p>과목별 질문을 카드로 빠르게 훑어보고, 필요한 질문은 검색과 필터로 바로 찾을 수 있습니다.</p>
          </div>

          <div className="qna-hero__stats" aria-label="질문게시판 통계">
            <Stat label="전체 질문" value={stats.total} />
            <Stat label="답변 대기" value={stats.waiting} />
            <Stat label="해결됨" value={stats.resolved} />
            <Stat label="누적 답변" value={stats.answers} />
          </div>
        </div>
      </section>

      <section className="qna-main container">
        <QnaToolbar
          filters={filters}
          resultCount={filteredPosts.length}
          subjectOptions={subjectOptions}
          onFilterChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          onOpenWrite={openWrite}
        />

        {loading ? (
          <div className="qna-empty"><p>질문을 불러오는 중…</p></div>
        ) : error ? (
          <div className="qna-empty">
            <h2>질문을 불러오지 못했습니다</h2>
            <p>{error}</p>
            <button className="btn btn-secondary" type="button" onClick={loadPosts}>다시 시도</button>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="qna-list-grid" aria-label="질문 목록">
            {filteredPosts.map((post, index) => <QnaCard key={post.id} post={post} index={index} />)}
          </div>
        ) : (
          <div className="qna-empty">
            <h2>{posts.length === 0 ? '아직 등록된 질문이 없습니다' : '검색 결과가 없습니다'}</h2>
            <p>{posts.length === 0 ? '첫 질문을 남겨보세요.' : '검색어를 줄이거나 필터를 초기화해보세요.'}</p>
            {posts.length > 0 && (
              <button className="btn btn-secondary" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>필터 초기화</button>
            )}
          </div>
        )}
      </section>

      <QnaWriteModal open={writeOpen} subjects={subjects} onClose={closeWrite} onCreated={handleCreated} />
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
