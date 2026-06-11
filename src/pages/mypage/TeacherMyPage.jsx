import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { avatarColor } from '../../utils/avatarColor.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import EnrollmentRequestsTab from './teacher/EnrollmentRequestsTab.jsx'
import TeacherCoursesTab from './teacher/TeacherCoursesTab.jsx'
import TeacherProfileTab from './teacher/TeacherProfileTab.jsx'
import VerifyTab from './teacher/VerifyTab.jsx'
import UserInfoTab from './shared/UserInfoTab.jsx'
import ComingSoon from './shared/ComingSoon.jsx'

const TABS = [
  { key: 'req', label: '수강 신청 받은 목록' },
  { key: 'active', label: '진행 중인 수업' },
  { key: 'past', label: '이전에 진행한 수업' },
  null,
  { key: 'profile', label: '프로필 관리' },
  { key: 'info', label: '회원 정보' },
  { key: 'verify', label: '인증' },
  null,
  { key: 'settle', label: '정산·결제' },
  { key: 'noti', label: '알림 설정' },
]

// 알림 클릭 등으로 들어온 ?tab= 값이 유효할 때만 초기 탭으로 사용
const VALID_TABS = TABS.filter(Boolean).map(t => t.key)

export default function TeacherMyPage() {
  const [searchParams] = useSearchParams()
  const initialTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'req'
  const [tab, setTab] = useState(initialTab)
  const [userInfo, setUserInfo] = useState(null)
  const [teacherProfile, setTeacherProfile] = useState(null)

  useEffect(() => {
    authFetch(`${API_BASE}/api/v1/users/me`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setUserInfo).catch(console.error)
    authFetch(`${API_BASE}/api/v1/teachers/me/profile`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setTeacherProfile).catch(() => setTeacherProfile({}))
  }, [])

  return (
    <div className="mp-page">
      <div className="mp-layout">

        <aside className="mp-side">
          <div className="mp-profile-card">
            <div className="mp-profile-banner" />
            <div className="mp-profile-body">
              <div className={`mp-avatar ${avatarColor(userInfo?.name)}`}>
                {userInfo?.profileImageUrl
                  ? <img src={toAbsoluteFileUrl(userInfo.profileImageUrl)} alt="프로필" />
                  : (userInfo?.name?.[0] ?? '?')
                }
              </div>
              <p className="mp-profile-name">{userInfo?.name ?? '선생님'} 선생님</p>
              <div className="mp-profile-divider" />
              <Link to="/courses/new" className="mp-new-course-btn">+ 수업 등록</Link>
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
          {tab === 'req' && <EnrollmentRequestsTab />}
          {tab === 'active' && <TeacherCoursesTab status="RECRUITING" />}
          {tab === 'past' && <TeacherCoursesTab status="CLOSED" />}
          {tab === 'profile' && <TeacherProfileTab profile={teacherProfile} onSaved={setTeacherProfile} />}
          {tab === 'info' && <UserInfoTab userInfo={userInfo} onSaved={setUserInfo} />}
          {tab === 'verify' && <VerifyTab profile={teacherProfile} />}
          {(tab === 'settle' || tab === 'noti') && <ComingSoon />}
        </section>

      </div>
    </div>
  )
}
