const MODES = [
  { ic: '🤝', label: '1:1 개인',  sub: '맞춤 집중 지도', val: 1  },
  { ic: '👥', label: '소그룹',    sub: '2~6명 함께',      val: 6  },
  { ic: '🏛️', label: '대형 강의', sub: '7명 이상',         val: 20 },
]

function activeMode(maxStudents) {
  if (maxStudents <= 1)  return 1
  if (maxStudents <= 6)  return 6
  return 20
}

export default function CourseFormMethod({ form, set, errors, touched }) {
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

  return (
    <div className="cc-block">
      <div className="cc-block__header">
        <span className="cc-block__badge">2</span>
        <div>
          <h2>수업 방식</h2>
          <p className="cc-desc">선호하는 진행 형태와 커리큘럼 유형을 선택해주세요</p>
        </div>
      </div>

      {/* 진행 형태 — 카드는 범위 타입만 표시, 실제 정원은 Block 3 스테퍼에서 */}
      <div className="cc-field">
        <label className="cc-label">희망 진행 형태</label>
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
              {current === val && <span className="cc-opt-card__check">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 커리큘럼 유형 */}
      <div
        className={`cc-field${errors?.curriculumType && touched?.curriculumType ? ' cc-field--error' : ''}`}
        style={{ marginBottom: 0 }}>
        <label className="cc-label">커리큘럼 유형 <span className="cc-req">필수</span></label>
        <div className="cc-opts">
          {[
            { key: 'CUSTOM', label: '🎯 학생 수준 맞춤', desc: '학생에 따라 유연하게 운영' },
            { key: 'FIXED',  label: '📚 정해진 커리큘럼', desc: '일관된 진도로 진행' },
          ].map(({ key, label, desc }) => (
            <div key={key}
              className={`cc-opt-pill${form.curriculumType === key ? ' on' : ''}`}
              onClick={() => set('curriculumType', key)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && set('curriculumType', key)}
              role="button"
              tabIndex={0}
              aria-pressed={form.curriculumType === key}>
              <span className="cc-opt-pill__label">{label}</span>
              <span className="cc-opt-pill__desc">{desc}</span>
            </div>
          ))}
        </div>
        {errors?.curriculumType && touched?.curriculumType && (
          <span className="cc-field__err" style={{ marginTop: 6 }}>⚠ {errors.curriculumType}</span>
        )}
      </div>
    </div>
  )
}
