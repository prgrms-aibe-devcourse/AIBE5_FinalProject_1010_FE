/**
 * @file QnaBoardSection.jsx
 * @description 학생 질문게시판 미리보기 섹션입니다.
 * - questions.js 데이터를 카드로 보여줍니다.
 * - 질문에 imageType이 있으면 손그림 문제 이미지도 함께 보여줍니다.
 */
import { Link } from 'react-router-dom'
import { questions } from '../../data/questions.js'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { QuestionImage } from './QnaImages.jsx'

/**
 * 학생 질문게시판 섹션 (6개 카드 — 절반은 이미지 포함).
 */
export default function QnaBoardSection() {
  // imageType별로 이미지 우상단 라벨 문구를 다르게 보여주기 위한 매핑입니다.
  const imageLabelMap = { math: '풀이', physics: '문제', chemistry: '도식' }

  return (
    <section className="section">
      <div className="container">
        <div className="row-header">
          <div>
            <span className="eyebrow coral">💬 학생 질문게시판</span>
            <h2 className="section-title">친구들의 <span className="hand">궁금증</span>을 함께 풀어요</h2>
          </div>
          <Link to="/qna?write=1" className="btn btn-primary btn-sm qna-write-btn">새 질문 작성</Link>
        </div>

        <div className="qna-grid">
          {questions.map((q) => (
            <QnaCard key={q.id} q={q} imageLabel={imageLabelMap[q.imageType]} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/qna" className="btn btn-secondary">질문게시판 전체 보기</Link>
        </div>
      </div>
    </section>
  )
}

/**
 * 질문 카드 1개입니다.
 * 이미지가 있는 질문은 2열 카드(.with-image), 없는 질문은 일반 카드로 렌더링합니다.
 */
function QnaCard({ q, imageLabel }) {
  const cls = q.imageType ? 'qna-card with-image' : 'qna-card'

  // 이미지 유무와 관계없이 공통으로 쓰는 카드 본문입니다.
  // 아래 return에서 이미지가 있을 때는 본문 + 이미지, 없을 때는 본문만 사용합니다.
  const content = (
    <>
      <div className="qna-tags">
        {q.tags.map((t, i) => <Badge key={i} variant={t.cls}>{t.label}</Badge>)}
      </div>
      <h3 className="qna-title">{q.title}</h3>
      <p className="qna-body">{q.body}</p>
      <div className="qna-meta">
        <span className="author">
          <Avatar size="sm" color={q.author.avatar}>{q.author.initial}</Avatar>
          {q.author.name}
        </span>
        <span className="time">· {q.time}</span>
        <span className={`answers ${q.answersCls}`}>{q.answersLabel}</span>
      </div>
    </>
  )

  return (
    <article className={cls}>
      {q.imageType ? (
        <>
          <div>{content}</div>
          <QuestionImage type={q.imageType} label={imageLabel} />
        </>
      ) : content}
    </article>
  )
}
