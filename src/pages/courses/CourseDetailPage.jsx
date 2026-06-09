/**
 * @file CourseDetailPage.jsx
 * @description 수업 상세 페이지입니다.
 * - GET /api/v1/courses/:id 로 수업 정보를 불러옵니다.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseDetail } from '../../api/courseApi.js'
import { GRADE_LABEL } from '../../utils/labels.js'

const STATUS_LABELS     = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }
const CURRICULUM_LABELS = { FIXED: '정규 커리큘럼', FLEXIBLE: '맞춤형 커리큘럼' }
const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']

// TODO: Review API 연결 후 실제 데이터로 교체 예정
const DUMMY_REVIEWS = [
  { id: 1, author: '서*윤', grade: '고2',    date: '2026.05', rating: 5, content: '화이트보드로 직접 풀고 바로 첨삭받으니 어디서 틀리는지 정확히 알게 됐어요. 3등급에서 1등급 됐습니다!' },
  { id: 2, author: '정*우', grade: '고2',    date: '2026.04', rating: 5, content: '킬러문항을 통째로 외우는 게 아니라 원리부터 잡아주셔서 처음 보는 문제도 풀 수 있게 됐어요.' },
  { id: 3, author: '김*은', grade: '학부모', date: '2026.03', rating: 4, content: '아이가 수업 시간을 기다려요. 양방향이라 집중도가 확실히 다르네요.' },
  { id: 4, author: '이*준', grade: '고1',    date: '2026.02', rating: 5, content: '개념을 단순 암기가 아니라 왜 그런지부터 설명해주세요. 처음 보는 유형도 스스로 풀리기 시작했어요.' },
]
const EMPTY_FORM = { intro: '', goal: '', schedule: '', startWish: '', message: '' }
const STEPS      = ['채팅 협의', '신청하기', '선생님 수락', '수업 확정', '결제']

function formatPrice(price) { return price != null ? price.toLocaleString('ko-KR') + '원' : '-' }
function formatDate(dateStr) { if (!dateStr) return '미정'; return dateStr.slice(0, 10).replace(/-/g, '.') }

export default function CourseDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [course, setCourse]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [showForm, setShowForm]             = useState(false)
  const [formData, setFormData]             = useState(EMPTY_FORM)
  const [showAllReviews, setShowAllReviews] = useState(false)
  // TODO: submitError — 수업 신청 API 연동 후 재활성화 예정

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
  const gradeLabel  = GRADE_LABEL[targetGrade] ?? targetGrade
  const avatarIdx   = Number(teacher?.teacherProfileId ?? 0) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[avatarIdx], color: AVATAR_COLOR[avatarIdx], fontSize: 26, fontWeight: 900 }
  const canApply    = status === 'RECRUITING' && spotsLeft > 0

  // TODO: Review API 연결 후 course.reviews 실제 데이터로 교체 예정
  const reviews        = course.reviews?.length ? course.reviews : DUMMY_REVIEWS
  const avgRating      = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  const REVIEWS_PREVIEW = 3
  const visibleReviews  = showAllReviews ? reviews : reviews.slice(0, REVIEWS_PREVIEW)

  function handleFormChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // TODO: 채팅 API 연동 시 채팅방 생성 후 이동
  function handleChatInquiry() {
    alert('채팅 기능은 준비 중입니다.')
    // TODO:
    // 채팅 API 연동
    // 채팅방 생성
    // 채팅방 이동
  }

  // TODO: 수업 신청 API 연동 예정 (POST /api/v1/courses/:id/enroll)
  function handleSubmit(e) {
    e.preventDefault()
    alert('수업 신청 기능은 준비 중입니다.')
    // TODO: API 연동 후 아래 로직 활성화
    // setSubmitError(null)
    // await createEnrollmentRequest(id, formData)
    // setShowForm(false)
    // setFormData(EMPTY_FORM)
  }

  return (
    <div className="cd-page">
      {/* 브레드크럼 */}
      <nav className="cd-crumb">
        <button onClick={() => navigate('/courses')}>수업 찾기</button>
        <span>›</span>
        {subjectName && <><button onClick={() => navigate(`/courses?subject=${subjectName}`)}>{subjectName}</button><span>›</span></>}
        <span>{title}</span>
      </nav>

      <div className="cd-layout">

        {/* ===== MAIN ===== */}
        <div>

          {/* Hero */}
          <div className="cd-hero">
            <div className="cd-hero__top">
              <div className="cd-hero__deco">⚡</div>
              <div className="cd-badges">
                {status === 'RECRUITING' && <span className="cd-badge cd-badge--live">● LIVE</span>}
                <span className="cd-badge cd-badge--best">🏅 BEST</span>
                <span className="cd-badge cd-badge--status">
                  {STATUS_LABELS[status] ?? status} · {currentStudents ?? 0}/{maxStudents ?? '-'}
                </span>
              </div>
              <h1 className="cd-title">{title}</h1>
              <div className="cd-chips">
                {subjectName  && <span className="cd-chip cd-chip--subject">{subjectName}</span>}
                {gradeLabel   && <span className="cd-chip cd-chip--grade">{gradeLabel}</span>}
                <span className="cd-chip">비대면</span>
                {durationMinutes && <span className="cd-chip">회당 {durationMinutes}분</span>}
              </div>
            </div>
          </div>

          {/* 선생님 정보 */}
          <div className="cd-block">
            <h2>👨‍🏫 선생님 정보</h2>
            <div className="cd-teacher-row">
              <div className="cd-teacher-left">
                <div className="cd-teacher-avatar" style={avatarStyle}>
                  {teacher?.name?.[0] ?? '선'}
                </div>
                <div className="cd-teacher-info">
                  <div className="cd-teacher-name">
                    {teacher?.name ?? '선생님'} 선생님
                    <span className="cd-badge cd-badge--cert">✓ 인증</span>
                  </div>
                  <div className="cd-teacher-intro">
                    {teacher?.education
                      ? teacher.education + (teacher.career ? ` · ${teacher.career.split('\n')[0]}` : '')
                      : '검증된 선생님 · 1:1 맞춤 수업'}
                  </div>
                  <div className="cd-teacher-stats">
                    <span><b style={{ color: 'var(--coral)' }}>★ 0.0</b> <em>평점</em></span>
                    <span className="cd-stats-div">|</span>
                    <span><b>0명</b> <em>수강생</em></span>
                    <span className="cd-stats-div">|</span>
                    <span><b style={{ color: 'var(--teal-dark)' }}>
                      내공 {teacher?.naegongScore != null ? teacher.naegongScore.toLocaleString('ko-KR') : 0}
                    </b></span>
                  </div>
                </div>
              </div>
              {teacher?.teacherProfileId && (
                <button
                  className="cd-link-btn"
                  onClick={() => navigate(`/teachers/${teacher.teacherProfileId}`)}
                >
                  선생님 프로필 자세히 →
                </button>
              )}
            </div>
          </div>

          {/* 수업 정보 */}
          {(description || textbook || curriculumType || curriculumDetail) && (
            <div className="cd-block">
              <h2>📘 수업 정보</h2>
              <dl className="cd-kv">
                {description      && <><dt>수업 소개</dt>  <dd>{description}</dd></>}
                {curriculumType   && <><dt>커리큘럼</dt>   <dd>{CURRICULUM_LABELS[curriculumType] ?? curriculumType}</dd></>}
                {curriculumDetail && <><dt>상세 내용</dt>  <dd>{curriculumDetail}</dd></>}
                {textbook         && <><dt>사용 교재</dt>  <dd>{textbook}</dd></>}
              </dl>
            </div>
          )}

          {/* 일정 정보 */}
          <div className="cd-block">
            <h2>🗓️ 일정 정보</h2>
            <dl className="cd-kv">
              {availableSchedule && <><dt>가능 시간대</dt> <dd>{availableSchedule}</dd></>}
              <dt>수업 기간</dt>  <dd>{formatDate(startDate)} ~ {formatDate(endDate)}</dd>
              {durationMinutes   && <><dt>회당 시간</dt>   <dd>{durationMinutes}분</dd></>}
              <dt>구체 일정</dt>  <dd>1:1 수업은 매칭 후 선생님과 채팅으로 협의합니다.</dd>
            </dl>
          </div>

          {/* 가격·결제 안내 */}
          <div className="cd-block">
            <h2>💳 가격 · 결제 안내</h2>
            <p className="cd-price-desc">
              회당 <b style={{ color: 'var(--ink)' }}>{formatPrice(pricePerSession)}</b> · 매칭 확정 후 결제가 진행됩니다.
            </p>
            <div className="cd-flow">
              {STEPS.reduce((acc, step, i) => {
                acc.push(<span key={step} className="cd-flow__step"><b>{i + 1}</b> {step}</span>)
                if (i < STEPS.length - 1) acc.push(<span key={`a${i}`} className="cd-flow__arr">→</span>)
                return acc
              }, [])}
            </div>
            <p className="cd-price-tip">💡 채팅 협의 시 선생님과의 채팅창으로 신청 링크가 미리 발송됩니다.</p>
          </div>

          {/* 수강 후기 */}
          <div className="cd-block">
            <h2>⭐ 수강 후기 <span className="cd-h2-sub">({reviews.length})</span></h2>
            <div className="cd-rev-summary">
              <div className="cd-rev-summary__big">
                <div className="cd-rev-big">{avgRating}</div>
                <div className="cd-rev-stars">{'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}</div>
                <div className="cd-rev-count">{reviews.length}개 후기</div>
              </div>
              <div className="cd-rev-bars">
                {[5, 4, 3, 2, 1].map(n => {
                  const pct = Math.round((reviews.filter(r => r.rating === n).length / reviews.length) * 100)
                  return (
                    <div key={n} className="cd-rev-bar">
                      <span>{n}점</span>
                      <div className="cd-rev-bar__track"><div className="cd-rev-bar__fill" style={{ width: `${pct}%` }} /></div>
                      <span className="cd-rev-bar__pct">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {visibleReviews.map((review) => (
              <div key={review.id} className="cd-review">
                <div className="cd-review__header">
                  <div className="cd-review__user">
                    <div className="cd-review__avatar">{review.author[0]}</div>
                    <b className="cd-review__name">{review.author}</b>
                    <span className="cd-review__meta">{review.grade} · {review.date}</span>
                  </div>
                  <span className="cd-review__stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p className="cd-review__text">{review.content}</p>
              </div>
            ))}
            {reviews.length > REVIEWS_PREVIEW && (
              <button className="cd-more-btn" onClick={() => setShowAllReviews(prev => !prev)}>
                {showAllReviews ? '후기 접기' : `후기 더보기 (${reviews.length - REVIEWS_PREVIEW}개 더)`}
              </button>
            )}
          </div>

        </div>

        {/* ===== STICKY CTA ===== */}
        <aside className="cd-cta">
          <div className="cd-price-card">
            <div className="cd-price-card__head">
              <span className={`cd-badge ${status === 'RECRUITING' ? 'cd-badge--status-ok' : 'cd-badge--status-closed'}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
              <span className="cd-price-card__spots">정원 {currentStudents ?? 0}/{maxStudents ?? '-'}</span>
            </div>
            <div className="cd-price-card__sub">회당 ({durationMinutes}분)</div>
            <div className="cd-price-card__price">{formatPrice(pricePerSession)}</div>
            <div className="cd-price-card__tip">첫 수업 30% 할인 쿠폰 적용 가능</div>
            <div className="cd-price-card__btns">
              <button
                className="cd-btn-apply"
                disabled={!canApply}
                onClick={() => canApply && setShowForm(true)}
              >
                {canApply ? '신청하기' : '모집 마감'}
              </button>
              <button className="cd-btn-chat" onClick={handleChatInquiry}>💬 채팅으로 문의하기</button>
            </div>
            <p className="cd-price-card__notice">매칭 확정 후 결제가 진행돼요</p>
          </div>

          <div className="cd-quick">
            <div className="cd-quick__row"><span>수업 형태</span><span>비대면</span></div>
            <div className="cd-quick__row"><span>회당 시간</span><span>{durationMinutes ?? '-'}분</span></div>
            {availableSchedule && (
              <div className="cd-quick__row">
                <span>가능 시간</span>
                <span>{availableSchedule.split(/[/\n]/)[0]?.trim()}</span>
              </div>
            )}
            <div className="cd-quick__row"><span>수업 기간</span><span>{formatDate(startDate)} ~</span></div>
            <div className="cd-quick__row">
              <span>정원</span>
              <span style={{ color: spotsLeft > 0 ? 'var(--teal-dark)' : 'var(--coral)', fontWeight: 800 }}>
                {spotsLeft > 0 ? `${spotsLeft}자리 남음` : '마감'}
              </span>
            </div>
          </div>
        </aside>

      </div>

      {/* ===== 신청 모달 ===== */}
      {showForm && (
        <div className="cd-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal__head">
              <h3>수업 신청하기 ✏️</h3>
              <button className="cd-modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className="cd-modal__body" onSubmit={handleSubmit}>
              <p className="cd-modal__desc">
                {teacher?.name ?? '선생님'}께 신청을 보냅니다. 선생님이 확인 후 수락/거절합니다.
              </p>
              <div className="cd-field">
                <label>자기소개 (학년·학교·현재 수준)</label>
                <textarea className="cd-textarea" name="intro" value={formData.intro} onChange={handleFormChange} placeholder="예) 한빛고 2학년, 모의고사 수학 3등급입니다." required />
              </div>
              <div className="cd-field">
                <label>학습 목표</label>
                <input className="cd-input" name="goal" value={formData.goal} onChange={handleFormChange} placeholder="예) 수능 수학 1등급 목표" required />
              </div>
              <div className="cd-field-row">
                <div className="cd-field">
                  <label>희망 일정</label>
                  <input className="cd-input" name="schedule" value={formData.schedule} onChange={handleFormChange} placeholder="평일 저녁 7시~" />
                </div>
                <div className="cd-field">
                  <label>첫 수업 희망 시기</label>
                  <input className="cd-input" name="startWish" value={formData.startWish} onChange={handleFormChange} placeholder="다음 주부터" />
                </div>
              </div>
              <div className="cd-field">
                <label>선생님께 한마디</label>
                <textarea className="cd-textarea" name="message" value={formData.message} onChange={handleFormChange} placeholder="자유롭게 메시지를 남겨주세요" />
              </div>
              {/* TODO: 신청 API 연동 후 submitError 표시 추가 */}
              <div className="cd-modal__foot">
                <button type="button" className="cd-btn-ghost" onClick={() => setShowForm(false)}>취소</button>
                <button type="submit" className="cd-btn-apply cd-btn-apply--modal">신청 보내기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
