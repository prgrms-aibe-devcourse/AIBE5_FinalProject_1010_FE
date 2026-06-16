import CourseFormBasic    from './CourseFormBasic.jsx'
import CourseFormMethod   from './CourseFormMethod.jsx'
import CourseFormSchedule from './CourseFormSchedule.jsx'
import CourseFormPrice    from './CourseFormPrice.jsx'

export default function CourseFormContainer({
  form, set, blur, toggleDay,
  selectedDays, classTime, setClassTime,
  subjects, subjectsLoading, subjectError,
  errors, touched, errRefs,
  submitting, apiError,
  onSubmit,
  submitLabel = '저장',
  onCancel,
  notice,
  teacherAddress,
}) {
  return (
    <div className="cc-layout cc-layout--no-preview">
      <form onSubmit={onSubmit} noValidate>
        <CourseFormBasic
          form={form} set={set} blur={blur}
          errors={errors} touched={touched}
          subjects={subjects}
          subjectsLoading={subjectsLoading}
          subjectError={subjectError}
          errRefs={errRefs}
        />
        <CourseFormMethod
          form={form} set={set} errors={errors} touched={touched} errRefs={errRefs}
          teacherAddress={teacherAddress}
        />
        <CourseFormSchedule
          form={form} set={set} blur={blur}
          errors={errors} touched={touched}
          selectedDays={selectedDays} toggleDay={toggleDay}
          classTime={classTime} setClassTime={setClassTime}
          errRefs={errRefs}
        />
        <CourseFormPrice
          form={form} set={set} blur={blur}
          errors={errors} touched={touched}
          errRefs={errRefs}
        />

        {apiError && (
          <p className="cc-api-error" role="alert">{apiError}</p>
        )}

        {notice && (
          <div className="cc-notice">
            <span className="cc-notice__ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
            <span>{notice}</span>
          </div>
        )}

        <div className="cc-actions">
          <button type="button" className="btn btn--ghost btn--lg cc-actions__cancel" onClick={onCancel}>
            취소
          </button>
          <button type="submit" className="btn btn--coral btn--lg cc-actions__submit" disabled={submitting}>
            {submitting ? <><span className="cc-spinner" /> 저장 중...</> : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
