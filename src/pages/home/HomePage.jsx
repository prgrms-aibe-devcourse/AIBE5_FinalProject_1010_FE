/**
 * @file HomePage.jsx
 * @description 메인 페이지를 구성하는 섹션들을 순서대로 합치는 조립 파일입니다.
 * - 각 섹션의 세부 UI는 같은 폴더의 개별 컴포넌트에 분리되어 있습니다.
 * - 섹션 순서를 바꾸거나 삭제하고 싶다면 이 파일의 JSX 순서를 수정하세요.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/layout/Footer.jsx'
import HeroSection from './HeroSection.jsx'
import LiveNowSection from './LiveNowSection.jsx'
import TopTeachersSection from './TopTeachersSection.jsx'
import QnaBoardSection from './QnaBoardSection.jsx'
import FeaturesSection from './FeaturesSection.jsx'
import CTASection from './CTASection.jsx'
import ProfileSetupPrompt from '../mypage/teacher/ProfileSetupPrompt.jsx'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { getRole, getCurrentUserId, getUserName } from '../../auth/tokenStore.js'

const promptDismissedKey = (uid) => `sf:teacherProfilePromptDismissed:${uid}`
const promptShownKey     = (uid) => `sf:teacherProfilePromptShown:${uid}`

/**
 * 메인 페이지 — 모든 섹션을 순서대로 조합.
 * 각 섹션은 독립 컴포넌트로 분리되어 개발/유지보수가 쉽게 되어 있음.
 */
export default function HomePage() {
  const navigate = useNavigate()
  const [showPrompt, setShowPrompt] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const role = getRole()
    if (role !== 'TEACHER') return
    const uid = getCurrentUserId()
    if (!uid) return
    if (localStorage.getItem(promptDismissedKey(uid))) return
    if (sessionStorage.getItem(promptShownKey(uid))) return

    let active = true
    authFetch(`${API_BASE}/api/v1/users/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return
        if (data?.isVerified === false) {
          setUserName(data.name ?? getUserName() ?? '')
          setShowPrompt(true)
          try { sessionStorage.setItem(promptShownKey(uid), '1') } catch { /* 무시 */ }
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  function handlePromptClose(dontShowAgain) {
    const uid = getCurrentUserId()
    if (dontShowAgain && uid) {
      try { localStorage.setItem(promptDismissedKey(uid), '1') } catch { /* 무시 */ }
    }
    setShowPrompt(false)
  }

  function handleGoVerify() {
    setShowPrompt(false)
    navigate('/mypage?tab=profile')
  }

  return (
    <>
      {showPrompt && (
        <ProfileSetupPrompt
          userName={userName}
          onClose={handlePromptClose}
          onGoVerify={handleGoVerify}
        />
      )}

      {/* 첫 화면: 서비스 핵심 카피와 CTA */}
      <HeroSection />

      <LiveNowSection />
      <TopTeachersSection />
      {/* 질문게시판 미리보기로 QnA 기능을 보여준 뒤, 핵심 기능 카드를 이어서 노출합니다. */}
      <QnaBoardSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </>
  )
}
