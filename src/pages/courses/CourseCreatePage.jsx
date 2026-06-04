/**
 * @file CourseCreatePage.jsx
 * @description 선생님 수업 등록 페이지
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { GRADE_LABEL } from '../../utils/labels.js'
import { getAccessToken, waitForTokenLoadingToFinish } from '../../auth/tokenStore.js'
import '../../styles/course-create.css'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const DURATION_OPTIONS = [60, 90, 120, 150, 180]
const TITLE_MAX = 60
const DESC_MAX  = 500

// 에러 필드 순서 (스크롤 우선순위)
const ERR_ORDER = ['title', 'subjectId', 'price']

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

// JWT payload에서 role 추출 (서버 검증 대체 불가 — 진입 UX 개선 목적)
function getRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role ?? null
  } catch {
    return null
  }
}

// ── 인라인 검증 ──────────────────────────────────────────
function validate(form) {
  const e = {}
  if (!form.title.trim())
    e.title = '수업 제목을 입력해주세요.'
  else if (form.title.length > TITLE_MAX)
    e.title = `제목은 ${TITLE_MAX}자 이내로 입력해주세요.`
  if (!form.subjectId)
    e.subjectId = '과목을 선택해주세요.'
  if (form.pricePerSession < 0)
    e.price = '수업료는 0원 이상이어야 합니다.'
  return e
}

export default function CourseCreatePage() {
  const navigate  = useNavigate()
  const errRefs   = useRef({})          // 에러 필드 ref 맵

  const [authChecked,    setAuthChecked]    = useState(false)
  const [subjects,       setSubjects]       = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectError,   setSubjectError]   = useState(false)
  const [form,           setForm]           = useState(DEFAULT_FORM)
  const [selectedDays,   setSelectedDays]   = useState([])
  const [classTime,      setClassTime]      = useState('19:00')
  const [submitting,     setSubmitting]     = useState(false)
  const [done,           setDone]           = useState(false)
  const [errors,         setErrors]         = useState({})
  const [touched,        setTouched]        = useState({})

  // ── 인증 체크 (토큰 없거나 TEACHER 아니면 차단) ──────────
  useEffect(() => {
    waitForTokenLoadingToFinish().then(() => {
      const token = getAccessToken()
      if (!token) { navigate('/login'); return }
      const role = getRoleFromToken(token)
      if (role !== 'TEACHER') { navigate('/'); return }
      setAuthChecked(true)
    })
  }, [navigate])

  // ── 과목 목록 ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/subjects`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        setSubjects(data)
        if (data.length > 0) set('subjectId', data[0].subjectId)
      })
      .catch(() => setSubjectError(true))
      .finally(() => setSubjectsLoading(false))
  }, [])

  // 인증 확인 전 폼 노출 방지
  if (!authChecked) return null

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
    if (touched[key]) {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  function blur(key) {
    setTouched(prev => ({ ...prev, [key]: true }))
    const e = validate({ ...form })
    if (e[key]) setErrors(prev => ({ ...prev, [key]: e[key] }))
  }

  function toggleDay(d) {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  function handleSubmit(e) {
    e.preventDefault()

    // DEFAULT_FORM 키 + price 키를 모두 touched 처리
    const allTouched = {
      ...Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, true])),
      price: true,
    }
    setTouched(allTouched)

    const errs = validate(form)
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      // 우선순위 순서로 첫 번째 에러 필드 스크롤
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
        if (res.status === 403) { alert('선생님 계정으로 로그인해야 수업을 등록할 수 있습니다.'); return }
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

  // ── 미리보기 파생 값 ──────────────────────────────────
  const subjectName    = subjects.find(s => s.subjectId === Number(form.subjectId))?.name ?? '과목'
  const gradeLabel     = GRADE_LABEL[form.targetGrade] ?? form.targetGrade
  const modeLabel      = form.maxStudents <= 1 ? '1:1' : form.maxStudents <= 6 ? '소그룹' : '대형'
  const previewTitle   = form.title.trim() || '수업 제목을 입력하세요'
  const formattedPrice = Number(form.pricePerSession).toLocaleString('ko-KR')
  const filled         = [form.title, form.subjectId, form.targetGrade, form.pricePerSession > 0 ? '1' : ''].filter(Boolean).length
  const progress       = Math.round((filled / 4) * 100)

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

          {/* 진행률 바 */}
          <div className="cc-progress">
            <div className="cc-progress__track">
              <div className="cc-progress__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="cc-progress__label">필수 항목 {filled}/4 완료</span>
          </div>

          {/* Step Rail */}
          <div className="cc-steps">
            {[
              { num: 1, label: '기본 정보',   icon: '📋' },
              { num: 2, label: '수업 방식',   icon: '🎥' },
              { num: 3, label: '일정 · 정원', icon: '📅' },
              { num: 4, label: '가격 · 소개', icon: '💳' },
            ].map(({ num, label, icon }) => (
              <div key={num} className="cc-step">
                <span className="cc-step__num">{icon}</span>
                <span className="cc-step__label">{label}</span>
              </div>
            ))}
          </div>

          <div className="cc-layout">
            <form onSubmit={handleSubmit} noValidate>

              {/* ── Block 1: 기본 정보 ── */}
              <div className="cc-block">
                <div className="cc-block__header">
                  <span className="cc-block__badge">1</span>
                  <div>
                    <h2>기본 정보</h2>
                    <p className="cc-desc">어떤 수업인지 한눈에 보이도록 적어주세요</p>
                  </div>
                </div>

                {/* 수업 제목 */}
                <div
                  className={`cc-field${errors.title && touched.title ? ' cc-field--error' : ''}`}
                  ref={el => { errRefs.current.title = el }}>
                  <label className="cc-label">
                    수업 제목 <span className="cc-req">필수</span>
                  </label>
                  <input className="input" value={form.title} maxLength={TITLE_MAX}
                    onChange={e => set('title', e.target.value)}
                    onBlur={() => blur('title')}
                    placeholder="예: 고2 미적분 1:1 과외 — 수능 최단기 완성" />
                  <div className="cc-field__footer">
                    {errors.title && touched.title
                      ? <span className="cc-field__err">⚠ {errors.title}</span>
                      : <span />}
                    <span className={`cc-counter${form.title.length > TITLE_MAX * 0.9 ? ' cc-counter--warn' : ''}`}>
                      {form.title.length}/{TITLE_MAX}
                    </span>
                  </div>
                </div>

                <div className="cc-row3">
                  {/* 과목 */}
                  <div
                    className={`cc-field${errors.subjectId && touched.subjectId ? ' cc-field--error' : ''}`}
                    ref={el => { errRefs.current.subjectId = el }}>
                    <label className="cc-label">과목 <span className="cc-req">필수</span></label>
                    {subjectsLoading ? (
                      <div className="cc-skeleton" />
                    ) : subjectError ? (
                      <p className="cc-field__err">⚠ 과목 목록을 불러오지 못했어요</p>
                    ) : (
                      <select className="select" value={form.subjectId}
                        onChange={e => set('subjectId', Number(e.target.value))}
                        onBlur={() => blur('subjectId')}>
                        {subjects.map(s => (
                          <option key={s.subjectId} value={s.subjectId}>{s.name}</option>
                        ))}
                      </select>
                    )}
                    {errors.subjectId && touched.subjectId &&
                      <span className="cc-field__err">⚠ {errors.subjectId}</span>}
                  </div>

                  {/* 사용 교재 */}
                  <div className="cc-field">
                    <label className="cc-label">사용 교재</label>
                    <input className="input" value={form.textbook}
                      onChange={e => set('textbook', e.target.value)}
                      placeholder="예: 수능 기출 + 자체 자료" />
                  </div>

                  {/* 대상 학년 */}
                  <div className="cc-field">
                    <label className="cc-label">대상 학년 <span className="cc-req">필수</span></label>
                    <select className="select" value={form.targetGrade}
                      onChange={e => set('targetGrade', e.target.value)}>
                      {Object.entries(GRADE_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Block 2: 수업 방식 ── */}
              <div className="cc-block">
                <div className="cc-block__header">
                  <span className="cc-block__badge">2</span>
                  <div>
                    <h2>수업 방식</h2>
                    <p className="cc-desc">진행 형태와 커리큘럼 유형을 선택해주세요</p>
                  </div>
                </div>

                <div className="cc-field">
                  <label className="cc-label">진행 형태</label>
                  <div className="cc-opt-cards">
                    {[
                      { ic: '🤝', label: '1:1 개인',  sub: '맞춤 집중 지도', val: 1  },
                      { ic: '👥', label: '소그룹',    sub: '2~6명 함께',      val: 6  },
                      { ic: '🏛️', label: '대형 강의', sub: '7명 이상',         val: 20 },
                    ].map(({ ic, label, sub, val }) => {
                      const isOn =
                        (val === 1  && form.maxStudents === 1) ||
                        (val === 6  && form.maxStudents > 1 && form.maxStudents <= 6) ||
                        (val === 20 && form.maxStudents > 6)
                      return (
                        <div key={label} className={`cc-opt-card${isOn ? ' on' : ''}`}
                          onClick={() => set('maxStudents', val)}
                          role="button" aria-pressed={isOn}>
                          <div className="cc-opt-card__ic">{ic}</div>
                          <b>{label}</b>
                          <small>{sub}</small>
                          {isOn && <span className="cc-opt-card__check">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {form.maxStudents > 1 && (
                  <div className="cc-field cc-field--inline">
                    <label className="cc-label">최대 정원</label>
                    <div className="cc-num-input">
                      <button type="button" className="cc-num-btn"
                        onClick={() => set('maxStudents', Math.max(2, form.maxStudents - 1))}>−</button>
                      <input type="number" className="input cc-num-val"
                        min={2} max={200} value={form.maxStudents}
                        onChange={e => set('maxStudents', Math.max(2, Number(e.target.value)))} />
                      <button type="button" className="cc-num-btn"
                        onClick={() => set('maxStudents', Math.min(200, form.maxStudents + 1))}>+</button>
                      <span className="cc-num-unit">명</span>
                    </div>
                  </div>
                )}

                <div className="cc-field" style={{ marginBottom: 0 }}>
                  <label className="cc-label">커리큘럼 유형 <span className="cc-req">필수</span></label>
                  <div className="cc-opts">
                    {[
                      { key: 'CUSTOM', label: '🎯 학생 수준 맞춤', desc: '학생에 따라 유연하게 운영' },
                      { key: 'FIXED',  label: '📚 정해진 커리큘럼', desc: '일관된 진도로 진행' },
                    ].map(({ key, label, desc }) => (
                      <div key={key}
                        className={`cc-opt-pill${form.curriculumType === key ? ' on' : ''}`}
                        onClick={() => set('curriculumType', key)}>
                        <span className="cc-opt-pill__label">{label}</span>
                        <span className="cc-opt-pill__desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Block 3: 일정·정원 ── */}
              <div className="cc-block">
                <div className="cc-block__header">
                  <span className="cc-block__badge">3</span>
                  <div>
                    <h2>일정 · 정원</h2>
                    <p className="cc-desc">수업 요일과 시간, 모집 정원을 정해주세요</p>
                  </div>
                </div>

                <div className="cc-field">
                  <label className="cc-label">수업 요일
                    {selectedDays.length > 0 &&
                      <span className="cc-badge-selected">{selectedDays.join(' · ')}</span>}
                  </label>
                  <div className="cc-days">
                    {DAYS.map((d, i) => (
                      <div key={d}
                        className={`cc-day${selectedDays.includes(d) ? ' on' : ''}${i >= 5 ? ' weekend' : ''}`}
                        onClick={() => toggleDay(d)}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cc-row3">
                  <div className="cc-field">
                    <label className="cc-label">수업 시작 시간</label>
                    <input className="input" type="time" value={classTime}
                      onChange={e => setClassTime(e.target.value)} />
                  </div>
                  <div className="cc-field">
                    <label className="cc-label">회당 시간 <span className="cc-req">필수</span></label>
                    <select className="select" value={form.durationMinutes}
                      onChange={e => set('durationMinutes', Number(e.target.value))}>
                      {DURATION_OPTIONS.map(d => (
                        <option key={d} value={d}>
                          {d}분 ({Math.floor(d / 60) > 0 ? Math.floor(d / 60) + '시간 ' : ''}{d % 60 > 0 ? d % 60 + '분' : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cc-field">
                    <label className="cc-label">모집 정원</label>
                    <div className="cc-num-input">
                      <button type="button" className="cc-num-btn"
                        onClick={() => set('maxStudents', Math.max(1, form.maxStudents - 1))}>−</button>
                      <input type="number" className="input cc-num-val" min={1} max={200}
                        value={form.maxStudents}
                        onChange={e => set('maxStudents', Math.max(1, Number(e.target.value)))} />
                      <button type="button" className="cc-num-btn"
                        onClick={() => set('maxStudents', Math.min(200, form.maxStudents + 1))}>+</button>
                      <span className="cc-num-unit">명</span>
                    </div>
                  </div>
                </div>

                <div className="cc-row2" style={{ marginTop: 0 }}>
                  <div className="cc-field" style={{ marginBottom: 0 }}>
                    <label className="cc-label">수업 시작일</label>
                    <input className="input" type="date" value={form.startDate}
                      onChange={e => set('startDate', e.target.value)} />
                  </div>
                  <div className="cc-field" style={{ marginBottom: 0 }}>
                    <label className="cc-label">모집 마감일</label>
                    <input className="input" type="date" value={form.recruitDeadline}
                      onChange={e => set('recruitDeadline', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ── Block 4: 가격·소개 ── */}
              <div className="cc-block">
                <div className="cc-block__header">
                  <span className="cc-block__badge">4</span>
                  <div>
                    <h2>가격 · 소개</h2>
                    <p className="cc-desc">수업료와 수업 소개를 작성해주세요</p>
                  </div>
                </div>

                {/* 가격 */}
                <div
                  className={`cc-field${errors.price && touched.price ? ' cc-field--error' : ''}`}
                  ref={el => { errRefs.current.price = el }}>
                  <label className="cc-label">
                    회당 수업료 <span className="cc-req">필수</span>
                    <span className="cc-muted">0원 입력 시 무료 수업으로 등록됩니다</span>
                  </label>
                  <div className="cc-price-wrap">
                    <input className="input" type="number" min={0} step={1000}
                      value={form.pricePerSession}
                      onChange={e => set('pricePerSession', Math.max(0, Number(e.target.value)))}
                      onBlur={() => blur('price')} />
                    <span className="cc-price-unit">원</span>
                  </div>
                  {form.pricePerSession > 0 &&
                    <div className="cc-price-display">💰 {formattedPrice}원 / 1회</div>}
                  {errors.price && touched.price &&
                    <span className="cc-field__err">⚠ {errors.price}</span>}
                </div>

                {/* 수업 소개 */}
                <div className="cc-field">
                  <label className="cc-label">수업 소개</label>
                  <textarea className="textarea" rows={5}
                    value={form.description} maxLength={DESC_MAX}
                    onChange={e => set('description', e.target.value)}
                    placeholder="수업 특징, 진행 방식, 학생에게 기대하는 점을 자유롭게 적어주세요" />
                  <div className="cc-field__footer">
                    <span />
                    <span className={`cc-counter${form.description.length > DESC_MAX * 0.9 ? ' cc-counter--warn' : ''}`}>
                      {form.description.length}/{DESC_MAX}
                    </span>
                  </div>
                </div>

                {/* 커리큘럼 상세 */}
                <div className="cc-field" style={{ marginBottom: 0 }}>
                  <label className="cc-label">커리큘럼 상세 <span className="cc-muted">(선택)</span></label>
                  <textarea className="textarea" rows={4}
                    value={form.curriculumDetail}
                    onChange={e => set('curriculumDetail', e.target.value)}
                    placeholder="주차별 학습 계획, 사용 자료 등" />
                </div>
              </div>

              {/* 공개 설정 배너 */}
              <div className="cc-notice">
                <span className="cc-notice__ic">✅</span>
                <span>등록 즉시 모집이 시작되고 검색에 노출됩니다</span>
              </div>

              {/* 제출 */}
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

            {/* ── 실시간 미리보기 ── */}
            <aside className="cc-preview">
              <p className="cc-preview__label">📱 카드 미리보기</p>

              <div className="cc-preview-card">
                <div className="cc-preview-card__top bg2">
                  <div className="cc-preview-card__badges">
                    <span className="cc-badge-new">🆕 신규</span>
                  </div>
                  <div className="cc-preview-card__display">
                    <span className="cc-preview-card__subject">{subjectName}</span>
                    <span className="cc-preview-card__accent">{gradeLabel}</span>
                  </div>
                </div>
                <div className="cc-preview-card__body">
                  <div className="cc-preview-card__chips">
                    <span className="badge badge--sky">{subjectName}</span>
                    <span className="badge badge--butter">{gradeLabel}</span>
                    <span className="badge badge--mint">{modeLabel}</span>
                  </div>
                  <div className="cc-preview-card__title">{previewTitle}</div>
                  <div className="cc-preview-card__foot">
                    <span className="cc-preview-card__new">🆕 신규 등록</span>
                    <strong className="cc-preview-card__price">
                      {form.pricePerSession > 0 ? `${formattedPrice}원` : '무료'}
                    </strong>
                  </div>
                </div>
              </div>

              <p className="cc-hint" style={{ marginTop: 10 }}>학생 검색 화면에 이렇게 보여요</p>

              <div className="cc-summary">
                <div className="cc-summary__row">
                  <span>과목</span><strong>{subjectName}</strong>
                </div>
                <div className="cc-summary__row">
                  <span>학년</span><strong>{gradeLabel}</strong>
                </div>
                <div className="cc-summary__row">
                  <span>형태</span><strong>{modeLabel} · {form.durationMinutes}분</strong>
                </div>
                {selectedDays.length > 0 && (
                  <div className="cc-summary__row">
                    <span>요일</span><strong>{selectedDays.join(', ')} {classTime}</strong>
                  </div>
                )}
                <div className="cc-summary__row">
                  <span>수업료</span>
                  <strong className="cc-summary__price">
                    {form.pricePerSession > 0 ? `${formattedPrice}원` : '무료'}
                  </strong>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* 완료 모달 */}
      {done && (
        <div className="cc-done-back">
          <div className="cc-done-modal" onClick={e => e.stopPropagation()}>
            <div className="cc-done-modal__emoji">🎉</div>
            <h3 className="cc-done-modal__title">수업이 등록되었어요!</h3>
            <p className="cc-done-modal__sub">
              검토 없이 바로 모집이 시작됩니다.<br />
              학생들이 곧 신청을 보내올 거예요 ✨
            </p>
            <div className="cc-done-modal__actions">
              <button className="btn btn--coral btn--lg"
                onClick={() => navigate('/courses')}>
                수업 검색에서 확인하기
              </button>
              <button className="btn btn--ghost" onClick={resetForm}>
                수업 하나 더 등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
