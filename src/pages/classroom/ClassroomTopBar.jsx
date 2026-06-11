/**
 * @file ClassroomTopBar.jsx
 * @description 강의실 상단 정보 헤더 컴포넌트
 * - 수업 제목과 현재 LIVE 상태를 표시합니다.
 * @param {{title?:string, live?:boolean}} props
 */
export default function ClassroomTopBar({ title, live = true }) {
  return (
    <header className="soft-bottom-nav" style={{ height: '56px', justifyContent: 'space-between', borderRadius: '16px', borderTop: 'none', border: '1px solid var(--soft-border)' }}>
      {/* 좌측: 로고 및 수업 명칭 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '20px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--soft-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>S</div>
        <span style={{ fontSize: '14px', fontWeight: 800 }}>{title || '실시간 강의실'}</span>
      </div>

      {/* 우측: 수업 상태 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingRight: '20px' }}>
        {live && <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>● LIVE</span>}
      </div>
    </header>
  )
}
