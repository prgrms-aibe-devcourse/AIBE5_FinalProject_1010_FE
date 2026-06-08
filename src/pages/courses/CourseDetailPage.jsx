import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseDetail } from '../../api/courseApi.js'
import Badge from '../../components/ui/Badge.jsx'
import { GRADE_LABEL } from '../../utils/labels.js'

const STATUS_LABELS     = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }
const CURRICULUM_LABELS = { FIXED: '정규 커리큘럼', FLEXIBLE: '맞춤형 커리큘럼' }

const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']

const DUMMY_REVIEWS = [
  { id: 1, author: '김O준', stars: 5, text: '선생님께서 어려운 개념도 쉽게 설명해 주셔서 이해가 빨랐어요. 덕분에 성적이 많이 올랐습니다!' },
  { id: 2, author: '박O현', stars: 5, text: '수업 준비를 정말 꼼꼼하게 해오셔서 매번 알차게 배울 수 있었습니다. 강력 추천해요.' },
  { id: 3, author: '이O서', stars: 4, text: '질문에 바로바로 답해주시고 피드백이 구체적이라 실력이 많이 늘었어요.' },
]
const DUMMY_AVG_RATING  = 4.9
const DUMMY_REVIEW_COUNT = 128

function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  return dateStr.slice(0, 10).replace(/-/g, '.')
}

