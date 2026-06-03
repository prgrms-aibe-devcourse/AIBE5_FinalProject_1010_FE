/**
 * @file TeacherDetailPage.jsx
 * @description 선생님 상세 페이지입니다.
 * - GET /api/v1/teachers/:id 로 프로필 + 강의 목록을 불러옵니다.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import Badge from '../../components/ui/Badge.jsx'

const AVATAR_BG = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)', 'var(--ink)', 'var(--ink)', 'var(--ink)', 'var(--ink)', 'white']

function getNaegongTier(score) {
  if (score >= 1000) return { label: '마스터', cls: 'master' }
  if (score >= 500)  return { label: '고수',   cls: 'expert' }
  if (score >= 100)  return { label: '중수',   cls: 'mid'    }
  return                     { label: '초보',   cls: 'novice' }
}

const TARGET_GRADE_LABELS = {
  ELEMENTARY: '초등',
  MIDDLE: '중등',
  HIGH: '고등',
  ADULT: '성인',
  ALL: '전체',
}

const STATUS_LABELS = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }

function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}

export default function TeacherDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    authFetch(`${API_BASE}/api/v1/teachers/${id}`)
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

  const tier    = getNaegongTier(naegongScore)
  const idx     = Number(id) % AVATAR_BG.length
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
            {courses.length > 0 && (
              <Badge variant="mint">📚 강의 {courses.length}개</Badge>
            )}
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
        <h3>🎓 진행 중인 강의 ({courses.length})</h3>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--ink-mute)' }}>현재 모집 중인 강의가 없어요</p>
        ) : (
          <div className="teacher-detail__courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="teacher-course-card">
                <div className="teacher-course-card__title">{course.title}</div>
                <div className="teacher-course-card__meta">
                  {course.subjectName && <Badge variant="sky">{course.subjectName}</Badge>}
                  {course.targetGrade && (
                    <Badge variant="butter">
                      {TARGET_GRADE_LABELS[course.targetGrade] ?? course.targetGrade}
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
    </div>
  )
}
