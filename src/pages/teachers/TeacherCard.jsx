import { Link } from 'react-router-dom'
import { getNaegongTier } from '../../utils/naegong.js'

const COLORS = ['ac1', 'ac2', 'ac3', 'ac4', 'ac5', 'ac6']

export default function TeacherCard({ teacher }) {
  const { id, name, profileImageUrl, education, career, naegongScore, courseCount } = teacher
  const tier  = getNaegongTier(naegongScore)
  const color = COLORS[Number(id) % COLORS.length]

  return (
    <Link to={`/teachers/${id}`} className="teacher-card">

      {/* 상단: 아바타 + 이름/학력 */}
      <div className="teacher-card__top">
        <div className={`tc-avatar ${color}`}>
          {profileImageUrl
            ? <img src={profileImageUrl} alt={name} />
            : (name?.[0] ?? '선')
          }
        </div>
        <div className="teacher-card__info">
          <p className="teacher-card__name">
            {name}<span className="tc-name-suffix"> 선생님</span>
          </p>
          <p className="teacher-card__edu">
            {education || '학력 정보 없음'}
          </p>
        </div>
      </div>

      {/* 경력 */}
      <p className={`teacher-card__career${!career ? ' teacher-card__career--empty' : ''}`}>
        {career || '아직 경력 정보를 입력하지 않았어요'}
      </p>

      {/* 스탯 */}
      <div className="teacher-card__footer">
        <div className="tc-stat">
          <span className="tc-stat__val">{courseCount}</span>
          <span className="tc-stat__lbl">강의</span>
        </div>
        <div className="tc-stat-rule" />
        <div className="tc-stat">
          <span className="tc-stat__val">{naegongScore}</span>
          <span className="tc-stat__lbl">내공</span>
        </div>
        <span className={`tc-tier-badge ${tier.cls}`}>{tier.label}</span>
      </div>

    </Link>
  )
}
