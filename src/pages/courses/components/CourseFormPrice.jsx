const DESC_MAX = 500

export default function CourseFormPrice({ form, set, blur, errors, touched, errRefs }) {
  const formattedPrice = Number(form.pricePerSession).toLocaleString('ko-KR')

  return (
    <div className="cc-block">
      <div className="cc-block__header">
        <span className="cc-block__badge">4</span>
        <div>
          <h2>희망 가격 · 소개</h2>
          <p className="cc-desc">희망 수업료를 알려주세요. 학생과 상담 후 조율할 수 있어요.</p>
        </div>
      </div>

      {/* 수업료 */}
      <div
        className={`cc-field${errors.pricePerSession && touched.pricePerSession ? ' cc-field--error' : ''}`}
        ref={el => { errRefs.current.pricePerSession = el }}>
        <label className="cc-label">
          수업료 <span className="cc-req">필수</span>
          <span className="cc-muted">상담 후 조율 가능 · 0원은 무료</span>
        </label>
        <div className="cc-price-wrap">
          <input className="cc-input" type="number" min={0} step={1000}
            value={form.pricePerSession}
            onChange={e => {
              const val = e.target.value.replace(/^0+(?=\d)/, '')
              set('pricePerSession', val === '' ? 0 : Math.max(0, Number(val)))
            }}
            onBlur={() => blur('pricePerSession')} />
          <span className="cc-price-unit">원</span>
        </div>
        {form.pricePerSession > 0 &&
          <div className="cc-price-display">{formattedPrice}원 / 1회</div>}
        {errors.pricePerSession && touched.pricePerSession &&
          <span className="cc-field__err">⚠ {errors.pricePerSession}</span>}
      </div>

      {/* 수업 소개 */}
      <div className="cc-field">
        <label className="cc-label">수업 소개 <span className="cc-muted">(선택)</span></label>
        <textarea className="cc-textarea" rows={5}
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
        <textarea className="cc-textarea" rows={4}
          value={form.curriculumDetail}
          onChange={e => set('curriculumDetail', e.target.value)}
          placeholder="주차별 학습 계획, 사용 자료 등" />
      </div>
    </div>
  )
}
