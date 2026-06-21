/**
 * @file room/ClassroomOverlays.jsx
 * @description 강의실 비차단 오버레이 모음 — 상단 공지 배너 / 수업 종료 전체화면 안내 / 떠오르는 리액션.
 */

/** 상단 중앙 공지 배너(업로드 실패 등 일시 안내). */
export function NoticeBanner({ notice }) {
  if (!notice) return null
  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#111827', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
      {notice}
    </div>
  )
}

/** 수업 종료 시 자동 퇴장 전 전체 화면 안내. */
export function EndedOverlay({ ended }) {
  if (!ended) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(17,24,39,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 34px', maxWidth: 360, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔚</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 6 }}>{ended}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>잠시 후 메인 페이지로 이동합니다…</div>
      </div>
    </div>
  )
}

/** 손흔들기/좋아요 — 보드 하단 중앙에서 떠오르며 사라짐. */
export function ReactionsOverlay({ reactions = [] }) {
  return (
    <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 10, pointerEvents: 'none' }}>
      {reactions.map((r) => (
        <div key={r.key} className="reaction-float" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 34 }}>{r.emoji}</span>
          {r.name && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '1px 6px', borderRadius: 8 }}>{r.name}</span>}
        </div>
      ))}
    </div>
  )
}
