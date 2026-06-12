/**
 * @file Navbar.jsx
 * @description 사이트 공통 상단 네비게이션입니다.
 * - react-router-dom의 Link/NavLink를 사용합니다.
 * - NavLink는 현재 라우트와 맞으면 active 클래스를 자동으로 부여합니다.
 * - 메뉴를 추가하거나 경로를 바꾸고 싶다면 nav-links 영역을 수정하세요.
 */
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { clearAccessToken, getAccessToken, getUserName, getRole } from '../../auth/tokenStore.js'
import { API_BASE_URL } from '../../auth/authApi.js'
import { authFetch } from '../../api/authFetch.js'
import NotificationBell from '../notifications/NotificationBell.jsx'

/**
 * 상단 네비게이션 바.
 * - 모든 페이지에서 공유
 * - NavLink로 활성화 상태 자동 관리
 */
export default function Navbar() {
  const navigate = useNavigate()
  const [token, setToken] = useState(getAccessToken())
  const [userName, setUserName] = useState(getUserName())
  const [role, setRole] = useState(getRole())

  const onAccessTokenChange = useCallback((e) => {
    setToken(e?.detail?.token ?? getAccessToken())
    setUserName(e?.detail?.name ?? getUserName())
    setRole(e?.detail?.role ?? getRole())
  }, [])

  useEffect(() => {
    window.addEventListener('accessTokenChanged', onAccessTokenChange)
    return () => window.removeEventListener('accessTokenChanged', onAccessTokenChange)
  }, [onAccessTokenChange])

  async function handleLogout() {
    try {
      await authFetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST'
      })
    } catch (err) {
      console.warn('로그아웃 요청 실패', err)
    }
    // 클라이언트 메모리 토큰 제거 및 화면 갱신
    clearAccessToken()
    setToken(null)
    try { navigate('/') } catch (err) { console.warn('[handleLogout] navigate 실패', err) }
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          Study Flow
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>홈</NavLink>
          <NavLink to="/courses" className={({ isActive }) => (isActive ? 'active' : '')}>수업 찾기</NavLink>
          <NavLink to="/teachers" className={({ isActive }) => (isActive ? 'active' : '')}>선생님 찾기</NavLink>
          <NavLink to="/qna" className={({ isActive }) => (isActive ? 'active' : '')}>질문게시판</NavLink>
          <NavLink to="/ai" className={({ isActive }) => (isActive ? 'active' : '')}>AI 질문</NavLink>
        </div>
        <div className="nav-actions">
          {token
            ? <>
                {userName && (
                  <span className="nav-welcome">
                    <span className="nav-welcome-name">{userName}</span>님 환영합니다
                  </span>
                )}
                {role !== 'ADMIN' && <NotificationBell />}
                {role === 'ADMIN'
                  ? <Link to="/admin" className="btn btn-ghost">관리자 페이지</Link>
                  : <Link to="/mypage" className="btn btn-ghost">마이페이지</Link>
                }
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>로그아웃</button>
              </>
            : <>
                <Link to="/login" className="btn btn-ghost">로그인</Link>
                <Link to="/login" className="btn btn-primary btn-sm">회원가입</Link>
              </>
          }
        </div>
      </div>
    </nav>
  )
}
