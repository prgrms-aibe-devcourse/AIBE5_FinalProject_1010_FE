/**
 * @file TeacherDetailPage.jsx
 * @description 선생님 상세 페이지
 * - GET /api/v1/teachers/:id
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

// TODO: Review API 연결 예정 — 현재는 더미 데이터
const DUMMY_REVIEWS = [
  { id: 1, author: '서*윤', subject: '수학', stars: 5, text: '설명이 진짜 쉬워요. 직접 풀게 하시니까 시험장에서도 안 떨려요!' },
  { id: 2, author: '김*은', subject: '수학', stars: 5, text: '아이가 수학을 좋아하게 됐어요. 매주 리포트도 꼼꼼히 보내줘요.' },
]

function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}

function StarRow({ stars }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  )
}

export default function TeacherDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [teacher, setTeacher]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [scrapped, setScrapped] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`${API_BASE}/api/v1/teachers/${id}`)
      .then(res => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then(data => { if (!cancelled) setTeacher(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return <div className="td-page"><div className="teacher-loading">선생님 정보를 불러오는 중...</div></div>
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

  const tier        = getNaegongTier(naegongScore)
  const idx         = Number(id) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[idx], color: AVATAR_COLOR[idx], fontSize: 46, fontWeight: 900 }
  const bannerBg    = AVATAR_BG[idx]

  // 과목 목록 (강의에서 추출)
  const subjects = [...new Set(courses.map(c => c.subjectName).filter(Boolean))].join(' · ')

  // 내공 포인트 분해 (더미 — 추후 API 연결 예정)
  const ngAnswerPt = Math.round(naegongScore * 0.37)
  const ngLessonPt = naegongScore - ngAnswerPt

  return (
    <div className="td-page">
      <button className="teacher-detail__back" onClick={() => navigate(-1)}>
        ← 선생님 목록으로
      </button>

      {/* ===== HERO ===== */}
      <div className="td-hero" style={{ '--td-banner': bannerBg }}>

        {/* 아바타 */}
        <div className="td-hero__avatar-wrap" style={profileImageUrl ? {} : avatarStyle}>
          {profileImageUrl
            ? <img src={profileImageUrl} alt={name} className="td-hero__avatar-img" />
            : <div className="td-hero__avatar-initials">{name?.[0] ?? '선'}</div>
          }
        </div>

        {/* 이름 / 과목 / 통계 */}
        <div className="td-hero__center">
          <div className="td-hero__namerow">
            <span className="td-hero__name">{name} 선생님</span>
            <span className="td-hero__cert">✓ 인증 완료</span>
            {tier.cls === 'master' && <span className="td-hero__top">🥇 이번 주 TOP</span>}
          </div>

          {subjects && <div className="td-hero__subject">{subjects}</div>}

          <div className="td-hero__meta">
            {[education, address].filter(Boolean).join(' · ')}
          </div>

          {/* 통계 박스 4개 */}
          <div className="td-stat-row td-stat-row--4">
            <div className="td-stat-box">
              <div className="td-stat-val">
                <span style={{ color: 'var(--coral)' }}>★</span> 4.9
              </div>
              <div className="td-stat-lbl">평점</div>
            </div>
            <div className="td-stat-box">
              <div className="td-stat-val">{courses.length}</div>
              <div className="td-stat-lbl">운영 강의</div>
            </div>
            <div className="td-stat-box">
              <div className="td-stat-val td-stat-val--teal">{naegongScore.toLocaleString()}</div>
              <div className="td-stat-lbl">내공 점수</div>
            </div>
            <div className="td-stat-box">
              <div className="td-stat-val">{tier.label}</div>
              <div className="td-stat-lbl">티어</div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="td-hero__actions">
          <button className="btn btn-primary" style={{ width: '100%' }}>💬 문의하기</button>
          <button
            className={`td-scrap-btn${scrapped ? ' td-scrap-btn--on' : ''}`}
            onClick={() => setScrapped(v => !v)}
          >
            {scrapped ? '♥ 스크랩됨' : '♡ 스크랩'}
          </button>
        </div>
      </div>

      {/* ===== 2-col detail ===== */}
      <div className="td-detail">

        {/* ===== MAIN ===== */}
        <div className="td-main">

          {/* 자기소개 */}
          {(introduction || education || career || awards || teachingStyle) && (
            <div className="td-block">
              <h2>📝 자기소개</h2>
              {introduction && <p className="td-intro">{introduction}</p>}
              <dl className="td-kv">
                {education     && <><dt>학력</dt>    <dd>{education}</dd></>}
                {career        && <><dt>경력</dt>    <dd>{career}</dd></>}
                {awards        && <><dt>수상</dt>    <dd>{awards}</dd></>}
                {teachingStyle && <><dt>수업방식</dt><dd>{teachingStyle}</dd></>}
                {address       && <><dt>지역</dt>    <dd>📍 {address}</dd></>}
              </dl>
            </div>
          )}

          {/* 운영 중인 수업 */}
          <div className="td-block">
            <div className="td-block__header">
              <h2>📚 운영 중인 수업</h2>
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
                    <div className={`td-course-thumb ${THUMB_BG[thumbIdx % 6]}`}>
                      <span className="td-course-thumb__icon">
                        {SUBJECT_ICONS[course.subjectName] ?? '📚'}
                      </span>
                      <span className={`status-badge ${course.status}`}>
                        {STATUS_LABELS[course.status] ?? course.status}
                      </span>
                    </div>
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

          {/* 후기 — TODO: Review API 연결 예정 */}
          <div className="td-block">
            <div className="td-block__header">
              <h2>⭐ 선생님 후기</h2>
              <span style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600 }}>
                더미 데이터 · Review API 연결 예정
              </span>
            </div>
            {DUMMY_REVIEWS.map(r => (
              <div key={r.id} className="td-review">
                <div className="td-review__top">
                  <div className="td-review__author-row">
                    <div className="td-review__avatar">{r.author[0]}</div>
                    <b style={{ fontSize: 14 }}>{r.author}</b>
                    <span className="td-review__subject">{r.subject}</span>
                  </div>
                  <StarRow stars={r.stars} />
                </div>
                <p className="td-review__text">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className="td-side">

          {/* 내공 점수 다크 카드 */}
          <div className="td-ng-card">
            <div className="td-ng-card__title">
              <span style={{ fontSize: 20 }}>🏆</span>
              <b style={{ fontSize: 17 }}>내공 점수</b>
            </div>
            <div className="td-ng-score">{naegongScore.toLocaleString()}</div>
            <p className="td-ng-desc">
              질문게시판 답변 채택과 누적 수업 시간으로 쌓인 신뢰 점수예요.
            </p>
            <div className="td-ng-row">
              <span>답변 채택 포인트</span>
              <span className="td-ng-row__pt">+{ngAnswerPt}</span>
            </div>
            <div className="td-ng-row">
              <span>수업 활동 포인트</span>
              <span className="td-ng-row__pt">+{ngLessonPt}</span>
            </div>
            <div className="td-ng-row">
              <span>현재 티어</span>
              <span className="td-ng-row__pt">{tier.label}</span>
            </div>
          </div>

          {/* 질문게시판 활동 */}
          <div className="td-block" style={{ marginTop: 18 }}>
            <h2 style={{ fontSize: 17 }}>💬 질문게시판 활동</h2>
            <div className="td-qa-row">
              <span className="td-qa-row__lbl">작성 답변</span>
              <b>준비 중</b>
            </div>
            <div className="td-qa-row">
              <span className="td-qa-row__lbl">채택률</span>
              <b style={{ color: 'var(--teal-dark)' }}>준비 중</b>
            </div>
            <div className="td-qa-row">
              <span className="td-qa-row__lbl">내공 등급</span>
              <b>{tier.label}</b>
            </div>
            <div className="td-qa-row">
              <span className="td-qa-row__lbl">운영 강의</span>
              <b>{courses.length}개</b>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
