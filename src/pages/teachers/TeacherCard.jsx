/**
 * @file TeacherCard.jsx
 * @description 선생님 목록 카드 컴포넌트입니다.
 * - TeacherCardResponse DTO의 필드를 그대로 받아 렌더링합니다.
 * - 클릭 시 /teachers/:id 상세 페이지로 이동합니다.
 */
import { Link } from 'react-router-dom'
import { getNaegongTier } from '../../utils/naegong.js'

const AVATAR_COLORS = ['ac1', 'ac2', 'ac3', 'ac4', 'ac5', 'ac6']

export default function TeacherCard({ teacher }) {
  const { id, name, profileImageUrl, education, career, naegongScore, courseCount } = teacher
  const tier  = getNaegongTier(naegongScore)
  const color = AVATAR_COLORS[Number(id) % AVATAR_COLORS.length]

  return (
    <Link to={`/teachers/${id}`} className="teacher-card">
      <div className="teacher-card__header">
        <div className={`tc-avatar ${color}`}>
          {profileImageUrl
            ? <img src={profileImageUrl} alt={name} />
            : (name?.[0] ?? '선')
          }
        </div>
        <div className="teacher-card__meta">
          <div className="teacher-card__name">{name}</div>
          <div className="teacher-card__education">{education || '학력 정보 없음'}</div>
        </div>
      </div>

      {career && <p className="teacher-card__career">{career}</p>}

      <div className="teacher-card__footer">
        <div className="teacher-card__courses">
          <span>📚</span> 강의 {courseCount}개
        </div>
        <span className={`naegong-badge ${tier.cls}`}>
          내공 {naegongScore} · {tier.label}
        </span>
      </div>
    </Link>
  )
}
