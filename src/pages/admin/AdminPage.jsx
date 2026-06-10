/**
 * @file AdminPage.jsx
 * @description 관리자 전용 콘솔 페이지입니다.
 * - URL: /#/admin
 * - ADMIN 역할이 아닌 사용자는 홈으로 리다이렉트합니다.
 * - 좌측 사이드바 + 우측 콘텐츠 영역 구조입니다.
 * - 실제 API 연동 없이 UI 골격만 제공합니다.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { getRole, getAccessToken, getIsTokenLoading } from '../../auth/tokenStore.js'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE_URL } from '../../auth/authApi.js'

// 사이드바 메뉴 정의
const MENU_ITEMS = [
  { key: 'dashboard',        icon: '📊', label: '대시보드' },
  { key: 'teacher-approval', icon: '🧑‍🏫', label: '선생님 가입 승인' },
  { key: 'report',           icon: '🚨', label: '신고 접수 처리' },
  { key: 'members',          icon: '👥', label: '회원 관리' },
  { key: 'inquiry',          icon: '✉️',  label: '일반 문의 답변' },
]

// 대시보드 통계 카드 기본 정의 (value는 동적으로 주입)
const STAT_CARD_DEFS = [
  {
    key: 'total-members',
    icon: '👤',
    iconBg: 'var(--sky-bg)',
    label: '활성화된 사용자',
    sub: null,
  },
  {
    key: 'total-courses',
    icon: '📚',
    iconBg: 'var(--mint-bg)',
    label: '개설 수업',
    sub: '진행 중 포함',
  },
  {
    key: 'pending-teachers',
    icon: '⏳',
    iconBg: 'var(--butter-bg)',
    label: '승인 대기 선생님',
    sub: null,
    highlight: true,
  },
  {
    key: 'pending-reports',
    icon: '⚠️',
    iconBg: 'var(--peach-bg)',
    label: '미처리 신고',
    sub: '접수 대기',
    highlight: true,
  },
]

// 7일 통계 항목 정의
const STAT_METRICS = [
  { key: 'newStudentCount',     label: '신규 학생',   color: 'var(--teal)' },
  { key: 'newTeacherCount',     label: '신규 선생님', color: '#6366F1' },
  { key: 'newAdminCount',       label: '신규 관리자', color: '#F59E0B' },
  { key: 'deletedStudentCount', label: '탈퇴 학생',   color: 'var(--coral-dark)' },
  { key: 'deletedTeacherCount', label: '탈퇴 선생님', color: '#EC4899' },
  { key: 'deletedAdminCount',   label: '탈퇴 관리자', color: '#94A3B8' },
]

/** YYYY-MM-DD 문자열을 반환 */
function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 오늘 기준 daysAgo일 전 Date 반환 */
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

/** M/D 형태 레이블 */
function toMonthDay(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}/${Number(d)}`
}

/**
 * 대시보드 API 데이터를 한 곳에 저장합니다.
 * - userCount      : GET /api/v1/admin/dashboard/user-count 전체 응답
 * - userCountInactive : GET /api/v1/admin/dashboard/user-count/inactive 전체 응답
 * - userCountDeleted  : GET /api/v1/admin/dashboard/user-count/deleted  전체 응답
 * - courseCount    : GET /api/v1/admin/dashboard/course-count 전체 응답
 * - pendingTeachers: GET /api/v1/admin/verification-pending-count 전체 응답
 */
const INITIAL_DASHBOARD = {
  userCount: null,
  userCountInactive: null,
  userCountDeleted: null,
  courseCount: null,
  pendingTeachers: null,
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 토큰 초기 로딩(새로고침 후 reissue) 완료 여부
  const [tokenReady, setTokenReady] = useState(!getIsTokenLoading())

  useEffect(() => {
    if (getIsTokenLoading()) {
      const handler = (e) => {
        if (!e.detail.tokenLoading) {
          setTokenReady(true)
          window.removeEventListener('accessTokenChanged', handler)
        }
      }
      window.addEventListener('accessTokenChanged', handler)
      return () => window.removeEventListener('accessTokenChanged', handler)
    }
  }, [])

  // URL ?menu= 값으로 초기화, 없으면 'dashboard'
  const VALID_MENUS = MENU_ITEMS.map((m) => m.key)
  const menuParam   = searchParams.get('menu')
  const activeMenu  = VALID_MENUS.includes(menuParam) ? menuParam : 'dashboard'

  const setActiveMenu = (key) => setSearchParams({ menu: key }, { replace: true })
  const [dashboardData, setDashboardData] = useState(INITIAL_DASHBOARD)
  const [dashboardLoading, setDashboardLoading] = useState(true)

  // 대시보드 데이터 병렬 로드 — tokenReady + ADMIN 확인 후에만 실행
  useEffect(() => {
    if (!tokenReady || !getAccessToken() || getRole() !== 'ADMIN') return
    let cancelled = false
    setDashboardLoading(true)

    const safeJson = (res) => res.ok ? res.json().catch(() => null) : Promise.resolve(null)

    Promise.all([
      authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/user-count`).then(safeJson),
      authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/user-count/inactive`).then(safeJson),
      authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/user-count/deleted`).then(safeJson),
      authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/course-count`).then(safeJson),
      authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/verification-pending-count`).then(safeJson),
    ])
      .then(([userCount, userCountInactive, userCountDeleted, courseCount, pendingTeachers]) => {
        if (cancelled) return
        setDashboardData({ userCount, userCountInactive, userCountDeleted, courseCount, pendingTeachers })
      })
      .catch(() => { /* 개별 실패는 safeJson에서 null 처리 */ })
      .finally(() => { if (!cancelled) setDashboardLoading(false) })

    return () => { cancelled = true }
  }, [tokenReady])

  // 모든 hook 선언 완료 후 조건부 렌더링
  if (!tokenReady) return <div className="admin-auth-loading">로딩 중...</div>
  if (!getAccessToken() || getRole() !== 'ADMIN') return <Navigate to="/" replace />

  return (
    <div className="admin-page">
      {/* ===== 좌측 사이드바 (fixed 플로팅) ===== */}
      {/* 그리드 공간 확보용 더미 컬럼 */}
      <div className="admin-sidebar-placeholder" aria-hidden="true" />
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
        {activeMenu === 'dashboard'        && <DashboardPanel data={dashboardData} loading={dashboardLoading} onMenuChange={setActiveMenu} />}
        {activeMenu === 'teacher-approval' && <TeacherApprovalPanel />}
        {activeMenu === 'report'           && <PlaceholderPanel title="신고 접수 처리" icon="🚨" desc="사용자로부터 접수된 신고를 검토하고 제재 조치를 취합니다." />}
        {activeMenu === 'members'          && <UserManagementPanel />}
        {activeMenu === 'inquiry'          && <PlaceholderPanel title="일반 문의 답변" icon="✉️" desc="사용자의 1:1 문의에 답변합니다." />}
      </main>
    </div>
  )
}

