import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseDetail, createEnrollmentRequest } from '../../api/courseApi.js'
import Badge from '../../components/ui/Badge.jsx'
import { GRADE_LABEL } from '../../utils/labels.js'

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }

/* ── 수강 후기 더미 데이터 (추후 Review API로 교체) ── */
const DUMMY_REVIEWS = [
  { id: 1, author: '김O준', stars: 5, text: '설명이 정말 이해하기 쉬웠어요. 어려운 개념도 쉽게 풀어주셔서 좋았습니다.' },
  { id: 2, author: '박O현', stars: 5, text: '내신 성적이 많이 올랐습니다. 꼼꼼한 피드백 덕분에 자신감이 생겼어요.' },
  { id: 3, author: '이O서', stars: 4, text: '질문을 친절하게 받아주셨어요. 다음 학기에도 계속 듣고 싶습니다.' },
]
const DUMMY_AVG_RATING = 4.9
const DUMMY_REVIEW_COUNT = 128
const CURRICULUM_LABELS = { FIXED: '정규 커리큘럼', FLEXIBLE: '맞춤형 커리큘럼' }

const AVATAR_BG = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)', 'var(--ink)', 'var(--ink)', 'var(--ink)', 'var(--ink)', 'white']

function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  return dateStr.slice(0, 10).replace(/-/g, '.')
}

