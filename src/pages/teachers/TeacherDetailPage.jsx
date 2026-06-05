/**
 * @file TeacherDetailPage.jsx
 * @description 선생님 상세 페이지입니다.
 * - 현재는 더미 데이터로 UI를 렌더링합니다.
 * - API 연결 시 DUMMY_TEACHER/DUMMY_COURSES를
 *   GET /api/v1/teachers/${id} 응답으로 교체하세요.
 */
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import CourseCard from '../search/CourseCard.jsx'
import styles from './TeacherDetailPage.module.css'

const AVATAR_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']

/* ── 더미 선생님 데이터 ── */
const DUMMY_TEACHER = {
  name: '박지훈',
  profileImageUrl: null,
  subjects: '수학 · 미적분 · 기하',
  education: '서울대학교 수학과 재학 (4학년)',
  career: '대치동 수학 학원 강사 3년 · 1:1 과외 5년',
  awards: '한국수학올림피아드(KMO) 은상 · 대학 수학경시 대상',
  teachingStyle: '양방향 화이트보드 · 학생 주도 문제풀이 · 주간 피드백 리포트',
  gender: '남',
  age: 28,
  address: '서울 관악',
  careerYears: 8,
  rating: 4.9,
  totalStudents: 1284,
  naegongScore: 1284,
  reviewCount: 642,
  introduction:
    '안녕하세요, 서울대 수학과 박지훈입니다. 8년간 200명이 넘는 학생을 가르치며 깨달은 건, 수학은 외우는 게 아니라 직접 풀어봐야 는다는 거예요.\n그래서 저는 공유 화이트보드 위에서 학생이 직접 펜을 들고 풀게 하고, 막히는 순간 바로 옆에서 첨삭합니다. 킬러문항도 원리만 잡으면 무섭지 않아요. 함께 1등급 만들어봐요!',
  naegong: {
    adoptions: 48,
    adoptionPts: 480,
    lectureHours: 804,
    lecturePts: 804,
    weekRank: '전체 1위',
  },
  qa: {
    totalAnswers: 126,
    adoptionRate: 38,
    subjects: '수학 · 미적분',
  },
  reviews: [
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
  ],
}

/* ── 더미 수업 데이터 (CourseCard prop 스펙과 일치) ── */
const DUMMY_COURSES = [
  {
    id: 1,
    title: '수능 수학 1등급 만들기 — 미적분 완성반',
    teacherName: '박지훈',
    teacherProfileImageUrl: null,
    subjectName: '수학',
    targetGrade: 'HIGH_3',
    pricePerSession: 60000,
    maxStudents: 4,
    currentStudents: 3,
    thumbnailUrl: null,
    status: 'RECRUITING',
  },
  {
    id: 7,
    title: '기하 · 벡터 개념부터 킬러문항까지',
    teacherName: '박지훈',
    teacherProfileImageUrl: null,
    subjectName: '수학',
    targetGrade: 'HIGH_2',
    pricePerSession: 55000,
    maxStudents: 3,
    currentStudents: 2,
    thumbnailUrl: null,
    status: 'IN_PROGRESS',
  },
]

export default function TeacherDetailPage() {
  /* useParams — API 연결 시 id를 사용하세요 */
  const { id } = useParams()
  const [scrapped, setScrapped] = useState(false)

  /*
   * TODO: 아래 더미 데이터를 API 응답으로 교체하세요.
   * GET /api/v1/teachers/${id}
   * const [teacher, setTeacher] = useState(null)
   * useEffect(() => {
   *   fetch(`${API_BASE}/api/v1/teachers/${id}`)
   *     .then(r => r.json()).then(setTeacher)
   * }, [id])
   */
  const teacher = DUMMY_TEACHER
  const courses = DUMMY_COURSES

  const {
    name, profileImageUrl, subjects, education, career, awards, teachingStyle,
    gender, age, address, careerYears, rating, totalStudents, naegongScore,
    reviewCount, introduction, naegong, qa, reviews,
  } = teacher

  const avatarColor = AVATAR_COLORS[Number(id ?? 1) % AVATAR_COLORS.length]

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
              <span className={styles.badgeGold}>🥇 이번 주 TOP</span>
            </div>

            <div className={styles.heroSubjects}>{subjects}</div>

            <div className={styles.heroMeta}>
              {education} · 과외 경력 {careerYears}년 · {gender} · {age}세 · {address}
            </div>

            <div className={styles.heroStats}>
              <div className={styles.statBox}>
                <span className={styles.statVal} style={{ color: 'var(--coral)' }}>
                  ★ {rating}
                </span>
                <div className={styles.statLbl}>평점</div>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal}>{totalStudents.toLocaleString()}</span>
                <div className={styles.statLbl}>누적 수강생</div>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal} style={{ color: 'var(--teal-dark)' }}>
                  {naegongScore.toLocaleString()}
                </span>
                <div className={styles.statLbl}>내공 점수</div>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal}>{careerYears}년</span>
                <div className={styles.statLbl}>경력</div>
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
              <p className={styles.intro}>{introduction}</p>
              <dl className={styles.kv}>
                <dt className={styles.kvTerm}>학력</dt>
                <dd className={styles.kvDef}>{education}</dd>
                <dt className={styles.kvTerm}>경력</dt>
                <dd className={styles.kvDef}>{career}</dd>
                <dt className={styles.kvTerm}>수상</dt>
                <dd className={styles.kvDef}>{awards}</dd>
                <dt className={styles.kvTerm}>수업방식</dt>
                <dd className={styles.kvDef}>{teachingStyle}</dd>
              </dl>
            </section>

            {/* 운영 중인 수업 */}
            <section className={styles.block}>
              <div className={styles.blockTitleRow}>
                <h2 className={styles.blockTitle}>📚 운영 중인 수업</h2>
                <Link to="/courses" className={styles.viewAll}>전체 보기 →</Link>
              </div>
              <div className={styles.coursesGrid}>
                {courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
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
