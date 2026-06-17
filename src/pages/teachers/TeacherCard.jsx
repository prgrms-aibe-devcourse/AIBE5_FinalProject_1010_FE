import { Link } from 'react-router-dom'
import { getNaegongTier } from '../../utils/naegong.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { LocationPinIcon, VerifiedBadgeIcon } from '../../components/icons/SearchIcons.jsx'

const COLORS = ['ac1', 'ac2', 'ac3', 'ac4', 'ac5', 'ac6']

export default function TeacherCard({ teacher }) {
  const {
    id, name, profileImageUrl, career, major, admissionYear,
    naegongScore, courseCount, address, totalTeachingHours, specialtySubjects, verified,
  } = teacher
  const tier  = getNaegongTier(naegongScore)
  const color = COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length]
  // 대학교 · 전공 · 학번 조합 (입력된 값만 노출)
  const academic = [career, major, admissionYear].filter(Boolean).join(' · ')
  const specialties = specialtySubjects ?? []
  const teachingHours = totalTeachingHours != null ? Math.floor(Number(totalTeachingHours)) : 0

  return (
    <Link to={`/teachers/${id}`} className="ltc-card">

      {/* 아바타 */}
      <div className={`tc-avatar ${color} ltc-avatar`}>
        {profileImageUrl
          ? <img src={toAbsoluteFileUrl(profileImageUrl)} alt={name} />
          : (name?.[0] ?? '선')
        }
      </div>

      {/* 이름 + 학력 + 전문과목·지역 */}
      <div className="ltc-body">
        <p className="ltc-name">
          {name}<span className="tc-name-suffix"> 선생님</span>
          {verified && (
            <span className="tc-verified-badge ltc-verified" title="인증 선생님">
              <VerifiedBadgeIcon size={15} />
            </span>
          )}
        </p>
        <p className={`ltc-career${!academic ? ' ltc-career--empty' : ''}`}>
          {academic || '아직 대학교 정보를 입력하지 않았어요'}
        </p>

        {(specialties.length > 0 || address) && (
          <div className="ltc-tags">
            {specialties.map((s) => (
              <span key={s} className="ltc-tag">{s}</span>
            ))}
            {address && (
              <span className="ltc-region">
                <LocationPinIcon size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                {address}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 스탯 */}
      <div className="ltc-aside">
        <div className="tc-stat">
          <span className="tc-stat__val">{courseCount}</span>
          <span className="tc-stat__lbl">강의</span>
        </div>
        <div className="tc-stat-rule" />
        <div className="tc-stat">
          <span className="tc-stat__val">{teachingHours.toLocaleString('ko-KR')}</span>
          <span className="tc-stat__lbl">수업시간</span>
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
