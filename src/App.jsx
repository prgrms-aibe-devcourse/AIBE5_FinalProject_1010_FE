/**
 * @file App.jsx
 * @description StudyFlow 프론트의 최상위 라우팅 허브입니다.
 * - URL 경로와 실제 페이지 컴포넌트를 연결합니다.
 * - 공통 UI인 Navbar, 커서 효과, 배경 장식을 여기에서 배치합니다.
 * - 새 페이지를 추가할 때 가장 먼저 수정하는 파일입니다.
 */
import { HashRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import Navbar from './components/layout/Navbar.jsx'
import CursorEffects from './components/layout/CursorEffects.jsx'
import BgShapes from './components/layout/BgShapes.jsx'
import ChatWidget from './components/chat/ChatWidget.jsx'
import AuthBootstrap from './auth/AuthBootstrap.jsx'
import { getIsTokenLoading } from './auth/tokenStore.js'

import HomePage from './pages/home/HomePage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import OAuth2AdditionalInfoPage from './pages/auth/OAuth2AdditionalInfoPage.jsx'
import SearchPage from './pages/search/SearchPage.jsx'
import ClassroomPage from './pages/classroom/ClassroomPage.jsx'
import TeacherSearchPage from './pages/teachers/TeacherSearchPage.jsx'
import TeacherDetailPage from './pages/teachers/TeacherDetailPage.jsx'
import CourseCreatePage from './pages/courses/CourseCreatePage.jsx'
import QnaPage from './pages/qna/QnaPage.jsx'
import QnaWritePage from './pages/qna/QnaWritePage.jsx'
import QnaDetailPage from './pages/qna/QnaDetailPage.jsx'
import CourseDashboardPage from './pages/courses/CourseDashboardPage.jsx'
import CourseDetailPage from './pages/courses/CourseDetailPage.jsx'

const AiPage = lazy(() => import('./pages/ai/AiPage.jsx'))

/**
 * 최상위 앱 라우터.
 * - 라우트별로 navbar/cursor 표시 여부를 약간 다르게 가져갈 수도 있지만
 *   여기서는 단순화해 모두 표시한다 (classroom 페이지는 자체적으로 navbar 숨김 처리).
 * - HashRouter를 쓰는 이유: file:// 로 빌드 결과를 열어도 라우팅이 동작하도록.
 */
export default function App() {
  const [isTokenLoading, setIsTokenLoading] = useState(getIsTokenLoading())

  useEffect(() => {
    const onAccessTokenChanged = (e) => {
      const next = e?.detail?.tokenLoading
      setIsTokenLoading(typeof next === 'boolean' ? next : getIsTokenLoading())
    }

    window.addEventListener('accessTokenChanged', onAccessTokenChanged)
    return () => window.removeEventListener('accessTokenChanged', onAccessTokenChanged)
  }, [])

  return (
    // HashRouter는 /#/search 같은 해시 기반 라우팅을 사용합니다.
    // GitHub Pages, Netlify 정적 배포, file:// 미리보기처럼 서버 라우팅 설정이 없는 환경에서 안전합니다.
    <HashRouter>
      {/* 앱 시작 시 refresh API를 1회 호출해 인증 상태를 복구합니다. */}
      <AuthBootstrap />

      {isTokenLoading && (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#0f172a', fontWeight: 600 }}>
          인증 정보를 확인하는 중...
        </div>
      )}

      {!isTokenLoading && (
        <>
          {/* 모든 페이지 위에 공통으로 올라가는 시각 효과입니다. 실제 데이터/라우팅과는 독립적입니다. */}
          <CursorEffects />
          <BgShapes />

          {/* 페이지 추가 시 이 Routes 안에 Route를 추가합니다. */}
          <Routes>
            <Route path="/" element={<WithChrome><HomePage /></WithChrome>} />
            <Route path="/courses/new" element={<WithChrome><CourseCreatePage /></WithChrome>} />
            <Route path="/courses/:id" element={<WithChrome><CourseDetailPage /></WithChrome>} />
            <Route path="/courses/:id/dashboard" element={<WithChrome><CourseDashboardPage /></WithChrome>} />
            <Route path="/courses" element={<WithChrome><SearchPage /></WithChrome>} />
            <Route path="/qna/write" element={<WithChrome><QnaWritePage /></WithChrome>} />
            <Route path="/qna/:questionId/edit" element={<WithChrome><QnaWritePage /></WithChrome>} />
            <Route path="/qna/:questionId" element={<WithChrome><QnaDetailPage /></WithChrome>} />
            <Route path="/qna" element={<WithChrome><QnaPage /></WithChrome>} />
            <Route path="/ai" element={<WithChrome><Suspense fallback={<PageFallback />}>
              <AiPage />
            </Suspense></WithChrome>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth2/additional-info" element={<OAuth2AdditionalInfoPage />} />
            <Route path="/classroom" element={<ClassroomPage />} />
            <Route path="/teachers" element={<WithChrome><TeacherSearchPage /></WithChrome>} />
            <Route path="/teachers/:id" element={<WithChrome><TeacherDetailPage /></WithChrome>} />
          </Routes>

          {/* 모든 페이지 오른쪽 아래에 떠 있는 전역 채팅 위젯
              (강의실/로그인 화면에서는 내부에서 스스로 숨김) */}
          <ChatWidget />
        </>
      )}
    </HashRouter>
  )
}

/**
 * Navbar가 필요한 일반 페이지를 감싸는 레이아웃 헬퍼입니다.
 * - 로그인 페이지는 독립 레이아웃이라 Navbar를 붙이지 않습니다.
 * - 강의실은 전체 화면 앱 형태라 Navbar 대신 ClassroomTopBar를 사용합니다.
 */
function WithChrome({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

function PageFallback() {
  return (
    <main className="page">
      <div className="container" style={{ padding: '80px 0', color: '#0f172a', fontWeight: 700 }}>
        페이지를 불러오는 중...
      </div>
    </main>
  )
}
