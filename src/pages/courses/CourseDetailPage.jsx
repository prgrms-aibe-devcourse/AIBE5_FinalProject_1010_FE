import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseDetail } from '../../api/courseApi.js'
import { GRADE_LABEL } from '../../utils/labels.js'

const STATUS_LABELS     = { RECRUITING: '모집 중', IN_PROGRESS: '수강 중', CLOSED: '종료' }
const CURRICULUM_LABELS = { FIXED: '정규 커리큘럼', FLEXIBLE: '맞춤형 커리큘럼' }

const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']

// Hero 상단 파스텔 배경 (아바타 컬러에 대응)
const HERO_TOP_BG = [
  'var(--peach-bg)', 'var(--sky-bg)', 'var(--butter-bg)',
  'var(--mint-bg)',  'var(--lavender-bg)', '#FCE7F3',
]

const SUBJECT_ICONS = {
  '수학': '📐', '영어': '📝', '국어': '📖', '과학': '🔬',
  '코딩': '💻', '물리': '⚡', '화학': '🧪', '사회': '🗺️', '역사': '📜',
}

const FLOW_STEPS = ['채팅 협의', '신청하기', '선생님 수락', '수업 확정', '결제']

// TODO: Review API 연결 예정 — 현재는 더미 데이터
const DUMMY_REVIEWS = [
  { id: 1, author: '서*윤', grade: '고2',   date: '2026.05', stars: 5, text: '화이트보드로 직접 풀고 바로 첨삭받으니까 어디서 틀리는지 정확히 알게 됐어요. 3등급에서 1등급 됐습니다!' },
  { id: 2, author: '정*우', grade: '고2',   date: '2026.04', stars: 5, text: '원리부터 잡아주셔서 처음 보는 문제도 풀 수 있게 됐어요. 킬러문항이 더 이상 무섭지 않아요.' },
  { id: 3, author: '김*은', grade: '학부모', date: '2026.03', stars: 4, text: '아이가 수업 시간을 기다려요. 양방향이라 집중도가 확실히 다르네요.' },
]
const DUMMY_AVG_RATING  = 4.9
const DUMMY_REVIEW_COUNT = 128
const REVIEW_BARS = [[5, 88], [4, 9], [3, 2], [2, 1], [1, 0]]

const INIT_FORM = { introduction: '', goal: '', preferredScheduleNote: '', preferredStart: '', message: '' }

function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}
function formatDate(dateStr) {
  if (!dateStr) return '미정'
  return dateStr.slice(0, 10).replace(/-/g, '.')
}
function StarRow({ stars }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  )
}

