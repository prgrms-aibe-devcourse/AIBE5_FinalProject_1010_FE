/**
 * @file TeacherDetailPage.jsx
 * @description 선생님 상세 페이지입니다.
 * - GET /api/v1/teachers/:id 로 프로필 + 강의 목록을 불러옵니다.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../../api/config.js'
import Badge from '../../components/ui/Badge.jsx'
import { getNaegongTier } from '../../utils/naegong.js'
import { GRADE_LABEL } from '../../utils/labels.js'

const AVATAR_BG = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)', 'var(--ink)', 'var(--ink)', 'var(--ink)', 'var(--ink)', 'white']
const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }
const DEFAULT_INTRO = '안녕하세요.\n학생이 스스로 문제를 해결할 수 있도록 돕는 수업을 지향합니다.\n개념 이해부터 내신, 수능 대비까지 학생 수준에 맞춰 맞춤형 수업을 진행합니다.'

// TODO: Review API 연결 후 실제 데이터로 교체 예정
const DUMMY_REVIEWS = [
  { id: 1, author: '서*윤', rating: 5, course: '미적분 II', date: '2026.05', content: '설명이 정말 쉬워요. 직접 문제를 풀게 하셔서 실력이 많이 늘었습니다.' },
  { id: 2, author: '김*은', rating: 5, course: '기하', date: '2026.04', content: '아이가 수학을 좋아하게 됐어요. 피드백도 꼼꼼하게 주십니다.' },
  { id: 3, author: '정*우', rating: 4, course: '확률과 통계', date: '2026.03', content: '원리부터 설명해주셔서 응용문제를 푸는 힘이 생겼습니다.' },
  { id: 4, author: '박*현', rating: 5, course: '수학 I', date: '2026.02', content: '개념부터 탄탄하게 짚어주셔서 수능 대비에 많은 도움이 됐습니다.' },
]
const REVIEWS_PREVIEW = 3

function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}

export default function TeacherDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isScrapped, setIsScrapped] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetch(`${API_BASE}/api/v1/teachers/${id}`)
      .then((res) => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then((data) => { if (!cancelled) setTeacher(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="td-page">
        <div className="teacher-loading">선생님 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className="td-page">
        <button className="teacher-detail__back" onClick={() => navigate(-1)}>← 돌아가기</button>
        <div className="teacher-empty">
          <div style={{ fontSize: 48 }}>😕</div>
          <p>선생님 정보를 불러올 수 없어요</p>
        </div>
      </div>
    )
  }

  const {
    name, profileImageUrl, education, career,
    awards, address, teachingStyle, introduction,
    naegongScore, courses = [],
  } = teacher

  const tier = getNaegongTier(naegongScore)
  const idx = Number(id) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[idx], color: AVATAR_COLOR[idx] }
  const isTop = teacher?.isTop === true

  const heroEduLine = [career && career.split(/[·,\n]/)[0]?.trim(), address]
    .filter(Boolean).join(' · ')

  // TODO: 채팅 API 연동 시 채팅방 생성 후 이동
  function handleInquiry() {
    alert('채팅 기능은 준비 중입니다.')
    // TODO:
    // 채팅 API 연동
    // 채팅방 생성
    // 채팅방 이동
  }

  const reviews = teacher.reviews?.length ? teacher.reviews : DUMMY_REVIEWS
  const reviewAvg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, REVIEWS_PREVIEW)

  return (
    <div className="td-page">
      {/* 브레드크럼 */}
      <nav className="td-crumb">
        <button onClick={() => navigate('/teachers')}>선생님 찾기</button>
        <span>›</span>
        <span>{name} 선생님</span>
      </nav>

      {/* ===== HERO ===== */}
      <div className="td-hero">
        <div className="td-hero__avatar" style={profileImageUrl ? {} : avatarStyle}>
          {profileImageUrl ? <img src={profileImageUrl} alt={name} /> : (name?.[0] ?? '선')}
        </div>

        <div className="td-hero__body">
          <div className="td-hero__top">
            <span className="td-hero__name">{name} 선생님</span>
            <span className="td-badge td-badge--cert">✓ 인증 완료</span>
            {isTop && <span className="td-badge td-badge--top">🥇 이번 주 TOP</span>}
          </div>
          <div className="td-hero__specialty">
            {teacher.subject ?? '수학 · 미적분 · 기하'}
          </div>
          {education && <div className="td-hero__subject">{education}</div>}
          {heroEduLine && <div className="td-hero__edu">{heroEduLine}</div>}

          <div className="td-stats">
            <div className="td-stat">
              <b style={{ color: 'var(--coral)' }}>0.0</b>
              <div className="td-stat__lbl">평점</div>
            </div>
            <div className="td-stat">
              <b>0</b>
              <div className="td-stat__lbl">누적 수강생</div>
            </div>
            <div className="td-stat">
              <b style={{ color: 'var(--teal-dark)' }}>{naegongScore ?? 0}</b>
              <div className="td-stat__lbl">내공 점수</div>
            </div>
            <div className="td-stat">
              <b>{courses.length}</b>
              <div className="td-stat__lbl">강의수</div>
            </div>
          </div>
        </div>

        <div className="td-hero__actions">
          <button className="td-hero__btn td-hero__btn--primary" onClick={handleInquiry}>💬 문의하기</button>
          {/* TODO: 스크랩 API 연결 예정 — POST /api/v1/teachers/:id/scrap */}
          <button
            className={`td-hero__btn${isScrapped ? ' td-hero__btn--scrapped' : ''}`}
            onClick={() => setIsScrapped(prev => !prev)}
          >
            {isScrapped ? '♥ 스크랩됨' : '♡ 스크랩'}
          </button>
        </div>
      </div>

      {/* ===== BODY: 2-column ===== */}
      <div className="td-detail">
        <div>

          {/* 자기소개 */}
          <div className="td-block">
            <h2>📝 자기소개</h2>
            <p className="td-intro">{introduction || DEFAULT_INTRO}</p>
            <dl className="td-kv">
              <dt>학력</dt><dd>{education || '학력 정보 준비 중'}</dd>
              <dt>경력</dt><dd>{career || '경력 정보 준비 중'}</dd>
              <dt>수업방식</dt><dd>{teachingStyle || '학생 수준에 맞춘 맞춤형 수업'}</dd>
              {awards && <><dt>수상</dt><dd>{awards}</dd></>}
            </dl>
          </div>

          {/* 운영 중인 수업 */}
          <div className="td-block">
            <div className="td-block-head">
              <h2>📚 운영 중인 수업</h2>
              <button className="td-block-link" onClick={() => navigate('/courses')}>전체 보기 →</button>
            </div>
            {courses.length === 0 ? (
              <p style={{ color: 'var(--ink-mute)', margin: 0 }}>현재 모집 중인 강의가 없어요</p>
            ) : (
              <div className="teacher-detail__courses-grid">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="teacher-course-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="teacher-course-card__title">{course.title}</div>
                    <div className="teacher-course-card__meta">
                      {course.subjectName && <Badge variant="sky">{course.subjectName}</Badge>}
                      {course.targetGrade && (
                        <Badge variant="butter">
                          {GRADE_LABEL[course.targetGrade] ?? course.targetGrade}
                        </Badge>
                      )}
                      <span className={`status-badge ${course.status}`}>
                        {STATUS_LABELS[course.status] ?? course.status}
                      </span>
                    </div>
                    <div className="teacher-course-card__price">
                      {formatPrice(course.pricePerSession)}
                      <span> / 1회 · {course.durationMinutes}분 · 최대 {course.maxStudents}명</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 후기 – TODO: Review API 연결 후 teacher.reviews 실제 데이터로 교체 예정 */}
          <div className="td-block">
            <div className="td-block-head">
              <h2>⭐ 선생님 후기 <span className="td-h2-sub">({reviews.length})</span></h2>
              <span className="td-review-avg">★ {reviewAvg}</span>
            </div>
            {visibleReviews.map((review, i) => (
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
            {reviews.length > REVIEWS_PREVIEW && (
              <button
                className="td-review-more"
                onClick={() => setShowAllReviews(prev => !prev)}
              >
                {showAllReviews ? '후기 접기 ▲' : `후기 더보기 (${reviews.length - REVIEWS_PREVIEW}개 더) ▼`}
              </button>
            )}
          </div>

        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className="td-side">
          <div className="td-ng-card">
            <div className="td-ng-card__head">
              <span>🏆</span>
              <b>내공 점수</b>
            </div>
            <div className={`td-ng-card__score ${tier.cls}`}>{naegongScore}</div>
            <p className="td-ng-card__desc">
              질문게시판 답변 채택과 누적 수업 시간으로 쌓인 신뢰 점수예요.
            </p>
            <div className="td-ng-row">
              <span>등급</span>
              <span className="td-ng-pt">{tier.label}</span>
            </div>
            <div className="td-ng-row">
              <span>강의 수</span>
              <span className="td-ng-pt">{courses.length}개</span>
            </div>
            {address && (
              <div className="td-ng-row">
                <span>지역</span>
                <span className="td-ng-pt">{address}</span>
              </div>
            )}
          </div>

          {/* TODO: 질문게시판 API 연결 후 teacher 객체의 실제 필드로 교체 예정 */}
          <div className="td-activity">
            <h2>💬 질문게시판 활동</h2>
            <div className="td-activity-row">
              <span>작성 답변</span>
              <b>{teacher.answerCount != null ? `${teacher.answerCount}개` : '준비 중'}</b>
            </div>
            <div className="td-activity-row">
              <span>채택률</span>
              <b style={{ color: 'var(--teal-dark)' }}>
                {teacher.acceptRate != null ? `${teacher.acceptRate}%` : '준비 중'}
              </b>
            </div>
            <div className="td-activity-row">
              <span>전문 과목</span>
              <b>{teacher.specialty || '준비 중'}</b>
            </div>
            <div className="td-activity-row">
              <span>최근 답변</span>
              <b style={{ color: 'var(--ink-mute)' }}>{teacher.recentAnswer ?? '준비 중'}</b>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
