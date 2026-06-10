import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { waitForTokenLoadingToFinish, getRole } from '../../auth/tokenStore.js'
import CourseFormBasic    from './components/CourseFormBasic.jsx'
import CourseFormMethod   from './components/CourseFormMethod.jsx'
import CourseFormSchedule from './components/CourseFormSchedule.jsx'
import CourseFormPrice    from './components/CourseFormPrice.jsx'
import CoursePreview      from './components/CoursePreview.jsx'
import '../../styles/course-create.css'

const ERR_ORDER = ['title', 'subjectId', 'targetGrade', 'durationMinutes', 'curriculumType', 'pricePerSession', 'startDate', 'recruitDeadline']

const EMPTY_FORM = {
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

function validate(form) {
  const e = {}
  if (!form.title.trim())      e.title = '수업 제목을 입력해주세요.'
  else if (form.title.length > 60) e.title = '제목은 60자 이내로 입력해주세요.'
  if (!form.subjectId)         e.subjectId = '과목을 선택해주세요.'
  if (!form.targetGrade)       e.targetGrade = '대상 학년을 선택해주세요.'
  if (!form.durationMinutes)   e.durationMinutes = '수업 시간을 선택해주세요.'
  if (!form.curriculumType)    e.curriculumType = '커리큘럼 유형을 선택해주세요.'
  if (form.pricePerSession < 0) e.pricePerSession = '수업료는 0원 이상이어야 합니다.'
  if (form.recruitDeadline && form.startDate && form.recruitDeadline > form.startDate)
    e.recruitDeadline = '모집 마감일은 수업 시작일 이전이어야 합니다.'
  return e
}

function parseSchedule(str) {
  if (!str) return { days: [], time: '' }
  const parts = str.split(' / ')
  if (parts.length === 2) {
    return {
      days: parts[0].split(', ').filter(Boolean),
      time: parts[1].replace(' 시작', ''),
    }
  }
  if (str.endsWith(' 시작')) return { days: [], time: str.replace(' 시작', '') }
  return { days: str.split(', ').filter(Boolean), time: '' }
}

export default function CourseEditPage() {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const errRefs  = useRef({})
  const formRef  = useRef(EMPTY_FORM)

  const [authChecked,     setAuthChecked]     = useState(false)
  const [initialLoading,  setInitialLoading]  = useState(true)
  const [notAllowed,      setNotAllowed]      = useState(false)
  const [subjects,        setSubjects]        = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectError,    setSubjectError]    = useState(false)
  const [form,            setForm]            = useState(EMPTY_FORM)
  const [selectedDays,    setSelectedDays]    = useState([])
  const [classTime,       setClassTime]       = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [errors,          setErrors]          = useState({})
  const [touched,         setTouched]         = useState({})
  const [apiError,        setApiError]        = useState(null)

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

  const blur = useCallback((key) => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const e = validate(formRef.current)
    setErrors(prev => {
      const next = { ...prev }
      if (e[key]) next[key] = e[key]; else delete next[key]
      const partner = key === 'startDate' ? 'recruitDeadline'
        : key === 'recruitDeadline' ? 'startDate' : null
      if (partner) {
        if (e[partner]) next[partner] = e[partner]
        else delete next[partner]
      }
      return next
    })
  }, [])

  const toggleDay = useCallback((d) => {
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }, [])

  // 인증 체크
  useEffect(() => {
    waitForTokenLoadingToFinish().then(() => {
      const role = getRole()
      if (!role)              { navigate('/login'); return }
      if (role !== 'TEACHER') { navigate('/');      return }
      setAuthChecked(true)
    })
  }, [navigate])

  // 과목 목록 + 기존 수업 데이터 병렬 로드
  useEffect(() => {
    if (!authChecked) return

    Promise.all([
      fetch(`${API_BASE}/api/v1/subjects`).then(r => r.json()),
      authFetch(`${API_BASE}/api/v1/courses/${courseId}`).then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      }),
    ])
      .then(([subjectList, course]) => {
        setSubjects(subjectList)
        setSubjectsLoading(false)

        if (course.status !== 'RECRUITING') {
          setNotAllowed(true)
          return
        }

        // subjectId 매핑 — CourseFormBasic은 s.subjectId(Number)를 option value로 사용
        const matched = subjectList.find(s => s.name === course.subjectName)
        const subjectId = matched ? matched.subjectId : ''

        const { days, time } = parseSchedule(course.availableSchedule)
        setSelectedDays(days)
        setClassTime(time)

        const filled = {
          title:           course.title           ?? '',
          subjectId,
          targetGrade:     course.targetGrade     ?? '',
          maxStudents:     course.maxStudents      ?? 1,
          durationMinutes: course.durationMinutes  ? String(course.durationMinutes) : '',
          pricePerSession: course.pricePerSession  ?? 0,
          curriculumType:  course.curriculumType   ?? '',
          description:     course.description      ?? '',
          curriculumDetail:course.curriculumDetail ?? '',
          textbook:        course.textbook         ?? '',
          startDate:       course.startDate        ?? '',
          recruitDeadline: course.recruitDeadline  ?? '',
        }
        formRef.current = filled
        setForm(filled)
      })
      .catch(() => setNotAllowed(true))
      .finally(() => setInitialLoading(false))
  }, [authChecked, courseId])

  if (!authChecked || initialLoading) return null

  if (notAllowed) {
    return (
      <main className="page cc-page">
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 18 }}>수정할 수 없는 수업입니다.</p>
          <p style={{ color: 'var(--ink-mute)', marginTop: 8 }}>모집 중(RECRUITING) 상태인 수업만 수정할 수 있어요.</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }} onClick={() => navigate(-1)}>
            ← 돌아가기
          </button>
        </div>
      </main>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const allTouched = Object.fromEntries(Object.keys(EMPTY_FORM).map(k => [k, true]))
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
      title:            form.title.trim(),
      description:      form.description     || undefined,
      subjectId:        Number(form.subjectId),
      targetGrade:      form.targetGrade,
      maxStudents:      form.maxStudents      || undefined,
      durationMinutes:  Number(form.durationMinutes),
      pricePerSession:  Number(form.pricePerSession),
      curriculumType:   form.curriculumType,
      curriculumDetail: form.curriculumDetail || undefined,
      textbook:         form.textbook         || undefined,
      availableSchedule: schedule,
      startDate:        form.startDate        || undefined,
      recruitDeadline:  form.recruitDeadline  || undefined,
    }

    setSubmitting(true)
    setApiError(null)
    let redirecting = false
    try {
      const res = await authFetch(`${API_BASE}/api/v1/courses/${courseId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (res.ok) {
        redirecting = true
        navigate(`/courses/${courseId}/dashboard`)
        return
      }

      const ct = res.headers.get('content-type') ?? ''
      let data = {}
      if (ct.includes('application/json')) data = await res.json().catch(() => ({}))

      if (res.status === 401) { redirecting = true; navigate('/login'); return }
      if (res.status === 403) {
        setApiError('본인 수업만 수정할 수 있습니다.')
        return
      }

      const msg = data.errors
        ? Object.values(data.errors).join('\n')
        : data.message || `수정에 실패했습니다. (${res.status})`
      setApiError(msg)
    } catch {
      setApiError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      if (!redirecting) setSubmitting(false)
    }
  }

  return (
    <main className="page cc-page">
      <div className="container">

        <nav className="cc-crumb">
          <span className="cc-crumb__link" onClick={() => navigate(-1)}>← 돌아가기</span>
        </nav>

        <div className="cc-head">
          <h1>수업 정보를 <span className="hand">수정해볼까요?</span></h1>
          <p className="cc-head__sub">모집 중인 수업의 정보를 수정합니다. 저장 즉시 반영됩니다.</p>
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
              <p className="cc-api-error" role="alert">{apiError}</p>
            )}

            <div className="cc-actions">
              <button type="button" className="btn btn--ghost btn--lg cc-actions__cancel"
                onClick={() => navigate(-1)}>
                취소
              </button>
              <button type="submit" className="btn btn--coral btn--lg cc-actions__submit"
                disabled={submitting}>
                {submitting
                  ? <><span className="cc-spinner" /> 저장 중...</>
                  : '✏️ 수업 수정하기'}
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
  )
}
