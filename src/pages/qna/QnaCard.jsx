/**
 * @file QnaCard.jsx
 * @description 질문게시판 카드 항목입니다.
 */
import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { QuestionImage } from '../home/QnaImages.jsx'

const imageLabelMap = { math: '풀이', physics: '문제', chemistry: '도식' }

export default function QnaCard({ post, index = 0 }) {
  const statusLabel = post.status === 'resolved' ? '해결됨' : '답변 대기'
  const statusClass = post.status === 'resolved' ? 'is-resolved' : 'is-waiting'
  const cardClass = post.imageType ? 'qna-list-card has-thumb' : 'qna-list-card'

  return (
    <Link to={`/qna/${post.id}`} className={cardClass} style={{ '--card-delay': `${Math.min(index, 10) * 42}ms` }}>
      <div className="qna-list-card__top">
        <div className="qna-list-card__tags">
          {post.tags.map((tag, index) => (
            <Badge key={`${post.id}-${tag.label}-${index}`} variant={tag.cls}>
              {tag.label}
            </Badge>
          ))}
        </div>
        <span className={`qna-list-card__status ${statusClass}`}>{statusLabel}</span>
      </div>

      <h2 className="qna-list-card__title">{post.title}</h2>
      <p className="qna-list-card__body">{post.body}</p>

      {post.imageType && (
        <div className="qna-list-card__thumb" aria-label="첨부 이미지 미리보기">
          <QuestionImage type={post.imageType} label={imageLabelMap[post.imageType] || '첨부'} />
        </div>
      )}

      <div className="qna-list-card__footer">
        <div className="qna-list-card__author">
          <Avatar size="sm" color={post.author.avatar}>{post.author.initial}</Avatar>
          <div>
            <strong>{post.author.name}</strong>
            <span>{post.time}</span>
          </div>
        </div>

        <div className="qna-list-card__metrics" aria-label="질문 활동 정보">
          <span>{post.answersLabel}</span>
          <span>조회 {post.views}</span>
          {post.bookmarked && <span>저장됨</span>}
        </div>
      </div>
    </Link>
  )
}