export default function CourseDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [course, setCourse]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [formData, setFormData]       = useState(INIT_FORM)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted]     = useState(false)

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

  function handleField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // TODO: courseApi.js에 createEnrollmentRequest 추가 후 API 연결 필요
  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      // await createEnrollmentRequest(id, formData)  ← courseApi.js 업데이트 후 활성화
      await new Promise(r => setTimeout(r, 600))
      setSubmitted(true)
      setShowForm(false)
    } catch (err) {
      if (err.status === 401) setSubmitError('로그인이 필요한 기능입니다. 로그인 후 다시 시도해주세요.')
      else if (err.status === 403) setSubmitError('학생 계정으로만 수강 신청할 수 있습니다.')
      else setSubmitError(err.message || '신청 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="td-page"><div className="teacher-loading">수업 정보를 불러오는 중...</div></div>
  }

  if (error || !course) {
    return (
      <div className="td-page">
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
  const avatarStyle = { background: AVATAR_BG[avatarIdx], color: AVATAR_COLOR[avatarIdx] }
  const heroTopBg   = HERO_TOP_BG[avatarIdx]
  const subjectIcon = SUBJECT_ICONS[subjectName] ?? '📚'

  return (
    <div className="td-page">
      <button className="teacher-detail__back" onClick={() => navigate(-1)}>
        ← 수업 목록으로
      </button>

      <div className="cd-detail-layout">

        {/* ===== MAIN ===== */}
        <div>

          {/* Hero card */}
          <div className="cd-hero-card">
            <div className="cd-hero-top" style={{ background: heroTopBg }}>
              <div className="cd-hero-top__deco">{subjectIcon}</div>

              <div style={{ marginBottom: 10 }}>
                <span className={`status-badge ${status}`}>{STATUS_LABELS[status] ?? status}</span>
                {spotsLeft > 0 && status === 'RECRUITING' && (
                  <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
                    {currentStudents ?? 0}/{maxStudents ?? '-'}명 모집 중
                  </span>
                )}
              </div>

              <h1 className="cd-hero-title">{title}</h1>

              <div className="cd-hero-chips">
                {subjectName  && <span className="cd-chip">{subjectName}</span>}
                {gradeLabel   && <span className="cd-chip">{gradeLabel}</span>}
                {durationMinutes && <span className="cd-chip">회당 {durationMinutes}분</span>}
                {curriculumType && <span className="cd-chip">{CURRICULUM_LABELS[curriculumType] ?? curriculumType}</span>}
              </div>
            </div>
          </div>

          {/* 선생님 정보 */}
          <div className="td-block">
            <h2>👨‍🏫 선생님 정보</h2>
            {teacher ? (
              <div className="cd-teacher-block">
                <div className="cd-teacher-block__info">
                  <div className="cd-teacher-avatar" style={avatarStyle}>
                    {teacher.name?.[0] ?? '선'}
                  </div>
                  <div>
                    <div className="cd-teacher-name-row">
                      <span className="cd-teacher-name">{teacher.name} 선생님</span>
                      <span className="cd-teacher-cert">✓ 인증</span>
                    </div>
                    <div className="cd-teacher-edu">수업 담당 선생님</div>
                    <div className="cd-teacher-stats">
                      <div className="cd-teacher-stats__item">
                        <span className="cd-teacher-stats__val">
                          <span style={{ color: 'var(--coral)' }}>★</span> 4.9
                        </span>
                        <span className="cd-teacher-stats__lbl">평점</span>
                      </div>
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

          {/* 수업 정보 */}
          {(description || textbook || curriculumType || curriculumDetail) && (
            <div className="td-block">
              <h2>📘 수업 정보</h2>
              <dl className="cd-kv">
                {description     && <><dt>수업 소개</dt><dd>{description}</dd></>}
                {textbook        && <><dt>사용 교재</dt><dd>{textbook}</dd></>}
                {curriculumType  && <><dt>커리큘럼</dt><dd>{CURRICULUM_LABELS[curriculumType] ?? curriculumType}</dd></>}
                {curriculumDetail && <><dt>상세 계획</dt><dd>{curriculumDetail}</dd></>}
              </dl>
            </div>
          )}

          {/* 일정 정보 */}
          <div className="td-block">
            <h2>🗓️ 일정 정보</h2>
            <dl className="cd-kv">
              {availableSchedule && <><dt>가능 시간대</dt><dd>{availableSchedule}</dd></>}
              <dt>수업 기간</dt><dd>{formatDate(startDate)} ~ {formatDate(endDate)}</dd>
              {maxStudents && <><dt>최대 정원</dt><dd>{maxStudents}명</dd></>}
            </dl>
          </div>

          {/* 가격·결제 안내 */}
          <div className="td-block">
            <h2>💳 가격·결제 안내</h2>
            <p className="cd-price-note">
              회당 <b style={{ color: 'var(--ink)', fontWeight: 900 }}>{formatPrice(pricePerSession)}</b>
              {' · '}매칭 확정 후 결제가 진행됩니다.
            </p>
            <div className="cd-flow">
              {FLOW_STEPS.map((step, i) => [
                <span key={`s-${i}`} className="cd-flow__step"><b>{i + 1}</b>{step}</span>,
                i < FLOW_STEPS.length - 1 && <span key={`a-${i}`} className="cd-flow__arr">→</span>,
              ])}
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 14, marginBottom: 0, fontWeight: 600 }}>
              💡 채팅 협의 시 선생님과의 채팅창으로 신청 링크가 발송됩니다.
            </p>
          </div>

          {/* 수강 후기 — TODO: Review API 연결 예정 */}
          <div className="td-block">
            <h2>
              ⭐ 수강 후기
              <span style={{ fontSize: 14, color: 'var(--ink-mute)', fontWeight: 600, marginLeft: 4 }}>
                ({DUMMY_REVIEW_COUNT})
              </span>
            </h2>

            <div className="cd-rev-summary">
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div className="cd-rev-big">{DUMMY_AVG_RATING}</div>
                <div style={{ color: '#F59E0B', letterSpacing: 2, fontSize: 18 }}>★★★★★</div>
                <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>{DUMMY_REVIEW_COUNT}개 후기</div>
              </div>
              <div className="cd-rev-bars">
                {REVIEW_BARS.map(([score, pct]) => (
                  <div key={score} className="cd-rev-bar">
                    <span style={{ minWidth: 24, color: 'var(--ink-soft)', fontWeight: 600 }}>{score}점</span>
                    <div className="cd-rev-track"><div className="cd-rev-fill" style={{ width: `${pct}%` }} /></div>
                    <span style={{ minWidth: 30, textAlign: 'right', color: 'var(--ink-mute)', fontWeight: 600 }}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {DUMMY_REVIEWS.map(r => (
              <div key={r.id} className="td-review">
                <div className="td-review__top">
                  <div className="td-review__author-row">
                    <div className="td-review__avatar">{r.author[0]}</div>
                    <b style={{ fontSize: 14 }}>{r.author}</b>
                    <span className="td-review__subject">{r.grade} · {r.date}</span>
                  </div>
                  <StarRow stars={r.stars} />
                </div>
                <p className="td-review__text">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== STICKY CTA ===== */}
        <aside className="cd-cta-sticky">

          {/* Price card (hard shadow) */}
          <div className="cd-cta-price">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className={`status-badge ${status}`}>{STATUS_LABELS[status] ?? status}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600 }}>
                정원 {currentStudents ?? 0}/{maxStudents ?? '-'}
              </span>
            </div>

            <div style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600 }}>
              회당 ({durationMinutes}분)
            </div>
            <div className="cd-cta-price__amount">
              {pricePerSession != null ? pricePerSession.toLocaleString('ko-KR') : '-'}
              <em>원</em>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600, marginBottom: 20 }}>
              매칭 확정 후 결제가 진행돼요
            </div>

            {submitted ? (
              <div className="cd-submit-success">
                ✅ 수강 신청 완료!<br />
                <span style={{ fontSize: 12, opacity: 0.8 }}>선생님 확인 후 연락드릴 예정입니다.</span>
              </div>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-full btn-lg"
                  disabled={!canApply}
                  onClick={() => canApply && setShowForm(v => !v)}
                  style={{ marginBottom: 8 }}
                  title={status === 'IN_PROGRESS' ? '이미 진행 중인 수업입니다' : undefined}
                >
                  {canApply ? (showForm ? '신청 취소' : '신청하기') : '모집 마감'}
                </button>

                {showForm && (
                  <form onSubmit={handleSubmit} className="cd-form">
                    <div className="cd-form-field">
                      <label>자기소개 (학년·수준)</label>
                      <textarea
                        value={formData.introduction}
                        onChange={e => handleField('introduction', e.target.value)}
                        placeholder="예) 고2, 모의고사 수학 3등급입니다."
                        required
                      />
                    </div>
                    <div className="cd-form-field">
                      <label>학습 목표</label>
                      <textarea
                        value={formData.goal}
                        onChange={e => handleField('goal', e.target.value)}
                        placeholder="예) 수능 수학 1등급 목표"
                        required
                      />
                    </div>
                    <div className="cd-form-field">
                      <label>희망 일정</label>
                      <textarea
                        value={formData.preferredScheduleNote}
                        onChange={e => handleField('preferredScheduleNote', e.target.value)}
                        placeholder="가능한 요일/시간대를 알려주세요"
                      />
                    </div>
                    <div className="cd-form-field">
                      <label>희망 시작일</label>
                      <input
                        type="date"
                        value={formData.preferredStart}
                        onChange={e => handleField('preferredStart', e.target.value)}
                      />
                    </div>
                    <div className="cd-form-field">
                      <label>선생님께 한마디</label>
                      <textarea
                        value={formData.message}
                        onChange={e => handleField('message', e.target.value)}
                        placeholder="자유롭게 메시지를 남겨주세요"
                      />
                    </div>
                    {submitError && <div className="cd-error">{submitError}</div>}
                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={submitting}
                      style={{ marginTop: 8 }}
                    >
                      {submitting ? '신청 중...' : '신청 보내기'}
                    </button>
                  </form>
                )}

                {submitError && !showForm && <div className="cd-error">{submitError}</div>}
              </>
            )}
          </div>

          {/* Quick info */}
          <div className="cd-quick">
            {curriculumType && (
              <div className="cd-quick__row">
                <span>커리큘럼</span>
                <span>{CURRICULUM_LABELS[curriculumType] ?? curriculumType}</span>
              </div>
            )}
            <div className="cd-quick__row">
              <span>회당 시간</span>
              <span>{durationMinutes ?? '-'}분</span>
            </div>
            <div className="cd-quick__row">
              <span>수업 시작</span>
              <span>{formatDate(startDate)}</span>
            </div>
            <div className="cd-quick__row">
              <span>수업 종료</span>
              <span>{formatDate(endDate)}</span>
            </div>
            {maxStudents && (
              <div className="cd-quick__row">
                <span>최대 정원</span>
                <span>{maxStudents}명</span>
              </div>
            )}
            <div className="cd-quick__row">
              <span>남은 자리</span>
              <span style={{ color: spotsLeft <= 0 ? 'var(--coral)' : 'var(--teal-dark)' }}>
                {spotsLeft > 0 ? `${spotsLeft}자리` : '마감'}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
