import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { waitForTokenLoadingToFinish, getRole } from '../../auth/tokenStore.js'
import useCourseForm, { validate, ERR_ORDER } from './hooks/useCourseForm.js'
import CourseFormContainer from './components/CourseFormContainer.jsx'
import CourseDoneModal     from './components/CourseDoneModal.jsx'
import '../../styles/course-create.css'

export default function CourseCreatePage() {
  const navigate = useNavigate()

  const [authChecked,     setAuthChecked]     = useState(false)
  const [subjects,        setSubjects]        = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectError,    setSubjectError]    = useState(false)
  const [submitting,      setSubmitting]      = useState(false)
  const [done,            setDone]            = useState(false)
  const [createdId,       setCreatedId]       = useState(null)
  const [apiError,        setApiError]        = useState(null)

  const {
    form,
    selectedDays, classTime, setClassTime,
    errors, setErrors, touched,
    errRefs,
    set, blur, toggleDay, resetForm, touchAll, buildSchedule,
  } = useCourseForm()

  useEffect(() => {
    waitForTokenLoadingToFinish().then(() => {
      const role = getRole()
      if (!role)              { navigate('/login'); return }
      if (role !== 'TEACHER') { navigate('/');      return }
      setAuthChecked(true)
    })
  }, [navigate])

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/subjects`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setSubjects(data))
      .catch(() => setSubjectError(true))
      .finally(() => setSubjectsLoading(false))
  }, [])

  if (!authChecked) return null

  async function handleSubmit(e) {
    e.preventDefault()
    touchAll()
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

    const payload = {
      title:            form.title.trim(),
      description:      form.description      || undefined,
      subjectId:        Number(form.subjectId),
      targetGrade:      form.targetGrade,
      maxStudents:      form.maxStudents       || undefined,
      durationMinutes:  Number(form.durationMinutes),
      pricePerSession:  Number(form.pricePerSession),
      curriculumType:   form.curriculumType,
      curriculumDetail: form.curriculumDetail  || undefined,
      textbook:         form.textbook          || undefined,
      availableSchedule: buildSchedule() || undefined,
      startDate:        form.startDate         || undefined,
      recruitDeadline:  form.recruitDeadline   || undefined,
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

  function handleResetForm() {
    resetForm()
    setDone(false)
    setCreatedId(null)
    setApiError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

          <CourseFormContainer
            form={form} set={set} blur={blur} toggleDay={toggleDay}
            selectedDays={selectedDays} classTime={classTime} setClassTime={setClassTime}
            subjects={subjects} subjectsLoading={subjectsLoading} subjectError={subjectError}
            errors={errors} touched={touched} errRefs={errRefs}
            submitting={submitting} apiError={apiError}
            onSubmit={handleSubmit}
            submitLabel="✨ 수업 등록하기"
            onCancel={() => navigate(-1)}
            notice="등록 즉시 검색에 노출되며, 학생이 신청하면 상담을 통해 세부 조건을 확정할 수 있어요"
          />
        </div>
      </main>

      {done && (
        <CourseDoneModal
          onViewDashboard={() =>
            createdId ? navigate(`/courses/${createdId}/dashboard`) : navigate('/courses')
          }
          onRegisterMore={handleResetForm}
        />
      )}
    </>
  )
}
