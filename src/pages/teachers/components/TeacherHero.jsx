const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']

export default function TeacherHero({ teacher, id, onInquiry }) {
  const { name, profileImageUrl, education, career } = teacher

  const idx         = Number(id) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[idx], color: AVATAR_COLOR[idx] }
  const isTop       = teacher.isTop === true

  const careerFirst = career?.split(/[·,\n]/)[0]?.trim()

  return (
    <div className="td-hero">
      <div className="td-hero__avatar" style={profileImageUrl ? {} : avatarStyle}>
        {profileImageUrl ? <img src={profileImageUrl} alt={name} /> : (name?.[0] ?? '선')}
      </div>

      <div className="td-hero__body">
        <div className="td-hero__top">
          <span className="td-hero__name">{name} 선생님</span>
          {isTop && <span className="td-badge td-badge--top">이번 주 TOP</span>}
        </div>
        {teacher.subject && <div className="td-hero__specialty">{teacher.subject}</div>}
        {education       && <div className="td-hero__subject">{education}</div>}
      </div>

      <div className="td-hero__actions">
        <button className="td-hero__btn td-hero__btn--primary" onClick={onInquiry}>문의하기</button>
      </div>
    </div>
  )
}
