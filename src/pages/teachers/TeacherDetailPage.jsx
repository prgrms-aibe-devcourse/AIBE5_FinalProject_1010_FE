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

const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }

const THUMB_BG = [
  'td-course-thumb--1', 'td-course-thumb--2', 'td-course-thumb--3',
  'td-course-thumb--4', 'td-course-thumb--5', 'td-course-thumb--6',
]

const SUBJECT_ICONS = {
  '수학': '📐', '영어': '📝', '국어': '📖', '과학': '🔬',
  '코딩': '💻', '물리': '⚡', '화학': '🧪', '사회': '🗺️', '역사': '📜',
}

function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}

export default function TeacherDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`${API_BASE}/api/v1/teachers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then((data) => { if (!cancelled) setTeacher(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="teacher-detail">
        <div className="teacher-loading">선생님 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className="teacher-detail">
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

  const tier       = getNaegongTier(naegongScore)
  const idx        = Number(id) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[idx], color: AVATAR_COLOR[idx], fontSize: 36, fontWeight: 900 }

  return (
    <div className="teacher-detail">
      <button className="teacher-detail__back" onClick={() => navigate(-1)}>
        ← 선생님 목록으로
      </button>

      {/* ===== 프로필 헤더 ===== */}
      <div className="teacher-detail__hero">
        <div className="teacher-detail__avatar-wrap" style={profileImageUrl ? {} : avatarStyle}>
          {profileImageUrl
            ? <img src={profileImageUrl} alt={name} />
            : (name?.[0] ?? '선')
          }
        </div>

        <div className="teacher-detail__info">
          <div className="teacher-detail__name">{name} 선생님</div>
          {education && (
            <div className="teacher-detail__education">{education}</div>
          )}
          <div className="teacher-detail__badges">
            <span className={`naegong-badge ${tier.cls}`}>
              내공 {naegongScore} · {tier.label}
            </span>
            {address && <Badge variant="peach">📍 {address}</Badge>}
          </div>

          {/* 통계 카드 */}
          <div className="td-stat-row">
            <div className="td-stat-box">
              <div className="td-stat-val td-stat-val--teal">{naegongScore}</div>
              <div className="td-stat-lbl">내공 점수</div>
            </div>
            <div className="td-stat-box">
              <div className="td-stat-val">{courses.length}</div>
              <div className="td-stat-lbl">운영 강의</div>
            </div>
            <div className="td-stat-box">
              <div className="td-stat-val">{tier.label}</div>
              <div className="td-stat-lbl">티어</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 자기소개 ===== */}
      {introduction && (
        <div className="teacher-detail__section">
          <h3>👋 자기소개</h3>
          <p>{introduction}</p>
        </div>
      )}

      {/* ===== 경력 ===== */}
      {career && (
        <div className="teacher-detail__section">
          <h3>💼 경력</h3>
          <p>{career}</p>
        </div>
      )}

      {/* ===== 수상 및 자격 ===== */}
      {awards && (
        <div className="teacher-detail__section">
          <h3>🏆 수상 및 자격</h3>
          <p>{awards}</p>
        </div>
      )}

      {/* ===== 수업 방식 ===== */}
      {teachingStyle && (
        <div className="teacher-detail__section">
          <h3>📖 수업 방식</h3>
          <p>{teachingStyle}</p>
        </div>
      )}

      {/* ===== 강의 목록 ===== */}
      <div className="teacher-detail__section">
        <div className="td-courses-header">
          <h3>🎓 운영 중인 강의</h3>
          <span className="td-courses-count">{courses.length}개</span>
        </div>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--ink-mute)' }}>현재 모집 중인 강의가 없어요</p>
        ) : (
          <div className="teacher-detail__courses-grid">
            {courses.map((course, thumbIdx) => (
              <div
                key={course.id}
                className="teacher-course-card"
                style={course.id ? { cursor: 'pointer' } : undefined}
                onClick={() => course.id && navigate(`/courses/${course.id}`)}
              >
                {/* 컬러 썸네일 */}
                <div className={`td-course-thumb ${THUMB_BG[thumbIdx % 6]}`}>
                  <span className="td-course-thumb__icon">
                    {SUBJECT_ICONS[course.subjectName] ?? '📚'}
                  </span>
                  <span className={`status-badge ${course.status}`}>
                    {STATUS_LABELS[course.status] ?? course.status}
                  </span>
                </div>

                {/* 카드 내용 */}
                <div className="teacher-course-card__body">
                  <div className="teacher-course-card__title">{course.title}</div>
                  <div className="teacher-course-card__meta">
                    {course.subjectName && <Badge variant="sky">{course.subjectName}</Badge>}
                    {course.targetGrade && (
                      <Badge variant="butter">
                        {GRADE_LABEL[course.targetGrade] ?? course.targetGrade}
                      </Badge>
                    )}
                  </div>
                  <div className="teacher-course-card__price">
                    {formatPrice(course.pricePerSession)}
                    <span> / 1회 · {course.durationMinutes}분 · 최대 {course.maxStudents}명</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
