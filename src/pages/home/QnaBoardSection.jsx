/**
 * @file QnaBoardSection.jsx
 * @description 메인페이지의 학생 질문게시판 미리보기 섹션입니다.
 * - 백엔드 QnA 목록 API로 최신 질문 6개를 불러와 카드로 보여줍니다.
 * - 카드/‘전체 보기’는 질문게시판으로, ‘새 질문 작성’은 작성 페이지로 이동합니다.
 * - 질문에 첨부 이미지가 있으면 첫 번째 이미지를 카드에 함께 보여줍니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchQuestions, mapSummaryToPost } from '../../api/qnaApi.js'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function QnaBoardSection() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchQuestions({ size: 6 })
      .then((page) => {
        if (active) setPosts((page.content || []).map(mapSummaryToPost))
      })
      .catch(() => {
        if (active) setPosts([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="section">
      <div className="container">
        <div className="row-header">
          <div>
            <span className="eyebrow coral">💬 학생 질문게시판</span>
            <h2 className="section-title">친구들의 <span className="hand">궁금증</span>을 함께 풀어요</h2>
          </div>
          <Link to="/qna/write" className="btn btn-primary btn-sm qna-write-btn">새 질문 작성</Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', padding: '24px 0' }}>질문을 불러오는 중…</p>
        ) : posts.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', padding: '24px 0' }}>
            아직 등록된 질문이 없어요. 첫 질문을 남겨보세요!
          </p>
        ) : (
          <div className="qna-grid">
            {posts.map((post) => (
              <QnaCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/qna" className="btn btn-secondary">질문게시판 전체 보기</Link>
        </div>
      </div>
    </section>
  )
}

/**
 * 질문 카드 1개 (메인 미리보기용). 클릭하면 상세로 이동한다.
 * 첨부 이미지가 있으면 2열(.with-image) 레이아웃으로 첫 이미지를 함께 보여준다.
 */
function QnaCard({ post }) {
  const cls = post.imageUrl ? 'qna-card with-image' : 'qna-card'

  const content = (
    <div>
      <div className="qna-tags">
        {post.tags.map((t, i) => (
          <Badge key={i} variant={t.cls}>{t.label}</Badge>
        ))}
      </div>
      <h3 className="qna-title">{post.title}</h3>
      <div className="qna-meta">
        <span className="author">
          <Avatar size="sm" color={post.author.avatar}>{post.author.initial}</Avatar>
          {post.author.name}
        </span>
        <span className="time">· {post.time}</span>
        <span className={`answers ${post.answersCls}`}>{post.answersLabel}</span>
      </div>
    </div>
  )

  return (
    <Link to={`/qna/${post.id}`} className={cls}>
      {content}
      {post.imageUrl && (
        <div className="qna-image">
          <img src={post.imageUrl} alt="질문 첨부 이미지" loading="lazy" />
        </div>
      )}
    </Link>
  )
}
