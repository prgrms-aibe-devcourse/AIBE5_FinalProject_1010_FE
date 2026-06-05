import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import CourseCard from '../search/CourseCard.jsx'
import styles from './TeacherDetailPage.module.css'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'

const AVATAR_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
const GENDER_LABEL = { MALE: '남', FEMALE: '여' }

const val = v => (v == null || v === '') ? '정보 없음' : v

/* ── 후기/내공/QA: API 미제공 필드 fallback ── */
const FALLBACK_NAEGONG = {
  adoptions: 48,
  adoptionPts: 480,
  lectureHours: 804,
  lecturePts: 804,
  weekRank: '전체 1위',
}

const FALLBACK_QA = {
  totalAnswers: 126,
  adoptionRate: 38,
  subjects: '수학 · 미적분',
}

const FALLBACK_REVIEWS = [
  {
    id: 1,
    author: '서*윤',
    color: 'c2',
    course: '미적분 II · 2026.05',
    stars: 5,
    text: '설명이 진짜 쉬워요. 제가 직접 풀게 하시니까 시험장에서도 안 떨려요!',
  },
  {
    id: 2,
    author: '김*은',
    color: 'c3',
    course: '기하 · 2026.04',
    stars: 5,
    text: '아이가 수학을 좋아하게 됐어요. 매주 리포트도 꼼꼼히 보내주세요.',
  },
]

