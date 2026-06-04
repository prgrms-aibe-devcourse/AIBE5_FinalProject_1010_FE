const DESC_MAX = 500

export default function CourseFormPrice({ form, set, blur, errors, touched, errRefs }) {
  const formattedPrice = Number(form.pricePerSession).toLocaleString('ko-KR')

  return (
    <div className="cc-block">
      <div className="cc-block__header">
        <span className="cc-block__badge">4</span>
        <div>
          <h2>가격 · 소개</h2>
          <p className="cc-desc">수업료와 수업 소개를 작성해주세요</p>
        </div>
      </div>

      {/* 수업료 */}
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
  )
}
