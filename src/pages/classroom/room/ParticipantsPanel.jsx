/**
 * @file room/ParticipantsPanel.jsx
 * @description 현재 강의실에 접속한 참가자 목록 패널(LiveKit tiles 기준). 본인은 "(나)"로 표시.
 */
export default function ParticipantsPanel({ tiles = [], onClose }) {
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 104, zIndex: 120, width: 220, maxHeight: 300, overflowY: 'auto', background: '#fff', border: '1px solid var(--soft-border)', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.18)', padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontWeight: 800, color: '#374151' }}>참가자 {tiles.length}</span>
        <button onClick={onClose} title="닫기" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>✕</button>
      </div>
      {tiles.length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, padding: '6px 4px' }}>접속한 참가자가 없습니다.</div>}
      {tiles.map((t) => (
        <div key={t.identity} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderRadius: 6 }}>
          <span style={{ fontSize: 16 }}>{t.isLocal ? '🙋' : '👤'}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: t.isLocal ? 800 : 600, color: '#334155' }}>
            {t.name}{t.isLocal ? ' (나)' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