function StarRow({ stars }) {
  return (
    <span style={{ color: '#F59E0B', letterSpacing: 1, fontSize: 14 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  )
}

export default function CourseDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [course, setCourse]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetchCourseDetail(id)
      .then(data => { if (!cancelled) setCourse(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="cd-page">
        <div className="teacher-loading">수업 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="cd-page">
        <button className="teacher-detail__back" onClick={() => navigate(-1)}>← 돌아가기</button>
        <div className="teacher-empty">
          <div style={{ fontSize: 48 }}>😕</div>
          <p>수업 정보를 불러올 수 없어요</p>
        </div>
      </div>
    )
  }

  const {
    title, subjectName, targetGrade,
    maxStudents, currentStudents, durationMinutes, pricePerSession, status,
    description, textbook, curriculumType, curriculumDetail,
    availableSchedule, startDate, endDate, teacher,
  } = course

  const spotsLeft   = (maxStudents ?? 0) - (currentStudents ?? 0)
  const canApply    = status === 'RECRUITING' && spotsLeft > 0
  const gradeLabel  = GRADE_LABEL[targetGrade] ?? targetGrade
  const avatarIdx   = Number(teacher?.teacherProfileId ?? 0) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[avatarIdx], color: AVATAR_COLOR[avatarIdx], fontSize: 32, fontWeight: 900 }

  return (
    <div className="cd-page">
      <button className="teacher-detail__back" onClick={() => navigate(-1)}>
        ← 수업 목록으로
      </button>

      {/* ===== Hero ===== */}
      <div className="cd-hero">
        <div className="cd-hero__thumb" style={avatarStyle}>
          {subjectName?.[0] ?? '수'}
        </div>

        <div className="cd-hero__content">
          <div className="cd-hero__title">{title}</div>

          {teacher?.name && (
            <button
              className="cd-hero__teacher-link"
              onClick={() => navigate(`/teachers/${teacher.teacherProfileId}`)}
            >
              {teacher.name} 선생님 →
            </button>
          )}

          <div className="cd-hero__badges">
            {subjectName && <Badge variant="peach">{subjectName}</Badge>}
            {gradeLabel  && <Badge variant="sky">{gradeLabel}</Badge>}
            <span className={`status-badge ${status}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
        </div>
      </div>

      {/* ===== 2-col layout ===== */}
      <div className="cd-layout">

        {/* ===== MAIN ===== */}
        <div className="cd-main">

          {/* 통계 박스 */}
          <div className="cd-stats">
            <div className="cd-stat-box">
              <div className="cd-stat-val cd-stat-val--price">{formatPrice(pricePerSession)}</div>
              <div className="cd-stat-lbl">회당 금액</div>
            </div>
            <div className="cd-stat-box">
              <div className="cd-stat-val">{durationMinutes ?? '-'}분</div>
              <div className="cd-stat-lbl">수업 시간</div>
            </div>
            <div className="cd-stat-box">
              <div className="cd-stat-val" style={{ color: spotsLeft <= 0 ? 'var(--coral)' : 'inherit' }}>
                {currentStudents ?? 0} / {maxStudents ?? '-'}명
              </div>
              <div className="cd-stat-lbl">모집 현황</div>
            </div>
          </div>

          {/* 수업 소개 */}
          {description && (
            <div className="teacher-detail__section">
              <h3>📋 수업 소개</h3>
              <p>{description}</p>
            </div>
          )}

          {/* 선생님 정보 */}
          <div className="teacher-detail__section">
            <h3>👨‍🏫 선생님 정보</h3>
            {teacher ? (
              <div className="cd-teacher-card">
                <div className="cd-teacher-card__left">
                  <div
                    className="teacher-detail__avatar-wrap"
                    style={{ ...avatarStyle, width: 56, height: 56, fontSize: 22, flexShrink: 0 }}
                  >
                    {teacher.name?.[0] ?? '선'}
                  </div>
                  <div>
                    <div className="cd-teacher-name">{teacher.name} 선생님</div>
                    <div className="cd-teacher-sub">수업 담당 선생님</div>
                  </div>
                </div>
                {teacher.teacherProfileId && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/teachers/${teacher.teacherProfileId}`)}
                  >
                    프로필 자세히 →
                  </button>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--ink-mute)' }}>선생님 정보 없음</p>
            )}
          </div>

          {/* 커리큘럼 */}
          {(curriculumType || curriculumDetail) && (
            <div className="teacher-detail__section">
              <h3>📚 커리큘럼</h3>
              {curriculumType && (
                <Badge variant="butter" style={{ marginBottom: 12 }}>
                  {CURRICULUM_LABELS[curriculumType] ?? curriculumType}
                </Badge>
              )}
              {curriculumDetail && <p style={{ marginTop: 12 }}>{curriculumDetail}</p>}
            </div>
          )}

          {/* 수업 일정 */}
          {availableSchedule && (
            <div className="teacher-detail__section">
              <h3>🗓 수업 일정</h3>
              <p>{availableSchedule}</p>
            </div>
          )}

          {/* 교재 */}
          {textbook && (
            <div className="teacher-detail__section">
              <h3>📖 사용 교재</h3>
              <p>{textbook}</p>
            </div>
          )}

          {/* 수업 기간 */}
          <div className="teacher-detail__section">
            <h3>📅 수업 기간</h3>
            <p>{formatDate(startDate)} ~ {formatDate(endDate)}</p>
          </div>

          {/* 수강 후기 */}
          <div className="teacher-detail__section">
            <div className="cd-review-header">
              <h3>⭐ 수강 후기</h3>
              <div className="cd-review-avg">
                <span className="cd-review-avg__score">{DUMMY_AVG_RATING}</span>
                <span className="cd-review-avg__count">/ 5 &nbsp;·&nbsp; {DUMMY_REVIEW_COUNT}개</span>
              </div>
            </div>
            <div className="cd-reviews">
              {DUMMY_REVIEWS.map(r => (
                <div key={r.id} className="cd-review-card">
                  <div className="cd-review-card__top">
                    <span className="cd-review-card__author">{r.author}</span>
                    <StarRow stars={r.stars} />
                  </div>
                  <p className="cd-review-card__text">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== SIDEBAR ===== */}
        <div className="cd-sidebar">
          <div className="cd-enroll-card">

            {/* 상태 뱃지 */}
            <div style={{ marginBottom: 10 }}>
              <span className={`status-badge ${status}`}>{STATUS_LABELS[status] ?? status}</span>
            </div>

            {/* 가격 */}
            <div className="cd-enroll-price">{formatPrice(pricePerSession)}</div>
            <div className="cd-enroll-price-sub">1회 수업 · {durationMinutes ?? '-'}분</div>

            {/* 모집 현황 */}
            <div className="cd-enroll-spots">
              <span>모집 현황</span>
              <span style={{ color: spotsLeft <= 0 ? 'var(--coral)' : 'var(--teal-dark)', fontWeight: 900 }}>
                {currentStudents ?? 0} / {maxStudents ?? '-'}명
              </span>
            </div>

            {/* 신청 버튼 */}
            <button
              className="btn btn-primary btn-full btn-lg"
              disabled={!canApply}
              title={status === 'IN_PROGRESS' ? '이미 진행 중인 수업입니다' : undefined}
            >
              {canApply ? '수업 신청하기' : '모집 마감'}
            </button>

            {/* 수업 상세 정보 */}
            <div className="cd-enroll-info">
              <div className="cd-enroll-info__row">
                <span>수업 시작</span>
                <span>{formatDate(startDate)}</span>
              </div>
              <div className="cd-enroll-info__row">
                <span>수업 종료</span>
                <span>{formatDate(endDate)}</span>
              </div>
              {maxStudents && (
                <div className="cd-enroll-info__row">
                  <span>최대 정원</span>
                  <span>{maxStudents}명</span>
                </div>
              )}
              {durationMinutes && (
                <div className="cd-enroll-info__row">
                  <span>회당 시간</span>
                  <span>{durationMinutes}분</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
