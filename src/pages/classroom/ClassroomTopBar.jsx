/**
 * @file ClassroomTopBar.jsx
 * @description 강의실 상단 정보 헤더 컴포넌트
 * - 수업 제목, 진행 시간, 현재 접속 상태 등을 간결하게 표시합니다.
 */
export default function ClassroomTopBar() {
  return (
    <header className="soft-bottom-nav" style={{ height: '56px', justifyContent: 'space-between', borderRadius: '16px', borderTop: 'none', border: '1px solid var(--soft-border)' }}>
      {/* 좌측: 로고 및 수업 명칭 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '20px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--soft-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>S</div>
        <span style={{ fontSize: '14px', fontWeight: 800 }}>고2 미적분 심화반 (A)</span>
      </div>

      {/* 우측: 수업 상태 및 타이머 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingRight: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>● LIVE SESSION 01:22:12</span>
        {/* 사용자 아바타 플레이스홀더 */}
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid var(--soft-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
          JS
        </div>
      </div>
    </header>
  )
}
