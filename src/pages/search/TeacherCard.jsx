import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function TeacherCard({ data: t }) {
  return (
    <article className="teacher-card">
      <div className="teacher-card-header">
        <Avatar size="lg" color={t.avatar}>{t.initial}</Avatar>
        <div className="tc-info">
          <div className="tc-name">{t.name} 선생님</div>
          <div className="tc-subject">{t.subject}</div>
          <div className="tc-school">{t.school}</div>
        </div>
        <div className="tc-rank">내공 {t.rank.toLocaleString()}</div>
      </div>

      <div className="teacher-card-body">
        <div className="tc-detail">{t.detailSubject}</div>
        <div className="tc-intro">{t.intro}</div>
        <div className="tc-tags">
          {t.tags.map((tag) => (
            <Badge key={tag} variant="sky">#{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="teacher-card-stats">
        <div className="tc-stat">
          <span className="tc-stat-val stars">★ {t.rating}</span>
          <span className="tc-stat-label">평점</span>
        </div>
        <div className="tc-stat">
          <span className="tc-stat-val">{t.students.toLocaleString()}</span>
          <span className="tc-stat-label">수강생</span>
        </div>
        <div className="tc-stat">
          <span className="tc-stat-val">{t.years}년</span>
          <span className="tc-stat-label">경력</span>
        </div>
      </div>
    </article>
  )
}
