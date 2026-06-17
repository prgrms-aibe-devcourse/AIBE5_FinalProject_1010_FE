import KakaoMapPicker from './KakaoMapPicker.jsx'

const IcPerson = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

const IcUsers = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IcPresentation = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h20"/>
    <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/>
    <path d="m7 21 5-5 5 5"/>
  </svg>
)

const IcMonitor = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8"/>
    <path d="M12 17v4"/>
  </svg>
)

const IcMapPin = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IcSliders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="4" x2="14" y2="4"/>
    <line x1="10" y1="4" x2="3" y2="4"/>
    <line x1="21" y1="12" x2="12" y2="12"/>
    <line x1="8" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="20" x2="16" y2="20"/>
    <line x1="12" y1="20" x2="3" y2="20"/>
    <line x1="14" y1="2" x2="14" y2="6"/>
    <line x1="8" y1="10" x2="8" y2="14"/>
    <line x1="16" y1="18" x2="16" y2="22"/>
  </svg>
)

const IcBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const MODES = [
  { ic: <IcPerson />,       label: '1:1 개인',  sub: '맞춤 집중 지도', val: 1  },
  { ic: <IcUsers />,        label: '소그룹',    sub: '2~6명 함께',      val: 6  },
  { ic: <IcPresentation />, label: '대형 강의', sub: '7명 이상',         val: 20 },
]

const TEACHING_MODES = [
  { val: 'ONLINE',  ic: <IcMonitor />, label: '비대면', sub: '화상·온라인 수업' },
  { val: 'OFFLINE', ic: <IcMapPin />,  label: '대면',   sub: '직접 만나서 수업' },
]

const CURRICULUM_OPTS = [
  { key: 'CUSTOM', ic: <IcSliders />, label: '학생 수준 맞춤', desc: '학생에 따라 유연하게 운영' },
  { key: 'FIXED',  ic: <IcBook />,   label: '정해진 커리큘럼', desc: '일관된 진도로 진행' },
]

function activeMode(maxStudents) {
  if (!maxStudents)      return null
  if (maxStudents <= 1)  return 1
  if (maxStudents <= 6)  return 6
  return 20
}

export default function CourseFormMethod({ form, set, errors, touched, errRefs, teacherAddress }) {
  function pickMode(val) {
    if (val === 1) {
      set('maxStudents', 1)
    } else if (val === 6) {
      if (form.maxStudents < 2 || form.maxStudents > 6) set('maxStudents', 2)
    } else {
      if (form.maxStudents < 7) set('maxStudents', 7)
    }
  }

  const current = activeMode(form.maxStudents)

  function handleMapChange({ address, lat, lng }) {
    set('location',    address)
    set('locationLat', lat)
    set('locationLng', lng)
  }

  return (
    <div className="cc-block">
      <div className="cc-block__header">
        <span className="cc-block__badge">2</span>
        <div>
          <h2>수업 방식</h2>
          <p className="cc-desc">선호하는 진행 형태와 커리큘럼 유형을 선택해주세요</p>
        </div>
      </div>

      {/* 비대면 / 대면 */}
      <div className="cc-field" ref={el => { errRefs.current.teachingMode = el }}>
        <label className="cc-label">수업 형태 <span className="cc-req">필수</span></label>
        <div className="cc-opt-cards cc-opt-cards--2">
          {TEACHING_MODES.map(({ val, ic, label, sub }) => (
            <div key={val}
              className={`cc-opt-card${form.teachingMode === val ? ' on' : ''}`}
              onClick={() => set('teachingMode', val)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && set('teachingMode', val)}
              role="button"
              tabIndex={0}
              aria-pressed={form.teachingMode === val}>
              <div className="cc-opt-card__ic">{ic}</div>
              <b>{label}</b>
              <small>{sub}</small>
              {form.teachingMode === val && <span className="cc-opt-card__check"><IcCheck /></span>}
            </div>
          ))}
        </div>
        {errors?.teachingMode && touched?.teachingMode && (
          <span className="cc-field__err" style={{ marginTop: 6 }}>⚠ {errors.teachingMode}</span>
        )}
      </div>

      {/* 대면 선택 시 카카오맵 위치 설정 */}
      {form.teachingMode === 'OFFLINE' && (
        <div className="cc-field cc-field--map">
          <label className="cc-label">
            수업 장소
            {teacherAddress && (
              <span className="cc-label-hint"> — 마이페이지 지역({teacherAddress})이 기본 표시됩니다</span>
            )}
          </label>
          <KakaoMapPicker
            defaultAddress={form.location || teacherAddress}
            onChange={handleMapChange}
          />
        </div>
      )}

      {/* 커리큘럼 유형 */}
      <div
        className={`cc-field${errors?.curriculumType && touched?.curriculumType ? ' cc-field--error' : ''}`}
        ref={el => { errRefs.current.curriculumType = el }}>
        <label className="cc-label">커리큘럼 유형 <span className="cc-req">필수</span></label>
        <div className="cc-opt-cards cc-opt-cards--2">
          {CURRICULUM_OPTS.map(({ key, ic, label, desc }) => (
            <div key={key}
              className={`cc-opt-card${form.curriculumType === key ? ' on' : ''}`}
              onClick={() => set('curriculumType', key)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && set('curriculumType', key)}
              role="button"
              tabIndex={0}
              aria-pressed={form.curriculumType === key}>
              <div className="cc-opt-card__ic">{ic}</div>
              <b>{label}</b>
              <small>{desc}</small>
              {form.curriculumType === key && <span className="cc-opt-card__check"><IcCheck /></span>}
            </div>
          ))}
        </div>
        {errors?.curriculumType && touched?.curriculumType && (
          <span className="cc-field__err" style={{ marginTop: 6 }}>⚠ {errors.curriculumType}</span>
        )}
      </div>

      {/* 진행 형태 */}
      <div className="cc-field" style={{ marginBottom: 0 }} ref={el => { errRefs.current.maxStudents = el }}>
        <label className="cc-label">희망 진행 형태 <span className="cc-req">필수</span></label>
        <div className="cc-opt-cards">
          {MODES.map(({ ic, label, sub, val }) => (
            <div key={label}
              className={`cc-opt-card${current === val ? ' on' : ''}`}
              onClick={() => pickMode(val)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pickMode(val)}
              role="button"
              tabIndex={0}
              aria-pressed={current === val}>
              <div className="cc-opt-card__ic">{ic}</div>
              <b>{label}</b>
              <small>{sub}</small>
              {current === val && <span className="cc-opt-card__check"><IcCheck /></span>}
            </div>
          ))}
        </div>
        {errors?.maxStudents && touched?.maxStudents && (
          <span className="cc-field__err" style={{ marginTop: 6 }}>⚠ {errors.maxStudents}</span>
        )}
      </div>
    </div>
  )
}
