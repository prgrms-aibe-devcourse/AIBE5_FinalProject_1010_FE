import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseDetail } from '../../api/courseApi.js'
import Badge from '../../components/ui/Badge.jsx'
import { GRADE_LABEL } from '../../utils/labels.js'

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }
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

  const handleApplyClick = () => {
    if (!canApply) return
    alert('수강신청 기능은 준비 중입니다.')
  }

  const applyButtonTitle = (() => {
    if (status === 'IN_PROGRESS') return '이미 진행 중인 수업입니다'
    if (status === 'CLOSED') return '종료된 수업입니다'
    if (spotsLeft <= 0) return '모집 인원이 마감되었습니다'
    return '수강신청 기능은 준비 중입니다'
  })()

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

      {/* TODO: 수강신청 API 연결 후 실제 신청 요청으로 교체 */}
      <button
        className="btn btn-primary btn-full btn-lg"
        style={{ marginTop: 8 }}
        disabled={!canApply}
        title={applyButtonTitle}
        onClick={handleApplyClick}
      >
        {canApply ? '수업 신청하기' : '모집 마감'}
      </button>
    </div>
  )
}