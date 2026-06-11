import { useState, useEffect } from 'react'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { GRADE_LABEL } from '../../utils/labels.js'
import { avatarColor } from '../../utils/avatarColor.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import EnrolledTab      from './student/EnrolledTab.jsx'
import ApplyTab         from './student/ApplyTab.jsx'
import StudentProfileTab from './student/StudentProfileTab.jsx'
import UserInfoTab      from './shared/UserInfoTab.jsx'
import ComingSoon       from './shared/ComingSoon.jsx'

const TABS = [
  { key: 'active',  label: '수강 중인 수업' },
  { key: 'done',    label: '수강했던 수업' },
  { key: 'apply',   label: '신청 내역' },
  null,
  { key: 'profile', label: '내 프로필' },
  { key: 'info',    label: '회원 정보' },
  null,
  { key: 'pay',     label: '결제 내역' },
  { key: 'noti',    label: '알림 설정' },
]

export default function StudentMyPage() {
  const [tab, setTab]           = useState('active')
  const [userInfo, setUserInfo] = useState(null)
  const [profile, setProfile]   = useState(null)

  useEffect(() => {
    authFetch(`${API_BASE}/api/v1/users/me`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setUserInfo).catch(console.error)
    authFetch(`${API_BASE}/api/v1/students/me/profile`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setProfile).catch(() => setProfile({}))
  }, [])

  const gradeLabel = profile?.grade ? (GRADE_LABEL[profile.grade] ?? profile.grade) : null

  return (
    <div className="mp-page">
      <div className="mp-layout">

        <aside className="mp-side">
          <div className="mp-profile-card">
            <div className="mp-profile-banner coral" />
            <div className="mp-profile-body">
              <div className={`mp-avatar ${avatarColor(userInfo?.name)}`}>
                {userInfo?.profileImageUrl
                  ? <img src={toAbsoluteFileUrl(userInfo.profileImageUrl)} alt="프로필" />
                  : (userInfo?.name?.[0] ?? '?')
                }
              </div>
              <p className="mp-profile-name">{userInfo?.name ?? '학생'}</p>
              <p className="mp-profile-sub">
                {gradeLabel
                  ? <span className="badge">{gradeLabel}</span>
                  : <span style={{ color: 'var(--ink-mute)' }}>학년 미설정</span>
                }
              </p>
              {profile?.region && (
                <>
                  <div className="mp-profile-divider" />
                  <p className="mp-profile-sub" style={{ fontSize: 12 }}>{profile.region}</p>
                </>
              )}
            </div>
          </div>

          <nav className="mp-nav">
            {TABS.map((t, i) =>
              t === null
                ? <div key={i} className="mp-nav-sep" />
                : <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
                    {t.label}
                  </button>
            )}
          </nav>
        </aside>

        <section className="mp-content">
          {tab === 'active'  && <EnrolledTab status="ACTIVE" />}
          {tab === 'done'    && <EnrolledTab status="INACTIVE" />}
          {tab === 'apply'   && <ApplyTab />}
          {tab === 'profile' && <StudentProfileTab profile={profile} onSaved={setProfile} />}
          {tab === 'info'    && <UserInfoTab userInfo={userInfo} onSaved={setUserInfo} />}
          {(tab === 'pay' || tab === 'noti') && <ComingSoon />}
        </section>

      </div>
    </div>
  )
}
