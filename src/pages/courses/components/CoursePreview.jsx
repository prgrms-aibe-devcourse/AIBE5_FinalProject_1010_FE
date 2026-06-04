import { GRADE_LABEL } from '../../../utils/labels.js'

export default function CoursePreview({ form, subjects, selectedDays, classTime }) {
  const subjectName  = subjects.find(s => s.subjectId === Number(form.subjectId))?.name ?? '과목'
  const gradeLabel   = GRADE_LABEL[form.targetGrade] ?? form.targetGrade
  const modeLabel    = form.maxStudents <= 1 ? '1:1' : form.maxStudents <= 6 ? '소그룹' : '대형'
  const previewTitle = form.title.trim() || '수업 제목을 입력하세요'
  const formattedPrice = Number(form.pricePerSession).toLocaleString('ko-KR')

  return (
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
  )
}