export default function TeacherDetailPage() {
  const { id } = useParams()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scrapped, setScrapped] = useState(false)

  useEffect(() => {
    setLoading(true)
    authFetch(`${API_BASE}/api/v1/teachers/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setTeacher)
      .catch(err => console.error('선생님 정보 조회 실패', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main style={{ position: 'relative', zIndex: 2 }}>
        <div className={styles.page}>
          <p style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-mute)', fontWeight: 700 }}>
            불러오는 중…
          </p>
        </div>
      </main>
    )
  }

  if (!teacher) {
    return (
      <main style={{ position: 'relative', zIndex: 2 }}>
        <div className={styles.page}>
          <p style={{ textAlign: 'center', padding: '80px 0', color: 'var(--coral)', fontWeight: 700 }}>
            선생님 정보를 불러오지 못했어요.
          </p>
        </div>
      </main>
    )
  }

  const {
    name, profileImageUrl, gender,
    education, career, awards, address, teachingStyle, introduction,
    naegongScore = 0, courses = [],
    naegong = FALLBACK_NAEGONG,
    qa = FALLBACK_QA,
    reviews = FALLBACK_REVIEWS,
    reviewCount = FALLBACK_REVIEWS.length,
  } = teacher

  const avatarColor = AVATAR_COLORS[Number(id ?? 1) % AVATAR_COLORS.length]
  const genderLabel = GENDER_LABEL[gender] ?? '정보 없음'

  return (
    <main style={{ position: 'relative', zIndex: 2 }}>
      <div className={styles.page}>

        {/* ── Breadcrumb ── */}
        <nav className={styles.crumb}>
          <Link to="/teachers">선생님 찾기</Link>
          <span className={styles.crumbSep}>›</span>
          <span>{name} 선생님</span>
        </nav>

        {/* ── Hero ── */}
        <div className={styles.hero}>
          <div className={styles.heroBanner} />

          {/* Avatar */}
          <div className={styles.heroAvatarWrap}>
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={name}
                style={{
                  width: 110, height: 110, borderRadius: '50%',
                  objectFit: 'cover', border: '4px solid white',
                  boxShadow: 'var(--offset-shadow)',
                }}
              />
            ) : (
              <Avatar
                size="xl"
                color={avatarColor}
                style={{ width: 110, height: 110, fontSize: 46, border: '4px solid white' }}
              >
                {name?.[0]}
              </Avatar>
            )}
          </div>

          {/* Info + stats */}
          <div className={styles.heroInfo}>
            <div className={styles.heroNameRow}>
              <span className={styles.heroName}>{name} 선생님</span>
              <span className={styles.badgeCert}>✓ 인증 완료</span>
            </div>

            <div className={styles.heroMeta}>
              {val(education)} · {genderLabel} · {val(address)}
            </div>

            <div className={styles.heroStats} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className={styles.statBox}>
                <span className={styles.statVal} style={{ color: 'var(--teal-dark)' }}>
                  {naegongScore.toLocaleString()}
                </span>
                <div className={styles.statLbl}>내공 점수</div>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal}>{courses.length}</span>
                <div className={styles.statLbl}>운영 중인 수업</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actionCol}>
            <button className={styles.btnCoral}>💬 문의하기</button>
            <button
              className={`${styles.btnScrap}${scrapped ? ` ${styles.active}` : ''}`}
              onClick={() => setScrapped(s => !s)}
            >
              {scrapped ? '♥ 스크랩됨' : '♡ 스크랩'}
            </button>
          </div>
        </div>

        {/* ── Main + Sidebar ── */}
        <div className={styles.layout}>

          {/* ── Main column ── */}
          <div>
            {/* 자기소개 */}
            <section className={styles.block}>
              <h2 className={styles.blockTitle}>📝 자기소개</h2>
              <p className={styles.intro}>{val(introduction)}</p>
              <dl className={styles.kv}>
                <dt className={styles.kvTerm}>학력</dt>
                <dd className={styles.kvDef}>{val(education)}</dd>
                <dt className={styles.kvTerm}>경력</dt>
                <dd className={styles.kvDef}>{val(career)}</dd>
                <dt className={styles.kvTerm}>수상</dt>
                <dd className={styles.kvDef}>{val(awards)}</dd>
                <dt className={styles.kvTerm}>수업방식</dt>
                <dd className={styles.kvDef}>{val(teachingStyle)}</dd>
              </dl>
            </section>

            {/* 운영 중인 수업 */}
            <section className={styles.block}>
              <div className={styles.blockTitleRow}>
                <h2 className={styles.blockTitle}>📚 운영 중인 수업</h2>
                <Link to="/courses" className={styles.viewAll}>전체 보기 →</Link>
              </div>
              {courses.length > 0 ? (
                <div className={styles.coursesGrid}>
                  {courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--ink-mute)', fontSize: 14, fontWeight: 600 }}>
                  운영 중인 수업이 없어요.
                </p>
              )}
            </section>

            {/* 후기 */}
            <section className={styles.block}>
              <h2 className={styles.blockTitle}>
                ⭐ 선생님 평점 · 후기
                <span style={{ fontSize: 15, color: 'var(--ink-mute)', fontWeight: 700 }}>
                  (전체 수업 통합 · {reviewCount})
                </span>
              </h2>

              {reviews.map(r => (
                <div key={r.id} className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewMeta}>
                      <Avatar size="sm" color={r.color}>{r.author[0]}</Avatar>
                      <span className={styles.reviewAuthor}>{r.author}</span>
                      <span className={styles.reviewCourse}>{r.course}</span>
                    </div>
                    <span className={styles.reviewStars}>{'★'.repeat(r.stars)}</span>
                  </div>
                  <p className={styles.reviewText}>{r.text}</p>
                </div>
              ))}

              <button className={styles.btnMore}>후기 더보기</button>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside className={styles.side}>
            {/* 내공 점수 카드 */}
            <div className={styles.naegongCard}>
              <div className={styles.naegongHeader}>
                <span style={{ fontSize: 20 }}>🏆</span>
                <span className={styles.naegongTitle}>내공 점수</span>
              </div>
              <div className={styles.naegongScore}>{naegongScore.toLocaleString()}</div>
              <p className={styles.naegongDesc}>
                질문게시판 답변 채택과 누적 수업 시간으로 쌓인 신뢰 점수예요.
              </p>
              <div className={styles.naegongRow}>
                <span>답변 채택 ({naegong.adoptions}회)</span>
                <span className={styles.naegongPt}>+{naegong.adoptionPts}</span>
              </div>
              <div className={styles.naegongRow}>
                <span>누적 수업 {naegong.lectureHours}시간</span>
                <span className={styles.naegongPt}>+{naegong.lecturePts}</span>
              </div>
              <div className={styles.naegongRow}>
                <span>이번 주 순위</span>
                <span className={styles.naegongPt}>{naegong.weekRank}</span>
              </div>
            </div>

            {/* 질문게시판 활동 */}
            <div className={styles.qaCard}>
              <h3 className={styles.qaTitle}>💬 질문게시판 활동</h3>
              <div className={styles.qaRow}>
                <span className={styles.qaLabel}>작성 답변</span>
                <span className={styles.qaValue}>{qa.totalAnswers}개</span>
              </div>
              <div className={styles.qaRow}>
                <span className={styles.qaLabel}>채택률</span>
                <span className={styles.qaValue} style={{ color: 'var(--teal-dark)' }}>
                  {qa.adoptionRate}%
                </span>
              </div>
              <div className={styles.qaRow}>
                <span className={styles.qaLabel}>전문 과목</span>
                <span className={styles.qaValue}>{qa.subjects}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