/** 대시보드 패널 */
function DashboardPanel({ data, loading, onMenuChange }) {
  const [userCountOpen, setUserCountOpen] = useState(false)

  // API 응답에서 카드별 표시 값 추출
  const fmt = (n) => n != null ? Number(n).toLocaleString() : (loading ? '...' : '-')

  const statValues = {
    'total-members':    fmt(data.userCount?.total),
    'total-courses':    fmt(data.courseCount?.total ?? data.courseCount?.count),
    'pending-teachers': fmt(data.pendingTeachers?.count ?? data.pendingTeachers?.total),
    'pending-reports':  '-',
  }

  return (
    <div className="admin-dashboard">
      {/* 헤더 */}
      <div className="admin-content__header">
        <h1 className="admin-content__title">대시보드</h1>
        <p className="admin-content__sub">StudyFlow 운영 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="admin-stat-grid">
        {STAT_CARD_DEFS.map((card) => (
          <div key={card.key} className={`admin-stat-card${card.highlight ? ' highlight' : ''}`}>
            <div className="admin-stat-card__icon" style={{ background: card.iconBg }}>
              {card.icon}
            </div>
            <div className="admin-stat-card__body">
              <div className={`admin-stat-card__value${card.highlight ? ' accent' : ''}`}>
                {statValues[card.key]}
              </div>
              <div className="admin-stat-card__label">{card.label}</div>
              {card.sub && (
                <div className="admin-stat-card__sub">{card.sub}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 전체 사용자 현황 토글 */}
      <div className="admin-user-count-panel">
        <button
          className="admin-user-count-toggle"
          onClick={() => setUserCountOpen((v) => !v)}
        >
          <span>👥 전체 사용자 현황 보기</span>
          <span className={`admin-toggle-arrow${userCountOpen ? ' open' : ''}`}>▾</span>
        </button>

        {userCountOpen && (
          <div className="admin-user-count-body">
            <UserCountDetail
              label="✅ 활성화된 사용자"
              labelBg="var(--mint-bg)"
              labelColor="var(--teal-dark)"
              data={data.userCount}
              loading={loading}
            />
            <UserCountDetail
              label="⏸️ 비활성화된 사용자"
              labelBg="var(--butter-bg)"
              labelColor="#92400E"
              data={data.userCountInactive}
              loading={loading}
            />
            <UserCountDetail
              label="🗑️ 탈퇴한 사용자"
              labelBg="var(--peach-bg)"
              labelColor="var(--coral-dark)"
              data={data.userCountDeleted}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* 최근 7일 추이 차트 */}
      <WeeklyStatChart />

      {/* 빠른 바로가기 */}
      <div className="admin-quick-grid">
        <div className="admin-quick-card" onClick={() => onMenuChange('teacher-approval')}>
          <div className="admin-quick-card__icon" style={{ background: 'var(--butter-bg)' }}>⏳</div>
          <div className="admin-quick-card__label">승인 대기</div>
          <div className="admin-quick-card__desc">검토가 필요한 선생님 신청이 있어요</div>
        </div>
        <div className="admin-quick-card" onClick={() => onMenuChange('report')}>
          <div className="admin-quick-card__icon" style={{ background: 'var(--peach-bg)' }}>🚨</div>
          <div className="admin-quick-card__label">신고 처리</div>
          <div className="admin-quick-card__desc">미처리 신고 건을 확인해주세요</div>
        </div>
        <div className="admin-quick-card" onClick={() => onMenuChange('inquiry')}>
          <div className="admin-quick-card__icon" style={{ background: 'var(--sky-bg)' }}>✉️</div>
          <div className="admin-quick-card__label">미답변 문의</div>
          <div className="admin-quick-card__desc">답변 대기 중인 문의가 있어요</div>
        </div>
      </div>
    </div>
  )
}

/**
 * 사용자 수 상세 행 컴포넌트.
 * UserCountByRoleResponse { total, student, teacher, admin } 구조를 받아 표시합니다.
 */
/**
 * 최근 7일(어제까지) 통계 막대 그래프
 * - 마운트 시 어제~7일 전 날짜에 대해 GET /api/v1/admin/dashboard/statistics/{date} 병렬 호출
 * - 상단 메트릭 버튼으로 표시 항목 전환
 */
function WeeklyStatChart() {
  // 어제 ~ 7일 전 날짜 문자열 배열 (오래된 순) — 마운트 시 1회만 계산
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toDateStr(daysAgo(7 - i))),
    []
  )

  const [stats, setStats]       = useState([])   // UserCountStatisticsResponse[]
  const [loadingStat, setLoadingStat] = useState(true)
  const [errorStat, setErrorStat]     = useState(false)
  const [activeMetric, setActiveMetric] = useState('newStudentCount')

  useEffect(() => {
    let cancelled = false
    setLoadingStat(true)
    setErrorStat(false)

    Promise.all(
      dates.map((date) =>
        authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/statistics/${date}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return
      // null(실패)인 날짜는 0으로 채운 더미로 대체
      const filled = results.map((r, i) => r ?? {
        date: dates[i],
        newStudentCount: 0, newTeacherCount: 0, newAdminCount: 0,
        deletedStudentCount: 0, deletedTeacherCount: 0, deletedAdminCount: 0,
      })
      setStats(filled)
    }).catch(() => {
      if (!cancelled) setErrorStat(true)
    }).finally(() => {
      if (!cancelled) setLoadingStat(false)
    })

    return () => { cancelled = true }
  }, [dates])

  const metricMeta = STAT_METRICS.find((m) => m.key === activeMetric)
  const values     = stats.map((s) => s[activeMetric] ?? 0)
  const maxVal     = Math.max(...values, 1) // 0 나누기 방지

  return (
    <div className="admin-chart-card">
      <div className="admin-chart-card__header">
        <span className="admin-chart-card__title">📈 최근 7일 추이</span>
      </div>

      {/* 메트릭 선택 버튼 */}
      <div className="admin-chart-metrics">
        {STAT_METRICS.map((m) => (
          <button
            key={m.key}
            className={`admin-chart-metric-btn${activeMetric === m.key ? ' active' : ''}`}
            style={activeMetric === m.key ? { '--metric-color': m.color } : {}}
            onClick={() => setActiveMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 차트 본문 */}
      {loadingStat && (
        <div className="admin-chart-loading">통계를 불러오는 중...</div>
      )}
      {!loadingStat && errorStat && (
        <div className="admin-chart-loading" style={{ color: 'var(--coral-dark)' }}>통계를 불러오지 못했어요.</div>
      )}
      {!loadingStat && !errorStat && (
        <div className="admin-bar-chart">
          {stats.map((s) => {
            const val = s[activeMetric] ?? 0
            const heightPct = maxVal > 0 ? Math.max((val / maxVal) * 100, val > 0 ? 4 : 0) : 0
            return (
              <div key={s.date} className="admin-bar-chart__col">
                <div className="admin-bar-chart__val">{val > 0 ? val : ''}</div>
                <div
                  className="admin-bar-chart__bar"
                  style={{
                    '--bar-h': `${heightPct}%`,
                    '--bar-color': metricMeta.color,
                  }}
                />
                <div className="admin-bar-chart__label">{toMonthDay(s.date)}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* 날짜별 통계 검색 */}
      <DateStatSearch />
    </div>
  )
}

/** 특정 날짜의 통계를 검색하는 섹션 */
function DateStatSearch() {
  const [searchDate, setSearchDate]   = useState(toDateStr(daysAgo(1)))
  const [result, setResult]           = useState(null)   // UserCountStatisticsResponse | null
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')

  const today = toDateStr(new Date())

  const handleSearch = () => {
    if (!searchDate) return
    setSearching(true)
    setSearchError('')
    setResult(null)

    authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/statistics/${searchDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then(setResult)
      .catch(() => setSearchError('해당 날짜의 통계를 불러오지 못했어요.'))
      .finally(() => setSearching(false))
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch() }

  const fmt = (n) => Number(n ?? 0).toLocaleString()

  return (
    <div className="admin-date-search">
      <div className="admin-date-search__header">🔍 날짜별 통계 조회</div>

      {/* 입력 행 */}
      <div className="admin-date-search__row">
        <input
          type="date"
          className="admin-date-search__input"
          value={searchDate}
          max={today}
          onChange={(e) => setSearchDate(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="admin-date-search__btn"
          onClick={handleSearch}
          disabled={searching || !searchDate}
        >
          {searching ? '조회 중...' : '조회'}
        </button>
      </div>

      {/* 에러 */}
      {searchError && (
        <p className="admin-date-search__error">{searchError}</p>
      )}

      {/* 결과 테이블 */}
      {result && (
        <div className="admin-date-search__result">
          <div className="admin-date-search__result-date">{result.date} 통계</div>
          <div className="admin-date-search__grid">
            {STAT_METRICS.map((m) => (
              <div key={m.key} className="admin-date-search__item">
                <div
                  className="admin-date-search__item-dot"
                  style={{ background: m.color }}
                />
                <div className="admin-date-search__item-label">{m.label}</div>
                <div className="admin-date-search__item-value">{fmt(result[m.key])}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserCountDetail({ label, labelBg, labelColor, data, loading }) {
  const fmt = (n) => n != null ? Number(n).toLocaleString() : (loading ? '...' : '-')

  const cols = [
    { key: 'total',   name: '전체' },
    { key: 'student', name: '학생' },
    { key: 'teacher', name: '선생님' },
    { key: 'admin',   name: '관리자' },
  ]

  return (
    <div className="admin-user-count-row">
      <div
        className="admin-user-count-row__label"
        style={{ background: labelBg, color: labelColor }}
      >
        {label}
      </div>
      <div className="admin-user-count-row__cols">
        {cols.map((col) => (
          <div key={col.key} className="admin-user-count-col">
            <div className="admin-user-count-col__value">{fmt(data?.[col.key])}</div>
            <div className="admin-user-count-col__name">{col.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// VerificationStatus 정의 및 표시 메타
const VERIFICATION_STATUS = {
  PENDING:  { label: '대기 중',  bg: 'var(--butter-bg)',   color: '#92400E' },
  APPROVED: { label: '승인됨',   bg: 'var(--mint-bg)',     color: 'var(--teal-dark)' },
  REJECTED: { label: '거절됨',   bg: 'var(--peach-bg)',    color: 'var(--coral-dark)' },
}

const STATUS_TABS = [
  { value: '',         label: '전체' },
  { value: 'PENDING',  label: '대기 중' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
]

const PAGE_SIZE = 12

// 회원 관리 — 회원 상태 탭
const USER_STATUS_TABS = [
  { value: 'active',   label: '활성 회원',   icon: '✅', endpoint: '/api/v1/admin/users' },
  { value: 'inactive', label: '비활성 회원', icon: '⏸️', endpoint: '/api/v1/admin/users/inactive' },
  { value: 'deleted',  label: '탈퇴 회원',   icon: '🗑️', endpoint: '/api/v1/admin/users/deleted' },
]

// 회원 관리 — 역할 필터 탭
const USER_ROLE_TABS = [
  { value: '',        label: '전체' },
  { value: 'STUDENT', label: '학생' },
  { value: 'TEACHER', label: '선생님' },
  { value: 'ADMIN',   label: '관리자' },
]

// UserRole → 표시 메타
const USER_ROLE_META = {
  STUDENT: { label: '학생',   bg: 'var(--sky-bg)',    color: '#0369A1' },
  TEACHER: { label: '선생님', bg: 'var(--mint-bg)',   color: 'var(--teal-dark)' },
  ADMIN:   { label: '관리자', bg: 'var(--butter-bg)', color: '#92400E' },
}

/** 선생님 가입 승인 패널 */
function TeacherApprovalPanel() {
  const [status, setStatus]           = useState('')
  const [page, setPage]               = useState(0)
  const [items, setItems]             = useState([])
  const [totalPages, setTotalPages]   = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [selectedId, setSelectedId]   = useState(null)  // 상세 모달용

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({ page, size: PAGE_SIZE, sort: 'createdAt,desc' })
    if (status) params.set('status', status)

    authFetch(`${API_BASE_URL}/api/v1/admin/teacher-verifications?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setItems(data.content ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [status, page])

  // 탭 변경 시 페이지 초기화
  const handleStatusChange = (val) => { setStatus(val); setPage(0) }
  const goPage = (p) => { if (p >= 0 && p < totalPages) setPage(p) }

  const fmtDate = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-content__header">
        <h1 className="admin-content__title">🧑‍🏫 선생님 가입 승인</h1>
        <p className="admin-content__sub">가입 신청한 선생님 목록을 검토하고 승인 또는 반려합니다.</p>
      </div>

      {/* 상태 필터 탭 */}
      <div className="admin-status-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`admin-status-tab${status === tab.value ? ' active' : ''}`}
            onClick={() => handleStatusChange(tab.value)}
          >
            {tab.label}
            {tab.value === '' && !loading && (
              <span className="admin-status-tab__count">{totalElements.toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="admin-table-card">
        {/* 헤더 */}
        <div className="admin-table-header">
          <div className="admin-table-col col-id">신청 ID</div>
          <div className="admin-table-col col-name">이름</div>
          <div className="admin-table-col col-userid">회원 ID</div>
          <div className="admin-table-col col-status">상태</div>
          <div className="admin-table-col col-date">신청일</div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="admin-table-empty">목록을 불러오는 중...</div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="admin-table-empty error">데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
        )}

        {/* 데이터 없음 */}
        {!loading && !error && items.length === 0 && (
          <div className="admin-table-empty">해당하는 신청 내역이 없어요.</div>
        )}

        {/* 데이터 행 */}
        {!loading && !error && items.map((item) => {
          const meta = VERIFICATION_STATUS[item.status] ?? { label: item.status, bg: '#F3F4F6', color: 'var(--ink-mute)' }
          return (
            <div
              key={item.verificationId}
              className="admin-table-row clickable"
              onClick={() => setSelectedId(item.verificationId)}
            >
              <div className="admin-table-col col-id">#{item.verificationId}</div>
              <div className="admin-table-col col-name">
                <div className="admin-teacher-avatar">{item.teacherName?.[0] ?? '?'}</div>
                {item.teacherName}
              </div>
              <div className="admin-table-col col-userid">{item.userId}</div>
              <div className="admin-table-col col-status">
                <span
                  className="admin-status-badge"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
              <div className="admin-table-col col-date">{fmtDate(item.createdAt)}</div>
            </div>
          )
        })}
      </div>

      {/* 페이지네이션 */}
      {!loading && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goPage} />
      )}

      {/* 상세 모달 */}
      {selectedId !== null && (
        <VerificationDetailModal
          verificationId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

// DocumentType 표시 레이블
const DOCUMENT_TYPE_LABEL = {
  DEGREE:       '학위증',
  CERTIFICATE:  '자격증',
  CAREER:       '경력증명서',
  ID:           '신분증',
  OTHER:        '기타',
}

/**
 * 선생님 가입 신청 상세 모달
 * - verificationId로 GET /api/v1/admin/teacher-verifications/{verificationId} 호출
 * - 오버레이 클릭 또는 닫기 버튼으로 닫힘
 */
function VerificationDetailModal({ verificationId, onClose }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  // 승인/거절 액션 상태
  // confirmMode: null | 'approve' | 'reject'
  const [confirmMode, setConfirmMode]       = useState(null)
  const [rejectReason, setRejectReason]     = useState('')
  const [actionLoading, setActionLoading]   = useState(false)
  const [actionError, setActionError]       = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    authFetch(`${API_BASE_URL}/api/v1/admin/teacher-verifications/${verificationId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then((data) => { if (!cancelled) setDetail(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [verificationId])

  // ESC 키로 닫기 (confirmMode 진입 시엔 confirmMode 먼저 취소)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (confirmMode) { setConfirmMode(null); setActionError('') }
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, confirmMode])

  const fmtDateTime = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const statusMeta = detail
    ? (VERIFICATION_STATUS[detail.status] ?? { label: detail.status, bg: '#F3F4F6', color: 'var(--ink-mute)' })
    : null

  /** 승인 처리 */
  const handleApprove = () => {
    setActionLoading(true)
    setActionError('')
    authFetch(`${API_BASE_URL}/api/v1/admin/teacher-verifications/${verificationId}/approve`, {
      method: 'PATCH',
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        // 상태 낙관적 업데이트 후 모달 닫기
        setDetail((prev) => ({ ...prev, status: 'APPROVED' }))
        setConfirmMode(null)
        onClose()
      })
      .catch(() => setActionError('승인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'))
      .finally(() => setActionLoading(false))
  }

  /** 거절 처리 */
  const handleReject = () => {
    setActionLoading(true)
    setActionError('')
    const rejectUrl = new URL(`${API_BASE_URL}/api/v1/admin/teacher-verifications/${verificationId}/reject`)
    if (rejectReason.trim()) rejectUrl.searchParams.set('rejectReason', rejectReason.trim())
    authFetch(rejectUrl.toString(), { method: 'PATCH' })
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        setDetail((prev) => ({ ...prev, status: 'REJECTED', rejectedReason: rejectReason.trim() || null }))
        setConfirmMode(null)
        onClose()
      })
      .catch(() => setActionError('거절 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'))
      .finally(() => setActionLoading(false))
  }

  return (
    <div className="admin-modal-overlay" onClick={() => { if (!confirmMode) onClose() }}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="admin-modal__header">
          <div className="admin-modal__title">신청 상세 정보</div>
          <button className="admin-modal__close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="admin-modal__loading">상세 정보를 불러오는 중...</div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="admin-modal__error">정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
        )}

        {/* 상세 내용 */}
        {!loading && !error && detail && (
          <div className="admin-modal__body">

            {/* 신청자 요약 */}
            <div className="admin-modal__hero">
              <div className="admin-modal__avatar">{detail.teacherName?.[0] ?? '?'}</div>
              <div>
                <div className="admin-modal__name">{detail.teacherName} 선생님</div>
                <div className="admin-modal__meta">회원 ID {detail.userId} · 신청 #{detail.verificationId}</div>
              </div>
              <span
                className="admin-status-badge"
                style={{ background: statusMeta.bg, color: statusMeta.color, marginLeft: 'auto' }}
              >
                {statusMeta.label}
              </span>
            </div>

            {/* 기본 정보 */}
            <div className="admin-modal__section">
              <div className="admin-modal__section-title">📋 기본 정보</div>
              <div className="admin-modal__rows">
                <DetailRow label="신청일"    value={fmtDateTime(detail.createdAt)} />
                <DetailRow label="검토일"    value={fmtDateTime(detail.reviewedAt)} />
                <DetailRow label="서류 유형" value={DOCUMENT_TYPE_LABEL[detail.documentType] ?? detail.documentType ?? '-'} />
              </div>
            </div>

            {/* 자기소개 (항상 표시, 없으면 빈칸) */}
            <div className="admin-modal__section">
              <div className="admin-modal__section-title">📝 자기소개</div>
              <p className="admin-modal__desc">{detail.description || ''}</p>
            </div>

            {/* 제출 서류 (항상 표시, 없으면 빈칸) */}
            <div className="admin-modal__section">
              <div className="admin-modal__section-title">📎 제출 서류</div>
              {detail.documentUrl ? (
                <a
                  href={detail.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-modal__doc-link"
                >
                  서류 보기 →
                </a>
              ) : (
                <p className="admin-modal__desc admin-modal__desc--empty">첨부된 서류가 없습니다.</p>
              )}
            </div>

            {/* 거절 사유 (REJECTED일 때 항상 표시, 사유 없으면 빈칸) */}
            {detail.status === 'REJECTED' && (
              <div className="admin-modal__section">
                <div className="admin-modal__section-title">❌ 거절 사유</div>
                <p className="admin-modal__reject-reason">{detail.rejectedReason || ''}</p>
              </div>
            )}

            {/* ── 승인 / 거절 액션 영역 (PENDING일 때만) ── */}
            {detail.status === 'PENDING' && (
              <div className="admin-modal__action-area">

                {/* 기본 버튼 행 */}
                {!confirmMode && (
                  <div className="admin-modal__action-row">
                    <button
                      className="admin-action-btn admin-action-btn--approve"
                      onClick={() => { setConfirmMode('approve'); setActionError('') }}
                    >
                      ✅ 승인
                    </button>
                    <button
                      className="admin-action-btn admin-action-btn--reject"
                      onClick={() => { setConfirmMode('reject'); setRejectReason(''); setActionError('') }}
                    >
                      ❌ 거절
                    </button>
                  </div>
                )}

                {/* 승인 확인 */}
                {confirmMode === 'approve' && (
                  <div className="admin-modal__confirm">
                    <p className="admin-modal__confirm-msg">선생님 가입을 승인하시겠습니까?</p>
                    {actionError && <p className="admin-modal__action-error">{actionError}</p>}
                    <div className="admin-modal__confirm-btns">
                      <button
                        className="admin-action-btn admin-action-btn--approve"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        {actionLoading ? '처리 중...' : '승인'}
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn--cancel"
                        onClick={() => { setConfirmMode(null); setActionError('') }}
                        disabled={actionLoading}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 거절 — 사유 입력 + 확인 */}
                {confirmMode === 'reject' && (
                  <div className="admin-modal__confirm">
                    <p className="admin-modal__confirm-msg">선생님 가입을 거절하시겠습니까?</p>
                    <label className="admin-modal__reject-label">
                      거절 사유 <span className="admin-modal__optional">(선택)</span>
                    </label>
                    <textarea
                      className="admin-modal__reject-input"
                      rows={3}
                      placeholder="거절 사유를 입력하세요."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      disabled={actionLoading}
                    />
                    {actionError && <p className="admin-modal__action-error">{actionError}</p>}
                    <div className="admin-modal__confirm-btns">
                      <button
                        className="admin-action-btn admin-action-btn--reject"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        {actionLoading ? '처리 중...' : '거절'}
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn--cancel"
                        onClick={() => { setConfirmMode(null); setActionError('') }}
                        disabled={actionLoading}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

/** 상세 모달 내 라벨-값 한 줄 */
function DetailRow({ label, value }) {
  return (
    <div className="admin-detail-row">
      <div className="admin-detail-row__label">{label}</div>
      <div className="admin-detail-row__value">{value}</div>
    </div>
  )
}

/** 회원 관리 패널 */
function UserManagementPanel() {
  const [statusTab, setStatusTab] = useState('active')   // 'active' | 'inactive' | 'deleted'
  const [roleTab, setRoleTab]     = useState('')          // '' | 'STUDENT' | 'TEACHER' | 'ADMIN'
  const [page, setPage]           = useState(0)

  const [items, setItems]               = useState([])
  const [totalPages, setTotalPages]     = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  const currentEndpoint = USER_STATUS_TABS.find((t) => t.value === statusTab)?.endpoint ?? '/api/v1/admin/users'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({ page, size: PAGE_SIZE, sort: 'createdAt,desc' })
    if (roleTab) params.set('role', roleTab)

    authFetch(`${API_BASE_URL}${currentEndpoint}?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setItems(data.content ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [statusTab, roleTab, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (val) => { setStatusTab(val); setRoleTab(''); setPage(0) }
  const handleRoleChange   = (val) => { setRoleTab(val);   setPage(0) }
  const goPage = (p) => { if (p >= 0 && p < totalPages) setPage(p) }

  const fmtDate = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  const activeStatusMeta = USER_STATUS_TABS.find((t) => t.value === statusTab)

  return (
    <div className="admin-dashboard">
      <div className="admin-content__header">
        <h1 className="admin-content__title">👥 회원 관리</h1>
        <p className="admin-content__sub">회원 목록을 조회하고 계정 상태를 확인합니다.</p>
      </div>

      {/* 회원 상태 탭 (큰 버튼) */}
      <div className="admin-user-status-tabs">
        {USER_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`admin-user-status-tab${statusTab === tab.value ? ' active' : ''}`}
            onClick={() => handleStatusChange(tab.value)}
          >
            <span className="admin-user-status-tab__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 역할 필터 탭 (작은 버튼) */}
      <div className="admin-status-tabs" style={{ marginBottom: 16 }}>
        {USER_ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`admin-status-tab${roleTab === tab.value ? ' active' : ''}`}
            onClick={() => handleRoleChange(tab.value)}
          >
            {tab.label}
            {tab.value === '' && !loading && (
              <span className="admin-status-tab__count">{totalElements.toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="admin-table-card">
        <div className="admin-table-header admin-user-table-header">
          <div className="admin-table-col col-id">회원 ID</div>
          <div className="admin-table-col col-name">이름</div>
          <div className="admin-table-col col-role">역할</div>
          <div className="admin-table-col col-date">가입일</div>
        </div>

        {loading && (
          <div className="admin-table-empty">목록을 불러오는 중...</div>
        )}
        {!loading && error && (
          <div className="admin-table-empty error">데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="admin-table-empty">해당하는 회원이 없어요.</div>
        )}

        {!loading && !error && items.map((item) => {
          const roleMeta = USER_ROLE_META[item.role] ?? { label: item.role, bg: '#F3F4F6', color: 'var(--ink-mute)' }
          return (
            <div
              key={item.id}
              className="admin-table-row admin-user-table-row clickable"
              onClick={() => setSelectedUserId(item.id)}
            >
              <div className="admin-table-col col-id">{item.id}</div>
              <div className="admin-table-col col-name">
                <div className="admin-teacher-avatar">{item.name?.[0] ?? '?'}</div>
                {item.name}
              </div>
              <div className="admin-table-col col-role">
                <span
                  className="admin-status-badge"
                  style={{ background: roleMeta.bg, color: roleMeta.color }}
                >
                  {roleMeta.label}
                </span>
              </div>
              <div className="admin-table-col col-date">{fmtDate(item.createdAt)}</div>
            </div>
          )
        })}
      </div>

      {/* 페이지네이션 */}
      {!loading && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goPage} />
      )}

      {/* 회원 상세 모달 */}
      {selectedUserId !== null && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  )
}

// Gender 표시 레이블
const GENDER_LABEL = { MALE: '남성', FEMALE: '여성' }

// 계정 상태 뱃지
function AccountStatusBadge({ isActive, isDeleted }) {
  if (isDeleted) return <span className="admin-status-badge" style={{ background: '#F3F4F6', color: '#6B7280' }}>탈퇴</span>
  if (!isActive)  return <span className="admin-status-badge" style={{ background: 'var(--peach-bg)', color: 'var(--coral-dark)' }}>비활성</span>
  return <span className="admin-status-badge" style={{ background: 'var(--mint-bg)', color: 'var(--teal-dark)' }}>활성</span>
}

/** 회원 상세 모달 */
function UserDetailModal({ userId, onClose }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    authFetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then((data) => { if (!cancelled) setDetail(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const fmtDate     = (iso) => iso ? new Date(iso).toLocaleDateString('ko-KR') : '-'
  const fmtDateTime = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const roleMeta = detail ? (USER_ROLE_META[detail.role] ?? { label: detail.role, bg: '#F3F4F6', color: 'var(--ink-mute)' }) : null

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="admin-modal__header">
          <div className="admin-modal__title">회원 상세 정보</div>
          <button className="admin-modal__close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {loading && <div className="admin-modal__loading">정보를 불러오는 중...</div>}
        {!loading && error && <div className="admin-modal__error">정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>}

        {!loading && !error && detail && (
          <div className="admin-modal__body">

            {/* 요약 헤더 */}
            <div className="admin-modal__hero">
              <div className="admin-modal__avatar">{detail.name?.[0] ?? '?'}</div>
              <div>
                <div className="admin-modal__name">{detail.name}</div>
                <div className="admin-modal__meta">{detail.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className="admin-status-badge" style={{ background: roleMeta.bg, color: roleMeta.color }}>
                  {roleMeta.label}
                </span>
                <AccountStatusBadge isActive={detail.isActive} isDeleted={detail.isDeleted} />
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="admin-modal__section">
              <div className="admin-modal__section-title">👤 기본 정보</div>
              <div className="admin-modal__rows">
                <DetailRow label="회원 ID"   value={detail.id} />
                <DetailRow label="전화번호"  value={detail.phone || '-'} />
                <DetailRow label="성별"      value={GENDER_LABEL[detail.gender] ?? detail.gender ?? '-'} />
                <DetailRow label="생년월일"  value={fmtDate(detail.birthDate)} />
                {detail.role === 'TEACHER' && (
                  <DetailRow label="선생님 인증" value={detail.isVerified ? '✅ 인증 완료' : '❌ 미인증'} />
                )}
                <DetailRow label="마케팅 동의" value={detail.marketingAgreed ? '동의' : '미동의'} />
                <DetailRow label="가입일"    value={fmtDateTime(detail.createdAt)} />
                <DetailRow label="정보 수정일" value={fmtDateTime(detail.updatedAt)} />
                {detail.isDeleted && (
                  <DetailRow label="탈퇴일" value={fmtDateTime(detail.deletedAt)} />
                )}
              </div>
            </div>

            {/* 학생 프로필 (role === STUDENT) */}
            {detail.role === 'STUDENT' && (
              <div className="admin-modal__section">
                <div className="admin-modal__section-title">🎒 학생 프로필</div>
                <div className="admin-modal__rows">
                  <DetailRow label="학년"       value={detail.grade || '-'} />
                  <DetailRow label="관심 과목"  value={detail.interestSubjects || '-'} />
                  <DetailRow label="지역"       value={detail.region || '-'} />
                  <DetailRow label="학습 목표"  value={detail.goal || '-'} />
                  <DetailRow label="프로필 등록일" value={fmtDateTime(detail.profileCreatedAt)} />
                </div>
              </div>
            )}

            {/* 선생님 프로필 (role === TEACHER) */}
            {detail.role === 'TEACHER' && (
              <div className="admin-modal__section">
                <div className="admin-modal__section-title">🧑‍🏫 선생님 프로필</div>
                <div className="admin-modal__rows">
                  <DetailRow label="학력"        value={detail.education || '-'} />
                  <DetailRow label="경력"        value={detail.career || '-'} />
                  <DetailRow label="수상 내역"   value={detail.awards || '-'} />
                  <DetailRow label="주소"        value={detail.address || '-'} />
                  <DetailRow label="교습 스타일" value={detail.teachingStyle || '-'} />
                  <DetailRow label="내공 점수"   value={detail.naegongScore ?? '-'} />
                  <DetailRow label="총 수업 시간" value={detail.totalTeachingHours != null ? `${detail.totalTeachingHours}h` : '-'} />
                  <DetailRow label="프로필 등록일" value={fmtDateTime(detail.profileCreatedAt)} />
                </div>
                {detail.introduction && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-mute)', marginBottom: 6 }}>소개</div>
                    <p className="admin-modal__desc">{detail.introduction}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 윈도우 페이지네이션 컴포넌트
 * - 현재 페이지 ±2 범위만 버튼으로 표시
 * - 첫/마지막 페이지는 항상 표시, 중간 생략 시 … 표시
 * - page, totalPages: 0-based
 */
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  // 표시할 페이지 번호 목록 생성 (0-based)
  const getPages = () => {
    const pages = []
    const WINDOW = 2  // 현재 페이지 기준 양쪽 범위

    const addPage = (p) => {
      if (pages.at(-1) === '…' || pages.at(-1) === p) return
      if (pages.length > 0 && p - pages.at(-1) === 2) {
        // 딱 한 칸 건너뛰는 경우 … 대신 해당 번호를 채움
        pages.push(p - 1)
      } else if (pages.length > 0 && p - pages.at(-1) > 1) {
        pages.push('…')
      }
      pages.push(p)
    }

    addPage(0)
    for (let i = Math.max(1, page - WINDOW); i <= Math.min(totalPages - 2, page + WINDOW); i++) {
      addPage(i)
    }
    addPage(totalPages - 1)

    return pages
  }

  const pages = getPages()

  return (
    <div className="pagination" style={{ marginTop: 20 }}>
      <div
        className={`page-num${page === 0 ? ' disabled' : ''}`}
        onClick={() => page > 0 && onPageChange(page - 1)}
      >
        ‹
      </div>
      {pages.map((p, i) =>
        p === '…' ? (
          <div key={`ellipsis-${i}`} className="page-num page-num--ellipsis">…</div>
        ) : (
          <div
            key={p}
            className={`page-num${p === page ? ' active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </div>
        )
      )}
      <div
        className={`page-num${page === totalPages - 1 ? ' disabled' : ''}`}
        onClick={() => page < totalPages - 1 && onPageChange(page + 1)}
      >
        ›
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
