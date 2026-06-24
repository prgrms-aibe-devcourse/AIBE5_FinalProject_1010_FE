import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { waitForTokenLoadingToFinish, getRole } from '../../auth/tokenStore.js'
import useCourseForm, { validate, ERR_ORDER } from './hooks/useCourseForm.js'
import CourseFormContainer from './components/CourseFormContainer.jsx'
import '../../styles/course-create.css'

// availableSchedule 역파싱 — handleSubmit에서 조립한 포맷을 그대로 분해
// 포맷: "월, 화 / 14:00 시작" | "월, 화" | "14:00 시작" | null
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

  const [authChecked,     setAuthChecked]     = useState(false)
  const [initialLoading,  setInitialLoading]  = useState(true)
  const [loadError,       setLoadError]       = useState(false)
  const [notAllowed,      setNotAllowed]      = useState(false)
  const [subjects,        setSubjects]        = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectError,    setSubjectError]    = useState(false)
  const [submitting,      setSubmitting]      = useState(false)
  const [apiError,        setApiError]        = useState(null)
  const [teacherAddress,  setTeacherAddress]  = useState('')

  const {
    form,
    selectedDays, classTime, setClassTime,
    errors, setErrors, touched,
    errRefs,
    set, blur, toggleDay, resetForm, touchAll, buildSchedule,
  } = useCourseForm()

  useEffect(() => {
    waitForTokenLoadingToFinish().then(async () => {
      const role = getRole()
      if (!role)              { navigate('/login'); return }
      if (role !== 'TEACHER') { navigate('/');      return }
      const res = await authFetch(`${API_BASE}/api/v1/users/me`)
      const me = res.ok ? await res.json() : null
      if (me?.isVerified === false) {
        alert('관리자 인증 후 수업을 수정할 수 있어요. 마이페이지 인증 탭으로 이동합니다.')
        navigate('/mypage?tab=verify')
        return
      }
      setAuthChecked(true)
    })
  }, [navigate])

  useEffect(() => {
    if (!authChecked) return
    let cancelled = false

    Promise.all([
      fetch(`${API_BASE}/api/v1/subjects`).then(r => { if (!r.ok) throw new Error('subjects'); return r.json() }),
      authFetch(`${API_BASE}/api/v1/courses/${courseId}`).then(r => { if (!r.ok) throw new Error('course'); return r.json() }),
    ])
      .then(([subjectList, course]) => {
        if (cancelled) return
        setSubjects(subjectList)
        setSubjectsLoading(false)

        if (course.status !== 'RECRUITING') { setNotAllowed(true); return }

        const { days, time } = parseSchedule(course.availableSchedule)
        resetForm({
          title:           course.title           ?? '',
          subjectId:       course.subjectId        ?? '',
          targetGrade:     course.targetGrade      ?? '',
          maxStudents:     course.maxStudents       ?? 1,
          durationMinutes: course.durationMinutes   ? String(course.durationMinutes) : '',
          pricePerSession: course.pricePerSession   ?? 0,
          curriculumType:  course.curriculumType    ?? '',
          description:     course.description       ?? '',
          curriculumDetail:course.curriculumDetail  ?? '',
          textbook:        course.textbook          ?? '',
          startDate:       course.startDate         ?? '',
          recruitDeadline: course.recruitDeadline   ?? '',
          teachingMode:    course.teachingMode       ?? '',
          location:        course.location           ?? '',
          locationLat:     course.locationLat        ?? null,
          locationLng:     course.locationLng        ?? null,
        }, days, time)
      })
      .catch((err) => {
        if (cancelled) return
        if (err?.message === 'subjects') { setSubjectError(true); setSubjectsLoading(false) }
        else setLoadError(true)
      })
      .finally(() => { if (!cancelled) setInitialLoading(false) })

    return () => { cancelled = true }
  }, [authChecked, courseId, resetForm])

  useEffect(() => {
    if (!authChecked) return
    authFetch(`${API_BASE}/api/v1/teachers/me/profile`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.address) setTeacherAddress(data.address) })
      .catch(() => {})
  }, [authChecked])

  if (!authChecked || initialLoading) {
    return (
      <main className="page cc-page">
        <div className="container" style={{ paddingTop: 80, textAlign: 'center', color: 'var(--ink-mute)' }}>
          수업 정보를 불러오는 중...
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="page cc-page">
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 18 }}>수업 정보를 불러오지 못했습니다.</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}
            onClick={() => navigate(`/courses/${courseId}/dashboard`)}>
            ← 돌아가기
          </button>
        </div>
      </main>
    )
  }

  if (notAllowed) {
    return (
      <main className="page cc-page">
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 18 }}>수정할 수 없는 수업입니다.</p>
          <p style={{ color: 'var(--ink-mute)', marginTop: 8 }}>이미 진행 중이거나 종료된 수업은 수정할 수 없어요. 모집 중인 수업만 수정 가능합니다.</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}
            onClick={() => navigate(`/courses/${courseId}/dashboard`)}>
            ← 돌아가기
          </button>
        </div>
      </main>
    )
  }

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

    const isOffline = form.teachingMode === 'OFFLINE'
    const payload = {
      title:            form.title.trim(),
      description:      form.description      || null,
      subjectId:        Number(form.subjectId),
      targetGrade:      form.targetGrade,
      maxStudents:      form.maxStudents       || null,
      durationMinutes:  Number(form.durationMinutes),
      pricePerSession:  Number(form.pricePerSession),
      curriculumType:   form.curriculumType,
      curriculumDetail: form.curriculumDetail  || null,
      textbook:         form.textbook          || null,
      availableSchedule: buildSchedule(),
      startDate:        form.startDate         || null,
      recruitDeadline:  form.recruitDeadline   || null,
      teachingMode:     form.teachingMode      || null,
      location:         isOffline ? (form.location || null) : null,
      locationLat:      isOffline ? (form.locationLat ?? null) : null,
      locationLng:      isOffline ? (form.locationLng ?? null) : null,
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
      if (res.status === 403) { setApiError('본인 수업만 수정할 수 있습니다.'); return }

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
          <span className="cc-crumb__link" onClick={() => navigate(`/courses/${courseId}/dashboard`)}>← 돌아가기</span>
        </nav>

        <div className="cc-head">
          <h1>수업 정보를 <span className="hand">수정해볼까요?</span></h1>
          <p className="cc-head__sub">모집 중인 수업의 정보를 수정합니다. 저장 즉시 반영됩니다.</p>
        </div>

        <CourseFormContainer
          form={form} set={set} blur={blur} toggleDay={toggleDay}
          selectedDays={selectedDays} classTime={classTime} setClassTime={setClassTime}
          subjects={subjects} subjectsLoading={subjectsLoading} subjectError={subjectError}
          errors={errors} touched={touched} errRefs={errRefs}
          submitting={submitting} apiError={apiError}
          onSubmit={handleSubmit}
          submitLabel="수업 수정하기"
          teacherAddress={teacherAddress}
          onCancel={() => navigate(`/courses/${courseId}/dashboard`)}
        />
      </div>
    </main>
  )
}