const statBox = { background: 'var(--cream)', border: 'var(--border-line)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }
const statVal = { fontSize: 18, fontWeight: 900, marginBottom: 4 }
const statLbl = { fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    introduction: '', goal: '', preferredScheduleNote: '', preferredStart: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
      <div className="teacher-detail">
        <div className="teacher-loading">수업 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="teacher-detail">
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

  const spotsLeft = (maxStudents ?? 0) - (currentStudents ?? 0)
  const gradeLabel = GRADE_LABEL[targetGrade] ?? targetGrade
  const avatarIdx = Number(teacher?.teacherProfileId ?? 0) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[avatarIdx], color: AVATAR_COLOR[avatarIdx], fontSize: 28, fontWeight: 900 }
  const canApply = status === 'RECRUITING' && spotsLeft > 0

  const applyButtonTitle = (() => {
    if (status === 'IN_PROGRESS') return '이미 진행 중인 수업입니다'
    if (status === 'CLOSED') return '종료된 수업입니다'
    if (spotsLeft <= 0) return '모집 인원이 마감되었습니다'
    return undefined
  })()

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      await createEnrollmentRequest(id, formData)
      alert('수강 신청이 완료되었습니다.')
      setShowForm(false)
      setFormData({ introduction: '', goal: '', preferredScheduleNote: '', preferredStart: '', message: '' })
    } catch (err) {
      if (err.status === 401) {
        setSubmitError('로그인이 필요한 기능입니다. 로그인 후 다시 시도해주세요.')
      } else if (err.status === 403) {
        setSubmitError('학생 계정으로만 수강 신청할 수 있습니다.')
      } else {
        setSubmitError(err.message || '신청 중 오류가 발생했습니다.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="teacher-detail">
      <button className="teacher-detail__back" onClick={() => navigate(-1)}>
        ← 수업 목록으로
      </button>

      <div className="teacher-detail__hero">
        <div className="teacher-detail__avatar-wrap" style={avatarStyle}>
          {subjectName?.[0] ?? '수'}
        </div>

        <div className="teacher-detail__info">
          <div className="teacher-detail__name">{title}</div>

          {teacher?.name && (
            <div className="teacher-detail__education">
              <button
                onClick={() => navigate(`/teachers/${teacher.teacherProfileId}`)}
                style={{ color: 'var(--teal-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              >
                {teacher.name} 선생님 →
              </button>
            </div>
          )}

          <div className="teacher-detail__badges">
            {subjectName && <Badge variant="peach">{subjectName}</Badge>}
            {gradeLabel && <Badge variant="sky">{gradeLabel}</Badge>}
            {status && (
              <span className={`status-badge ${status}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
            <div style={statBox}>
              <div style={{ ...statVal, color: 'var(--teal-dark)' }}>{formatPrice(pricePerSession)}</div>
              <div style={statLbl}>회당 금액</div>
            </div>
            <div style={statBox}>
              <div style={statVal}>{durationMinutes ?? '-'}분</div>
              <div style={statLbl}>수업 시간</div>
            </div>
            <div style={statBox}>
              <div style={{ ...statVal, color: spotsLeft <= 0 ? 'var(--coral)' : 'inherit' }}>
                {currentStudents ?? 0} / {maxStudents ?? '-'}명
              </div>
              <div style={statLbl}>모집 현황</div>
            </div>
          </div>
        </div>
      </div>

      {description && (
        <div className="teacher-detail__section">
          <h3>📋 수업 소개</h3>
          <p>{description}</p>
        </div>
      )}

      <div className="teacher-detail__section">
        <h3>👨‍🏫 선생님 정보</h3>
        {teacher ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                className="teacher-detail__avatar-wrap"
                style={{ ...avatarStyle, width: 52, height: 52, fontSize: 20, flexShrink: 0 }}
              >
                {teacher.name?.[0] ?? '선'}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900 }}>{teacher.name} 선생님</div>
                <div style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600, marginTop: 2 }}>
                  수업 담당 선생님
                </div>
              </div>
            </div>
            {teacher.teacherProfileId && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/teachers/${teacher.teacherProfileId}`)}
              >
                선생님 프로필 자세히 →
              </button>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--ink-mute)' }}>선생님 정보 없음</p>
        )}
      </div>

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

      {availableSchedule && (
        <div className="teacher-detail__section">
          <h3>🗓 수업 일정</h3>
          <p>{availableSchedule}</p>
        </div>
      )}

      {textbook && (
        <div className="teacher-detail__section">
          <h3>📖 사용 교재</h3>
          <p>{textbook}</p>
        </div>
      )}

      <div className="teacher-detail__section">
        <h3>📅 수업 기간</h3>
        <p>{formatDate(startDate)} ~ {formatDate(endDate)}</p>
      </div>

      {/* ===== 수강 후기 (TODO: Review API 연결 시 DUMMY_REVIEWS → API 응답으로 교체) ===== */}
      <div className="teacher-detail__section">
        <h3>⭐ 수강 후기</h3>

        {/* 평점 요약 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 18px', background: 'var(--cream)', borderRadius: 14, border: '1.5px solid rgba(31,41,55,0.08)' }}>
          <div style={{ textAlign: 'center', minWidth: 64 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--coral)', lineHeight: 1 }}>
              {DUMMY_AVG_RATING}
            </div>
            <div style={{ fontSize: 18, color: 'var(--coral)', letterSpacing: 2, margin: '4px 0 2px' }}>
              {'★'.repeat(Math.floor(DUMMY_AVG_RATING))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600 }}>
              {DUMMY_REVIEW_COUNT}개 후기
            </div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(31,41,55,0.1)' }} />
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
            수강생들이 남긴 솔직한 후기예요.<br />
            실제 수업을 들은 학생들의 경험을 확인해보세요.
          </p>
        </div>

        {/* 리뷰 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DUMMY_REVIEWS.map((review) => (
            <div
              key={review.id}
              style={{ padding: '14px 16px', background: 'var(--paper)', border: 'var(--border-line)', borderRadius: 14, boxShadow: '2px 2px 0 var(--ink)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{review.author}</span>
                <span style={{ color: 'var(--coral)', letterSpacing: 2, fontSize: 14 }}>
                  {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                "{review.text}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 수강 신청 폼 ===== */}
      {showForm && (
        <div className="teacher-detail__section">
          <h3>📝 수강 신청</h3>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">자기소개 *</label>
              <textarea className="form-input" name="introduction" value={formData.introduction}
                onChange={handleFormChange} rows={3} required
                placeholder="간단한 자기소개를 작성해주세요" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">학습 목표 *</label>
              <textarea className="form-input" name="goal" value={formData.goal}
                onChange={handleFormChange} rows={3} required
                placeholder="이 수업을 통해 달성하고 싶은 목표를 작성해주세요" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">희망 일정</label>
              <input className="form-input" type="text" name="preferredScheduleNote"
                value={formData.preferredScheduleNote} onChange={handleFormChange}
                placeholder="예) 주 2회, 평일 저녁 7시 이후" />
            </div>
            <div className="form-group">
              <label className="form-label">희망 시작일</label>
              <input className="form-input" type="date" name="preferredStart"
                value={formData.preferredStart} onChange={handleFormChange} />
            </div>
            <div className="form-group">
              <label className="form-label">선생님께 남길 메시지</label>
              <textarea className="form-input" name="message" value={formData.message}
                onChange={handleFormChange} rows={3}
                placeholder="선생님께 전하고 싶은 말을 자유롭게 작성해주세요" style={{ resize: 'vertical' }} />
            </div>

            {submitError && (
              <p style={{ color: 'var(--coral)', fontSize: 14, fontWeight: 600, margin: 0 }}>
                ⚠️ {submitError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => { setShowForm(false); setSubmitError('') }}>
                취소
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? '신청 중...' : '신청 완료'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== 신청 버튼 (폼이 열리면 숨김) ===== */}
      {!showForm && (
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 8 }}
          disabled={!canApply}
          title={applyButtonTitle}
          onClick={() => setShowForm(true)}
        >
          {canApply ? '수업 신청하기' : '모집 마감'}
        </button>
      )}
    </div>
  )
}