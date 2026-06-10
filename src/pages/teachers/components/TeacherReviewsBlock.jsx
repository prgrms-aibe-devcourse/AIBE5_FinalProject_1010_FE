import { useState } from 'react'

const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']
const PREVIEW      = 3

export default function TeacherReviewsBlock({ reviews = [] }) {
  const [showAll, setShowAll] = useState(false)

  const avg     = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null
  const visible = showAll ? reviews : reviews.slice(0, PREVIEW)

  return (
    <div className="td-block">
      <div className="td-block-head">
        <h2 className="td-block__title" style={{ margin: 0 }}>
          수강 후기{reviews.length > 0 && <span className="td-h2-sub"> ({reviews.length})</span>}
        </h2>
        {avg && <span className="td-review-avg">★ {avg}</span>}
      </div>
      {reviews.length === 0 ? (
        <p style={{ color: 'var(--ink-mute)', margin: 0 }}>아직 등록된 후기가 없습니다.</p>
      ) : (
        <>
          {visible.map((review, i) => (
            <div key={review.id} className="td-review">
              <div className="td-review__header">
                <div className="td-review__user">
                  <div
                    className="td-review__avatar"
                    style={{ background: AVATAR_BG[i % AVATAR_BG.length], color: AVATAR_COLOR[i % AVATAR_BG.length] }}
                  >
                    {review.author[0]}
                  </div>
                  <div>
                    <div className="td-review__name">{review.author}</div>
                    <div className="td-review__course">{review.course} · {review.date}</div>
                  </div>
                </div>
                <div className="td-review__stars">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              <p className="td-review__text">{review.content}</p>
            </div>
          ))}
          {reviews.length > PREVIEW && (
            <button className="td-review-more" onClick={() => setShowAll(prev => !prev)}>
              {showAll ? '후기 접기' : `후기 더보기 (${reviews.length - PREVIEW}개 더)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
