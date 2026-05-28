/**
 * @file CourseCard.jsx
 * @description 검색 결과에 표시되는 강의 카드 하나를 담당합니다.
 * - courses.js의 단일 강의 객체를 data prop으로 받아 화면에 뿌립니다.
 * - 배지, 가격, 할인, 선생님 정보 표시 로직이 이 파일에 모여 있습니다.
 */
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useNavigate } from 'react-router-dom'

/**
 * 검색 결과 카드 1개.
 * data: courses.js 의 단일 객체
 */
export default function CourseCard({ data: c }) {
  const navigate = useNavigate()

  return (
    <article
      className="course-card"
      onClick={() => navigate(`/courses/${c.id}`)}
    >
      <div className={`course-thumb ${c.bg}`}>
        {/* 상태 플래그에 따라 카드 썸네일 위 배지를 조건부로 보여줍니다. */}
        {c.isLive && <span className="badge live tl">LIVE</span>}
        {c.isBest && <span className="badge butter tr">🏆 BEST</span>}
        {c.isHot && !c.isLive && <span className="badge peach tl">🔥 HOT</span>}
        {c.isNew && !c.isLive && !c.isHot && <span className="badge sky tl">🆕 신규</span>}
        {c.isFree && <span className="badge mint tr">✓ 무료체험</span>}

        <div className="display">
          {c.subject}
          <span className="hand">{c.hand}</span>
        </div>
      </div>

      <div className="course-body">
        <div className="course-meta">
          <Badge variant="peach">{c.subjectTag}</Badge>
          <Badge>{c.grade}</Badge>
          <Badge variant="mint">{c.mode}</Badge>
        </div>

        <div className="course-title">{c.title}</div>

        <div className="course-teacher">
          <Avatar size="sm" color={c.avatar}>
            {c.initial}
          </Avatar>

          <div className="course-teacher-info">
            <div className="name">{c.teacher} 선생님</div>
            <div className="school">
              {c.school} · 내공 {c.rank.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="course-stats">
          {/* 평점/리뷰수와 가격 정보를 하단에 배치합니다. */}
          <div className="rating">
            <span className="stars">★</span> {c.rating}
            <span className="count">({c.count})</span>
          </div>

          <div className="price">
            {c.discount && <span className="disc">{c.discount}%</span>}

            {c.originalPrice && (
              <>
                <span className="price-original">
                  {c.originalPrice.toLocaleString()}
                </span>
                <br />
              </>
            )}

            <span>{c.price.toLocaleString()}원</span>
          </div>
        </div>
      </div>
    </article>
  )
}