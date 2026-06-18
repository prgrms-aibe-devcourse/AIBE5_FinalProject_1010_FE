import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { avatarColor } from '../../utils/avatarColor.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import EnrollmentRequestsTab from './teacher/EnrollmentRequestsTab.jsx'
import TeacherCoursesTab    from './teacher/TeacherCoursesTab.jsx'
import TeacherProfileTab    from './teacher/TeacherProfileTab.jsx'
import VerifyTab            from './teacher/VerifyTab.jsx'
import UserInfoTab          from './shared/UserInfoTab.jsx'
import ComingSoon           from './shared/ComingSoon.jsx'

const TABS = [
  { key: 'req',     label: '수강 신청 받은 목록' },
  { key: 'active',  label: '진행 중인 수업' },
  { key: 'past',    label: '이전에 진행한 수업' },
  null,
  { key: 'profile', label: '프로필 관리' },
  { key: 'info',    label: '회원 정보' },
  { key: 'verify',  label: '인증' },
  null,
  { key: 'settle',  label: '정산·결제' },
  { key: 'noti',    label: '알림 설정' },
]

// 알림 클릭 등으로 들어온 ?tab= 값이 유효할 때만 초기 탭으로 사용
const VALID_TABS = TABS.filter(Boolean).map(t => t.key)

export default function TeacherMyPage() {
  const navigate                            = useNavigate()
  const { search }                          = useLocation()
  const [userInfo, setUserInfo]             = useState(null)
  const [teacherProfile, setTeacherProfile] = useState(null)
  const [savingListed, setSavingListed]     = useState(false)

  const rawTab = new URLSearchParams(search).get('tab')
  const tab = VALID_TABS.includes(rawTab) ? rawTab : 'req'

  // 선생님 찾기 목록 노출 여부 — 프로필 로드 전엔 false
  const listed = !!teacherProfile?.listed
  // 수업 찾기에 노출 중인 수업이 있으면 노출을 끌 수 없음 (서버에서도 차단)
  const lockedOff = listed && !!teacherProfile?.hasListedCourses

  // 노출 토글 — 낙관적 업데이트 후 실패 시 롤백
  async function toggleListed() {
    if (!teacherProfile || savingListed || lockedOff) return
    const prev = listed
    const next = !prev
    setSavingListed(true)
    setTeacherProfile(p => ({ ...p, listed: next }))
    try {
      const res = await authFetch(`${API_BASE}/api/v1/teachers/me/listed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listed: next }),
      })
      if (!res.ok) throw new Error(res.statusText)
      setTeacherProfile(await res.json())
    } catch {
      setTeacherProfile(p => ({ ...p, listed: prev }))   // 롤백 — 캡처된 이전값으로 복원
      alert('노출 설정 변경에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSavingListed(false)
    }
  }

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

              {/* 선생님 찾기 목록 노출 토글 */}
              <div className="mp-listed">
                <div className="mp-listed__text">
                  <span className="mp-listed__label">선생님 찾기 노출</span>
                  <span className="mp-listed__desc">
                    {lockedOff
                      ? '노출 중인 수업이 있어요'
                      : (listed ? '검색 목록에 노출 중이에요' : '검색 목록에서 숨김 상태예요')}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={listed}
                  aria-label="선생님 찾기 목록 노출"
                  title={lockedOff ? '수업 찾기에 노출 중인 수업을 모두 종료하면 끌 수 있어요' : undefined}
                  className={`mp-switch${listed ? ' mp-switch--on' : ''}`}
                  onClick={toggleListed}
                  disabled={!teacherProfile || savingListed || lockedOff}
                >
                  <span className="mp-switch__knob" />
                </button>
              </div>

              <Link to="/courses/new" className="mp-new-course-btn">+ 수업 등록</Link>
            </div>
          </div>

          <nav className="mp-nav">
            {TABS.map((t, i) =>
              t === null
                ? <div key={i} className="mp-nav-sep" />
                : <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => navigate(`/mypage?tab=${t.key}`)}>
                    {t.label}
                  </button>
            )}
          </nav>
        </aside>

        <section className="mp-content">
          {tab === 'req'     && <EnrollmentRequestsTab />}
          {tab === 'active'  && <TeacherCoursesTab status="RECRUITING" />}
          {tab === 'past'    && <TeacherCoursesTab status="CLOSED" />}
          {tab === 'profile' && <TeacherProfileTab profile={teacherProfile} onSaved={setTeacherProfile} />}
          {tab === 'info'    && <UserInfoTab userInfo={userInfo} onSaved={setUserInfo} />}
          {tab === 'verify'  && <VerifyTab profile={teacherProfile} />}
          {(tab === 'settle' || tab === 'noti') && <ComingSoon />}
        </section>

      </div>
    </div>
  )
}
