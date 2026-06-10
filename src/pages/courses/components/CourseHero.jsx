export default function CourseHero({ title, subjectName, gradeLabel, durationMinutes }) {
  return (
    <div className="cd-hero">
      <div className="cd-hero__top">
        {subjectName && <p className="cd-hero__subject">{subjectName}</p>}
        <h1 className="cd-title">{title}</h1>
        <div className="cd-chips">
          {gradeLabel      && <span className="cd-chip cd-chip--grade">{gradeLabel}</span>}
          {durationMinutes && <span className="cd-chip">회당 {durationMinutes}분</span>}
        </div>
      </div>
    </div>
  )
}
