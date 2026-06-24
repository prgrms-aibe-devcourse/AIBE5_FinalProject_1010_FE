import { toAbsoluteFileUrl } from '../../../api/fileApi.js'
import { VerifiedBadgeIcon } from '../../../components/icons/SearchIcons.jsx'

const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']

export default function TeacherHero({ teacher, id, onInquiry }) {
  const { name, profileImageUrl, verified } = teacher

  const idx         = Number(id) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[idx], color: AVATAR_COLOR[idx] }
  const specialties = teacher.specialtySubjects ?? []

  return (
    <div className="td-hero">
      <div className="td-hero__avatar" style={profileImageUrl ? {} : avatarStyle}>
        {profileImageUrl ? <img src={toAbsoluteFileUrl(profileImageUrl)} alt={name} /> : (name?.[0] ?? '선')}
      </div>

      <div className="td-hero__body">
        <div className="td-hero__top">
          <span className="td-hero__name">{name} 선생님</span>
          {verified && (
            <span className="tc-verified-badge td-hero__verified" aria-label="인증 선생님">
              <VerifiedBadgeIcon size={18} />
            </span>
          )}
        </div>
        {specialties.length > 0 && (
          <div className="td-hero__chips">
            {specialties.map(s => <span key={s} className="td-hero__chip">{s}</span>)}
          </div>
        )}
      </div>

      <div className="td-hero__actions">
        <button className="td-hero__btn td-hero__btn--primary" onClick={onInquiry}>문의하기</button>
      </div>
    </div>
  )
}
