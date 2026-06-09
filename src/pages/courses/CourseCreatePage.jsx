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

// 에러 필드 스크롤 우선순위 (price → pricePerSession 키로 통일)
const ERR_ORDER = ['title', 'subjectId', 'targetGrade', 'durationMinutes', 'curriculumType', 'pricePerSession', 'startDate', 'recruitDeadline']

const DEFAULT_FORM = {
  title:           '',
  subjectId:       '',
  targetGrade:     '',
  maxStudents:     1,
  durationMinutes: '',
  pricePerSession: 0,
  curriculumType:  '',
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

  if (!form.targetGrade)
    e.targetGrade = '대상 학년을 선택해주세요.'

  if (!form.durationMinutes)
    e.durationMinutes = '수업 시간을 선택해주세요.'

  if (!form.curriculumType)
    e.curriculumType = '커리큘럼 유형을 선택해주세요.'

  if (form.pricePerSession < 0)
    e.pricePerSession = '수업료는 0원 이상이어야 합니다.'

  if (form.startDate && form.startDate < today)
    e.startDate = '수업 시작일은 오늘 이후로 설정해주세요.'

  if (form.recruitDeadline && form.startDate && form.recruitDeadline > form.startDate)
    e.recruitDeadline = '모집 마감일은 수업 시작일 이전이어야 합니다.'

  return e
}

export default function CourseCreatePage() {
  const navigate  = useNavigate()
  const errRefs   = useRef({})
  // formRef: blur 등 useCallback([], []) 내부에서 최신 form 값에 안전하게 접근하기 위한 ref
  const formRef   = useRef(DEFAULT_FORM)

  // ── 상태 ─────────────────────────────────────────────────
  const [authChecked,     setAuthChecked]     = useState(false)
  const [subjects,        setSubjects]        = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectError,    setSubjectError]    = useState(false)
  const [form,            setForm]            = useState(DEFAULT_FORM)
  const [selectedDays,    setSelectedDays]    = useState([])
  const [classTime,       setClassTime]       = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [done,            setDone]            = useState(false)
  const [createdId,       setCreatedId]       = useState(null)
  const [errors,          setErrors]          = useState({})
  const [touched,         setTouched]         = useState({})
  const [apiError,        setApiError]        = useState(null)

  // ── 핸들러 (early return 이전에 선언) ──────────────────

  // 특정 필드 값 변경 + 이미 touched된 필드면 에러 즉시 제거
  const set = useCallback((key, val) => {
    const next = { ...formRef.current, [key]: val }
    formRef.current = next
    setForm(next)
    setTouched(prev => {
      if (!prev[key]) return prev
      setErrors(e => { const n = { ...e }; delete n[key]; return n })
      return prev
    })
  }, [])

  // blur 시 해당 필드 재검증 + 날짜 연관 필드 교차 검증
  // formRef를 통해 최신 form 값을 읽어 updater 내 side effect 실행 제거
  const blur = useCallback((key) => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const e = validate(formRef.current)
    setErrors(prev => {
      const next = { ...prev }
      if (e[key]) next[key] = e[key]; else delete next[key]
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
      })
      .catch(() => setSubjectError(true))
      .finally(() => setSubjectsLoading(false))
  }, [set])

  // 인증 확인 전 폼 노출 방지 (early return은 핸들러 선언 이후에)
  if (!authChecked) return null

  // ── 제출 ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()

    const allTouched = Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, true]))
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
    setApiError(null)
    let redirecting = false
    try {
      const res = await authFetch(`${API_BASE}/api/v1/courses`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      const ct = res.headers.get('content-type') ?? ''
      let data = {}
      if (ct.includes('application/json')) data = await res.json().catch(() => ({}))
      else { const t = await res.text().catch(() => ''); if (t) data = { message: t } }

      if (res.ok) {
        const id = typeof data?.id === 'number' ? data.id : null
        if (!id) setApiError('수업이 등록되었으나 ID를 확인하지 못했습니다. 내 수업 목록에서 확인해주세요.')
        setCreatedId(id)
        setDone(true)
        return
      }
      if (res.status === 401) {
        redirecting = true
        setApiError('로그인 후 이용해주세요.')
        setTimeout(() => navigate('/login'), 1500)
        return
      }
      if (res.status === 403) {
        redirecting = true
        setApiError('선생님 계정으로 로그인해야 수업을 등록할 수 있습니다.')
        setTimeout(() => navigate('/'), 1500)
        return
      }

      const msg = data.errors
        ? Object.values(data.errors).join('\n')
        : data.message || `등록에 실패했습니다. (${res.status})`
      setApiError(msg)
    } catch {
      setApiError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      if (!redirecting) setSubmitting(false)
    }
  }

  function resetForm() {
    formRef.current = DEFAULT_FORM
    setForm(DEFAULT_FORM)
    setSelectedDays([])
    setClassTime('')
    setErrors({})
    setTouched({})
    setDone(false)
    setCreatedId(null)
    setApiError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── 진행률 ────────────────────────────────────────────────
  return (
    <>
      <main className="page cc-page">
        <div className="container">

          <nav className="cc-crumb">
            <span className="cc-crumb__link" onClick={() => navigate(-1)}>← 돌아가기</span>
          </nav>

          <div className="cc-head">
            <h1>새 수업을 <span className="hand">등록해볼까요?</span></h1>
            <p className="cc-head__sub">희망 조건을 입력하면 학생이 신청 후 상담으로 세부 사항을 함께 맞춰갈 수 있어요</p>
          </div>

          <div className="cc-pref-banner" role="note">
            <span className="cc-pref-banner__ic">✍️</span>
            <div className="cc-pref-banner__body">
              <strong>희망 조건을 자유롭게 적어주세요</strong>
              <p>일정·수업료는 학생 신청 후 상담으로 함께 조율할 수 있어요</p>
            </div>
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
              <CourseFormMethod form={form} set={set} errors={errors} touched={touched} errRefs={errRefs} />
              <CourseFormSchedule
                form={form} set={set} blur={blur}
                errors={errors} touched={touched}
                selectedDays={selectedDays} toggleDay={toggleDay}
                classTime={classTime} setClassTime={setClassTime}
                errRefs={errRefs}
              />
              <CourseFormPrice
                form={form} set={set} blur={blur}
                errors={errors} touched={touched}
                errRefs={errRefs}
              />

              {apiError && (
                <p className="cc-api-error" role="alert">
                  {apiError}
                </p>
              )}

              <div className="cc-notice">
                <span className="cc-notice__ic">✅</span>
                <span>등록 즉시 검색에 노출되며, 학생이 신청하면 상담을 통해 세부 조건을 확정할 수 있어요</span>
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
          onViewDashboard={() =>
            createdId ? navigate(`/courses/${createdId}/dashboard`) : navigate('/courses')
          }
          onRegisterMore={resetForm}
        />
      )}
    </>
  )
}
