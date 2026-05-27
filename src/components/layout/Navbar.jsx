/**
 * @file Navbar.jsx
 * @description 사이트 공통 상단 네비게이션입니다.
 * - react-router-dom의 Link/NavLink를 사용합니다.
 * - NavLink는 현재 라우트와 맞으면 active 클래스를 자동으로 부여합니다.
 * - 메뉴를 추가하거나 경로를 바꾸고 싶다면 nav-links 영역을 수정하세요.
 */
import { Link, NavLink } from 'react-router-dom'

/**
 * 상단 네비게이션 바.
 * - 모든 페이지에서 공유
 * - NavLink로 활성화 상태 자동 관리
 */
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          Study Flow
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>홈</NavLink>
          <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>수업 찾기</NavLink>
          <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>선생님 찾기</NavLink>
          <NavLink to="/qna" className={({ isActive }) => (isActive ? 'active' : '')}>질문게시판</NavLink>
          <NavLink to="/ai" className={({ isActive }) => (isActive ? 'active' : '')}>AI 질문</NavLink>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost">로그인</Link>
          <Link to="/login" className="btn btn-primary btn-sm">회원가입</Link>
        </div>
      </div>
    </nav>
  )
}
