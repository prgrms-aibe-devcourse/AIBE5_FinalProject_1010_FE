/**
 * @file CourseCreatePage.jsx
 * @description 선생님 수업 등록 페이지 — 상태·제출 로직 전담
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { waitForTokenLoadingToFinish, getRole } from '../../auth/tokenStore.js'
import CourseFormBasic    from './components/CourseFormBasic.jsx'
import CourseFormMethod   from './components/CourseFormMethod.jsx'
import CourseFormSchedule from './components/CourseFormSchedule.jsx'
import CourseFormPrice    from './components/CourseFormPrice.jsx'
import CoursePreview      from './components/CoursePreview.jsx'
import CourseDoneModal    from './components/CourseDoneModal.jsx'
import '../../styles/course-create.css'

// 에러 필드 스크롤 우선순위
const ERR_ORDER = ['title', 'subjectId', 'price', 'startDate', 'recruitDeadline']

const DEFAULT_FORM = {
  title:           '',
  subjectId:       '',
  targetGrade:     'HIGH_2',
  maxStudents:     1,
  durationMinutes: 90,
  pricePerSession: 0,
  curriculumType:  'CUSTOM',
  description:     '',
  curriculumDetail:'',
  textbook:        '',
  startDate:       '',
  recruitDeadline: '',
}

// ── 인라인 검증 ───────────────────────────────────────────
function validate(form) {
  const e = {}
  const today = new Date().toISOString().split('T')[0]

  if (!form.title.trim())
    e.title = '수업 제목을 입력해주세요.'
  else if (form.title.length > 60)
    e.title = '제목은 60자 이내로 입력해주세요.'

  if (!form.subjectId)
    e.subjectId = '과목을 선택해주세요.'

  if (form.pricePerSession < 0)
    e.price = '수업료는 0원 이상이어야 합니다.'

  // 날짜 유효성 — 이슈 3 반영
  if (form.startDate && form.startDate < today)
    e.startDate = '수업 시작일은 오늘 이후로 설정해주세요.'

  if (form.recruitDeadline && form.startDate && form.recruitDeadline > form.startDate)
    e.recruitDeadline = '모집 마감일은 수업 시작일 이전이어야 합니다.'

  return e
}

export default function CourseCreatePage() {
  const navigate  = useNavigate()
  const errRefs   = useRef({})

  // ── 상태 ─────────────────────────────────────────────────
  const [authChecked,     setAuthChecked]     = useState(false)
  const [subjects,        setSubjects]        = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectError,    setSubjectError]    = useState(false)
  const [form,            setForm]            = useState(DEFAULT_FORM)
  const [selectedDays,    setSelectedDays]    = useState([])
  const [classTime,       setClassTime]       = useState('19:00')
  const [submitting,      setSubmitting]      = useState(false)
  const [done,            setDone]            = useState(false)
  const [errors,          setErrors]          = useState({})
  const [touched,         setTouched]         = useState({})

  // ── 핸들러 (이슈 2: early return 이전에 선언) ──────────────

  // 특정 필드 값 변경 + 이미 touched된 필드면 에러 즉시 제거
  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setTouched(prev => {
      if (!prev[key]) return prev
      setErrors(e => { const n = { ...e }; delete n[key]; return n })
      return prev
    })
  }, [])

  // blur 시 해당 필드 재검증 + 날짜 연관 필드 교차 검증
  const blur = useCallback((key) => {
    setTouched(prev => ({ ...prev, [key]: true }))
    setForm(current => {
      const e = validate(current)
      setErrors(prev => {
        const next = { ...prev }
        if (e[key]) next[key] = e[key]
        else delete next[key]
        // startDate ↔ recruitDeadline 은 서로 영향을 주므로 함께 갱신
        const partner = key === 'startDate' ? 'recruitDeadline'
          : key === 'recruitDeadline' ? 'startDate'
          : null
        if (partner) {
          if (e[partner]) next[partner] = e[partner]
          else delete next[partner]
        }
        return next
      })
      return current
    })
  }, [])

  const toggleDay = useCallback((d) => {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }, [])

  // ── 인증 체크 ─────────────────────────────────────────────
  useEffect(() => {
    waitForTokenLoadingToFinish().then(() => {
      const role = getRole()
      if (!role)              { navigate('/login'); return }
      if (role !== 'TEACHER') { navigate('/');      return }
      setAuthChecked(true)
    })
  }, [navigate])

  // ── 과목 목록 ─────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/subjects`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        setSubjects(data)
        if (data.length > 0) set('subjectId', data[0].subjectId)
      })
      .catch(() => setSubjectError(true))
      .finally(() => setSubjectsLoading(false))
  }, [set])

  // 인증 확인 전 폼 노출 방지 (이슈 2: early return은 핸들러 선언 이후에)
  if (!authChecked) return null

  // ── 제출 ──────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault()

    // price 키를 DEFAULT_FORM 키 목록에 포함 (이슈 1 반영)
    const allTouched = {
      ...Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, true])),
      price: true,
    }
    setTouched(allTouched)

    const errs = validate(form)
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      const firstKey = ERR_ORDER.find(k => errs[k])
      if (firstKey) {
        setTimeout(() => {
          errRefs.current[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
      }
      return
    }

    const schedule = [
      selectedDays.length > 0 ? selectedDays.join(', ') : null,
      classTime ? classTime + ' 시작' : null,
    ].filter(Boolean).join(' / ') || undefined

    const payload = {
      title:             form.title.trim(),
      description:       form.description    || undefined,
      subjectId:         Number(form.subjectId),
      targetGrade:       form.targetGrade,
      maxStudents:       form.maxStudents    || undefined,
      durationMinutes:   Number(form.durationMinutes),
      pricePerSession:   Number(form.pricePerSession),
      curriculumType:    form.curriculumType,
      curriculumDetail:  form.curriculumDetail || undefined,
      textbook:          form.textbook         || undefined,
      availableSchedule: schedule,
      startDate:         form.startDate        || undefined,
      recruitDeadline:   form.recruitDeadline  || undefined,
    }

    setSubmitting(true)
    authFetch(`${API_BASE}/api/v1/courses`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
      .then(async res => {
        const ct = res.headers.get('content-type') ?? ''
        let data = {}
        if (ct.includes('application/json')) data = await res.json().catch(() => ({}))
        else { const t = await res.text().catch(() => ''); if (t) data = { message: t } }

        if (res.ok)             { setDone(true); return }
        if (res.status === 401) { alert('로그인 후 이용해주세요.'); navigate('/login'); return }
        if (res.status === 403) { alert('선생님 계정으로 로그인해야 수업을 등록할 수 있습니다.'); navigate('/'); return }
        if (res.status === 404) { alert(data.message || '선생님 프로필이 없거나 선택한 과목을 찾을 수 없습니다.'); return }

        const msg = data.errors
          ? Object.values(data.errors).join('\n')
          : data.message || `등록에 실패했습니다. (${res.status})`
        alert(msg)
      })
      .catch(() => alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'))
      .finally(() => setSubmitting(false))
  }

  function resetForm() {
    setForm(DEFAULT_FORM); setSelectedDays([]); setClassTime('19:00')
    setErrors({}); setTouched({}); setDone(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── 진행률 ────────────────────────────────────────────────
  // 가격은 0원(무료)도 허용 — 양수이거나 사용자가 명시적으로 필드를 확인한 경우 완료
  const priceProvided = form.pricePerSession > 0 || !!touched.price
  const filled = [form.title, form.subjectId, form.targetGrade, priceProvided ? '1' : ''].filter(Boolean).length
  const progress = Math.round((filled / 4) * 100)

  return (
    <>
      <main className="page cc-page">
        <div className="container">

          <nav className="cc-crumb">
            <span className="cc-crumb__link" onClick={() => navigate(-1)}>← 돌아가기</span>
          </nav>

          <div className="cc-head">
            <h1>새 수업을 <span className="hand">등록해볼까요?</span></h1>
            <p className="cc-head__sub">아래 정보를 채우면 학생들이 검색에서 바로 만날 수 있어요</p>
          </div>

          <div className="cc-progress">
            <div className="cc-progress__track">
              <div className="cc-progress__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="cc-progress__label">필수 항목 {filled}/4 완료</span>
          </div>

          <div className="cc-steps">
            {[
              { label: '기본 정보',   icon: '📋' },
              { label: '수업 방식',   icon: '🎥' },
              { label: '일정 · 정원', icon: '📅' },
              { label: '가격 · 소개', icon: '💳' },
            ].map(({ label, icon }) => (
              <div key={label} className="cc-step">
                <span className="cc-step__num">{icon}</span>
                <span className="cc-step__label">{label}</span>
              </div>
            ))}
          </div>

          <div className="cc-layout">
            <form onSubmit={handleSubmit} noValidate>
              <CourseFormBasic
                form={form} set={set} blur={blur}
                errors={errors} touched={touched}
                subjects={subjects}
                subjectsLoading={subjectsLoading}
                subjectError={subjectError}
                errRefs={errRefs}
              />
              <CourseFormMethod form={form} set={set} />
              <CourseFormSchedule
                form={form} set={set} blur={blur}
                errors={errors} touched={touched}
                selectedDays={selectedDays} toggleDay={toggleDay}
                classTime={classTime} setClassTime={setClassTime}
              />
              <CourseFormPrice
                form={form} set={set} blur={blur}
                errors={errors} touched={touched}
                errRefs={errRefs}
              />

              <div className="cc-notice">
                <span className="cc-notice__ic">✅</span>
                <span>등록 즉시 모집이 시작되고 검색에 노출됩니다</span>
              </div>

              <div className="cc-actions">
                <button type="button" className="btn btn--ghost btn--lg cc-actions__cancel"
                  onClick={() => navigate(-1)}>
                  취소
                </button>
                <button type="submit" className="btn btn--coral btn--lg cc-actions__submit"
                  disabled={submitting}>
                  {submitting
                    ? <><span className="cc-spinner" /> 등록 중...</>
                    : '✨ 수업 등록하기'}
                </button>
              </div>
            </form>

            <CoursePreview
              form={form}
              subjects={subjects}
              selectedDays={selectedDays}
              classTime={classTime}
            />
          </div>
        </div>
      </main>

      {done && (
        <CourseDoneModal
          onViewCourses={() => navigate('/courses')}
          onRegisterMore={resetForm}
        />
      )}
    </>
  )
}
