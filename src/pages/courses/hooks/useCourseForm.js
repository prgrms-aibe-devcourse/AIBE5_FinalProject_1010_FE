import { useState, useRef, useCallback } from 'react'

export const EMPTY_FORM = {
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

export const ERR_ORDER = [
  'title', 'subjectId', 'targetGrade', 'durationMinutes',
  'curriculumType', 'pricePerSession', 'startDate', 'recruitDeadline',
]

export function validate(form) {
  const e = {}
  if (!form.title.trim())         e.title = '수업 제목을 입력해주세요.'
  else if (form.title.length > 60) e.title = '제목은 60자 이내로 입력해주세요.'
  if (!form.subjectId)             e.subjectId = '과목을 선택해주세요.'
  if (!form.targetGrade)           e.targetGrade = '대상 학년을 선택해주세요.'
  if (!form.durationMinutes)       e.durationMinutes = '수업 시간을 선택해주세요.'
  if (!form.curriculumType)        e.curriculumType = '커리큘럼 유형을 선택해주세요.'
  if (form.pricePerSession < 0)    e.pricePerSession = '수업료는 0원 이상이어야 합니다.'
  if (form.recruitDeadline && form.startDate && form.recruitDeadline > form.startDate)
    e.recruitDeadline = '모집 마감일은 수업 시작일 이전이어야 합니다.'
  return e
}

export default function useCourseForm() {
  const errRefs    = useRef({})
  const formRef    = useRef(EMPTY_FORM)
  const touchedRef = useRef({})

  const [form,         setForm]         = useState(EMPTY_FORM)
  const [selectedDays, setSelectedDays] = useState([])
  const [classTime,    setClassTime]    = useState('')
  const [errors,       setErrors]       = useState({})
  const [touched,      setTouched]      = useState({})

  const set = useCallback((key, val) => {
    const next = { ...formRef.current, [key]: val }
    formRef.current = next
    setForm(next)
    if (touchedRef.current[key]) {
      setErrors(e => { const n = { ...e }; delete n[key]; return n })
    }
  }, [])

  const blur = useCallback((key) => {
    touchedRef.current[key] = true
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

  // 폼 전체 초기화 — 등록 완료 후 "더 등록하기" 또는 수정 페이지 pre-fill에 사용
  const resetForm = useCallback((values = EMPTY_FORM, days = [], time = '') => {
    formRef.current  = values
    touchedRef.current = {}
    setForm(values)
    setSelectedDays(days)
    setClassTime(time)
    setErrors({})
    setTouched({})
  }, [])

  // 제출 시 모든 필드를 touched 처리
  const touchAll = useCallback(() => {
    const all = Object.fromEntries(Object.keys(EMPTY_FORM).map(k => [k, true]))
    touchedRef.current = all
    setTouched(all)
  }, [])

  // availableSchedule 문자열 조립 — "월, 화 / 14:00 시작" 형식
  const buildSchedule = useCallback(() => {
    const parts = [
      selectedDays.length > 0 ? selectedDays.join(', ') : null,
      classTime ? classTime + ' 시작' : null,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' / ') : null
  }, [selectedDays, classTime])

  return {
    form, formRef,
    selectedDays, classTime, setClassTime,
    errors, setErrors,
    touched, touchedRef,
    errRefs,
    set, blur, toggleDay, resetForm, touchAll, buildSchedule,
  }
}
