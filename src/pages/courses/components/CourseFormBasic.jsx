import { GRADE_LABEL } from '../../../utils/labels.js'

const TITLE_MAX = 60

export default function CourseFormBasic({
  form, set, blur, errors, touched,
  subjects, subjectsLoading, subjectError,
  errRefs,
}) {
  return (
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
              onChange={e => set('subjectId', e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => blur('subjectId')}>
              <option value="">과목을 선택해주세요</option>
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
        <div
          className={`cc-field${errors.targetGrade && touched.targetGrade ? ' cc-field--error' : ''}`}
          ref={el => { errRefs.current.targetGrade = el }}>
          <label className="cc-label">대상 학년 <span className="cc-req">필수</span></label>
          <select className="select" value={form.targetGrade}
            onChange={e => set('targetGrade', e.target.value)}
            onBlur={() => blur('targetGrade')}>
            <option value="">학년을 선택해주세요</option>
            {Object.entries(GRADE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {errors.targetGrade && touched.targetGrade &&
            <span className="cc-field__err">⚠ {errors.targetGrade}</span>}
        </div>
      </div>
    </div>
  )
}
