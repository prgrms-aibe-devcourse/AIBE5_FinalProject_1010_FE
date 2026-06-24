import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { getRole } from '../../auth/tokenStore.js'
import { getCurrentUserId } from '../../auth/currentUser.js'
import Footer from '../../components/layout/Footer.jsx'
import HeroSection from './HeroSection.jsx'
import LiveNowSection from './LiveNowSection.jsx'
import TopTeachersSection from './TopTeachersSection.jsx'
import QnaBoardSection from './QnaBoardSection.jsx'
import FeaturesSection from './FeaturesSection.jsx'
import CTASection from './CTASection.jsx'
import ProfileSetupPrompt from '../mypage/teacher/ProfileSetupPrompt.jsx'

// 스토리지 키 (사용자별)
//   localStorage  = "앞으로 안 볼래요" 체크 → 영구 숨김
//   sessionStorage = 이번 로그인 세션에 이미 표시했는지 → 같은 세션 내 중복 방지
const promptDismissedKey = (uid) => `sf:teacherProfilePromptDismissed:${uid}`
const promptShownKey     = (uid) => `sf:teacherProfilePromptShown:${uid}`

export default function HomePage() {
  const navigate = useNavigate()
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptUserName, setPromptUserName] = useState('')

  useEffect(() => {
    // 선생님이 아니면 모달 체크 불필요
    if (getRole() !== 'TEACHER') return

    const userId = getCurrentUserId()
    if (userId == null) return

    try {
      // 영구 숨김이거나 이번 세션에 이미 보여줬으면 표시 안 함
      if (localStorage.getItem(promptDismissedKey(userId)) === '1') return
      if (sessionStorage.getItem(promptShownKey(userId)) === '1') return
    } catch { return }

    // 인증된 선생님(isVerified=true)이면 표시 안 함
    authFetch(`${API_BASE}/api/v1/users/me`)
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.isVerified === true) return
        try { sessionStorage.setItem(promptShownKey(userId), '1') } catch { /* 무시 */ }
        setPromptUserName(me.name ?? '')
        setShowPrompt(true)
      })
      .catch(() => {})
  }, [])

  function handleClosePrompt(dontShowAgain) {
    if (dontShowAgain) {
      const userId = getCurrentUserId()
      if (userId != null) {
        try { localStorage.setItem(promptDismissedKey(userId), '1') } catch { /* 무시 */ }
      }
    }
    setShowPrompt(false)
  }

  return (
    <>
      {showPrompt && (
        <ProfileSetupPrompt
          userName={promptUserName}
          onClose={handleClosePrompt}
          onGoProfile={() => { setShowPrompt(false); navigate('/mypage?tab=profile') }}
        />
      )}

      <HeroSection />
      <LiveNowSection />
      <TopTeachersSection />
      <QnaBoardSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </>
  )
}
