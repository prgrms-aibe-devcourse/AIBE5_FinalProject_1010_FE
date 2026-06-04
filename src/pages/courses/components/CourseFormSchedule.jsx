const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const DURATION_OPTIONS = [60, 90, 120, 150, 180]

export default function CourseFormSchedule({
  form, set, blur, errors, touched,
  selectedDays, toggleDay, classTime, setClassTime,
}) {
  return (
    <div className="cc-block">
      <div className="cc-block__header">
        <span className="cc-block__badge">3</span>
        <div>
          <h2>일정 · 정원</h2>
          <p className="cc-desc">수업 요일과 시간, 모집 정원을 정해주세요</p>
        </div>
      </div>

      {/* 수업 요일 */}
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
        {/* 시작 시간 */}
        <div className="cc-field">
          <label className="cc-label">수업 시작 시간</label>
          <input className="input" type="time" value={classTime}
            onChange={e => setClassTime(e.target.value)} />
        </div>

        {/* 회당 시간 */}
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

        {/* 모집 정원 */}
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

      {/* 날짜 */}
      <div className="cc-row2" style={{ marginTop: 0 }}>
        <div className={`cc-field${errors.startDate && touched.startDate ? ' cc-field--error' : ''}`}
          style={{ marginBottom: 0 }}>
          <label className="cc-label">수업 시작일</label>
          <input className="input" type="date" value={form.startDate}
            onChange={e => set('startDate', e.target.value)}
            onBlur={() => blur('startDate')} />
          {errors.startDate && touched.startDate &&
            <span className="cc-field__err">⚠ {errors.startDate}</span>}
        </div>

        <div className={`cc-field${errors.recruitDeadline && touched.recruitDeadline ? ' cc-field--error' : ''}`}
          style={{ marginBottom: 0 }}>
          <label className="cc-label">모집 마감일</label>
          <input className="input" type="date" value={form.recruitDeadline}
            onChange={e => set('recruitDeadline', e.target.value)}
            onBlur={() => blur('recruitDeadline')} />
          {errors.recruitDeadline && touched.recruitDeadline &&
            <span className="cc-field__err">⚠ {errors.recruitDeadline}</span>}
        </div>
      </div>
    </div>
  )
}
