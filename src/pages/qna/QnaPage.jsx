/**
 * @file QnaPage.jsx
 * @description 질문게시판 전체 목록 페이지입니다.
 */
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { qnaPosts } from '../../data/qnaPosts.js'
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
  const [posts, setPosts] = useState(qnaPosts)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const writeOpen = searchParams.get('write') === '1'

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

  const handleSubmit = (form) => {
    const newPost = {
      id: `local-${Date.now()}`,
      tags: [
        { label: form.subject, cls: 'peach' },
        { label: '새 질문', cls: 'sky' },
      ],
      title: form.title.trim(),
      body: form.body.trim(),
      author: { name: '나', avatar: 'c2', initial: '나' },
      time: '방금 전',
      answers: 0,
      answersCls: '',
      answersLabel: '답변 0',
      imageType: null,
      views: 0,
      status: 'waiting',
      subject: form.subject,
      bookmarked: false,
    }
    setPosts((prev) => [newPost, ...prev])
    closeWrite()
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
          onFilterChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          onOpenWrite={openWrite}
        />

        {filteredPosts.length > 0 ? (
          <div className="qna-list-grid" aria-label="질문 목록">
            {filteredPosts.map((post, index) => <QnaCard key={post.id} post={post} index={index} />)}
          </div>
        ) : (
          <div className="qna-empty">
            <h2>검색 결과가 없습니다</h2>
            <p>검색어를 줄이거나 필터를 초기화해보세요.</p>
            <button className="btn btn-secondary" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>필터 초기화</button>
          </div>
        )}
      </section>

      <QnaWriteModal open={writeOpen} onClose={closeWrite} onSubmit={handleSubmit} />
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
