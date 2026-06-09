/**
 * @file AdminPage.jsx
 * @description 관리자 전용 콘솔 페이지입니다.
 * - URL: /#/admin
 * - ADMIN 역할이 아닌 사용자는 홈으로 리다이렉트합니다.
 * - 좌측 사이드바 + 우측 콘텐츠 영역 구조입니다.
 * - 실제 API 연동 없이 UI 골격만 제공합니다.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRole, getAccessToken } from '../../auth/tokenStore.js'

// 사이드바 메뉴 정의
const MENU_ITEMS = [
  { key: 'dashboard',        icon: '📊', label: '대시보드' },
  { key: 'teacher-approval', icon: '🧑‍🏫', label: '선생님 가입 승인' },
  { key: 'report',           icon: '🚨', label: '신고 접수 처리' },
  { key: 'members',          icon: '👥', label: '회원 관리' },
  { key: 'inquiry',          icon: '✉️',  label: '일반 문의 답변' },
]

// 대시보드 통계 카드 정의 (더미 구조)
const STAT_CARDS = [
  {
    key: 'total-members',
    icon: '👤',
    iconBg: 'var(--sky-bg)',
    label: '전체 가입자',
    value: '-',
    sub: '학생 · 선생님',
  },
  {
    key: 'total-courses',
    icon: '📚',
    iconBg: 'var(--mint-bg)',
    label: '개설 강의',
    value: '-',
    sub: '진행 중 포함',
  },
  {
    key: 'pending-teachers',
    icon: '⏳',
    iconBg: 'var(--butter-bg)',
    label: '승인 대기 선생님',
    value: '-',
    sub: null,
    highlight: true,
  },
  {
    key: 'pending-reports',
    icon: '⚠️',
    iconBg: 'var(--peach-bg)',
    label: '미처리 신고',
    value: '-',
    sub: '접수 대기',
    highlight: true,
  },
]

// 최근 7일 요일 라벨
const DAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')

  // ADMIN 역할이 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!getAccessToken() || getRole() !== 'ADMIN') {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <div className="admin-page">
      {/* ===== 좌측 사이드바 ===== */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">🛡️</div>
          <div>
            <div className="admin-sidebar__title">관리자 콘솔</div>
            <div className="admin-sidebar__sub">StudyFlow Admin</div>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`admin-menu-item${activeMenu === item.key ? ' active' : ''}`}
              onClick={() => setActiveMenu(item.key)}
            >
              <span className="admin-menu-item__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ===== 우측 콘텐츠 영역 ===== */}
      <main className="admin-content">
        {activeMenu === 'dashboard'        && <DashboardPanel />}
        {activeMenu === 'teacher-approval' && <PlaceholderPanel title="선생님 가입 승인" icon="🧑‍🏫" desc="가입 신청한 선생님 목록을 검토하고 승인 또는 반려합니다." />}
        {activeMenu === 'report'           && <PlaceholderPanel title="신고 접수 처리" icon="🚨" desc="사용자로부터 접수된 신고를 검토하고 제재 조치를 취합니다." />}
        {activeMenu === 'members'          && <PlaceholderPanel title="회원 관리" icon="👥" desc="전체 회원 목록을 조회하고 계정 상태를 관리합니다." />}
        {activeMenu === 'inquiry'          && <PlaceholderPanel title="일반 문의 답변" icon="✉️" desc="사용자의 1:1 문의에 답변합니다." />}
      </main>
    </div>
  )
}

/** 대시보드 패널 */
function DashboardPanel() {
  return (
    <div className="admin-dashboard">
      {/* 헤더 */}
      <div className="admin-content__header">
        <h1 className="admin-content__title">대시보드</h1>
        <p className="admin-content__sub">StudyFlow 운영 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="admin-stat-grid">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className={`admin-stat-card${card.highlight ? ' highlight' : ''}`}>
            <div className="admin-stat-card__icon" style={{ background: card.iconBg }}>
              {card.icon}
            </div>
            <div className="admin-stat-card__body">
              <div className={`admin-stat-card__value${card.highlight ? ' accent' : ''}`}>
                {card.value}
              </div>
              <div className="admin-stat-card__label">{card.label}</div>
              {card.sub && (
                <div className="admin-stat-card__sub">{card.sub}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 최근 7일 추이 차트 */}
      <div className="admin-chart-card">
        <div className="admin-chart-card__header">
          <span className="admin-chart-card__title">📈 최근 7일 추이</span>
          <span className="admin-chart-card__badge">신규 가입자</span>
        </div>
        <div className="admin-bar-chart">
          {DAYS.map((day, i) => (
            <div key={day} className="admin-bar-chart__col">
              <div
                className={`admin-bar-chart__bar${i === 6 ? ' today' : i >= 4 ? ' high' : ''}`}
                style={{ '--bar-h': `${30 + Math.round(Math.sin(i * 0.9 + 1) * 20 + 30)}%` }}
              />
              <div className="admin-bar-chart__label">{day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 바로가기 */}
      <div className="admin-quick-grid">
        <div className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'var(--butter-bg)' }}>⏳</div>
          <div className="admin-quick-card__label">승인 대기</div>
          <div className="admin-quick-card__desc">검토가 필요한 선생님 신청이 있어요</div>
        </div>
        <div className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'var(--peach-bg)' }}>🚨</div>
          <div className="admin-quick-card__label">신고 처리</div>
          <div className="admin-quick-card__desc">미처리 신고 건을 확인해주세요</div>
        </div>
        <div className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'var(--sky-bg)' }}>✉️</div>
          <div className="admin-quick-card__label">미답변 문의</div>
          <div className="admin-quick-card__desc">답변 대기 중인 문의가 있어요</div>
        </div>
      </div>
    </div>
  )
}

/** 미구현 메뉴용 플레이스홀더 패널 */
function PlaceholderPanel({ title, icon, desc }) {
  return (
    <div className="admin-dashboard">
      <div className="admin-content__header">
        <h1 className="admin-content__title">{icon} {title}</h1>
        <p className="admin-content__sub">{desc}</p>
      </div>
      <div className="admin-placeholder">
        <div className="admin-placeholder__icon">🚧</div>
        <div className="admin-placeholder__text">준비 중입니다</div>
        <div className="admin-placeholder__sub">이 메뉴는 현재 개발 중이에요</div>
      </div>
    </div>
  )
}
