/**
 * @file room/VideoDock.jsx
 * @description 강의실 화상 패널(프레젠테이션). 드래그 이동 핸들 · 전체 보이기/숨기기 · 전체 작게(원)/크게 토글 ·
 * 연결 상태/오디오 차단 안내 · 참가자 타일 목록(선생님은 학생 타일 아래 "그리기 허용" 토글).
 */
import VideoTile from '../VideoTile.jsx'

export default function VideoDock({
  panelRef, pos, onDragStart,
  media, isVideosAllVisible, setIsVideosAllVisible,
  collapsedOrbs, toggleOrb, allCollapsed, cycleAllOrbs, onFocusTile,
  isTeacher, roster, toggleStudentDraw,
}) {
  return (
    <div
      className="video-toggle-container"
      ref={panelRef}
      style={pos ? { left: pos.left, top: pos.top, right: 'auto' } : undefined}
    >
      {/* 드래그 핸들 — 잡고 끌면 화상 패널 전체가 한꺼번에 이동 */}
      <div
        onPointerDown={onDragStart}
        title="드래그해서 화상창 위치 이동"
        style={{ alignSelf: 'center', cursor: 'grab', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: '2px 8px', background: 'rgba(255,255,255,0.9)', borderRadius: 8, border: '1px solid var(--soft-border)', userSelect: 'none', touchAction: 'none' }}
      >⠿⠿</div>

      {/* 눈: 전체 화상 보이기/숨기기  +  화살표: 전체 작게(원)/크게(사각) 토글 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="master-toggle" onClick={() => setIsVideosAllVisible((v) => !v)} title={isVideosAllVisible ? '모든 화상 숨기기' : '모든 화상 보이기'}>
          {isVideosAllVisible ? '👁️' : '🕶️'}
        </button>
        {isVideosAllVisible && media.tiles.length > 0 && (
          <button className="master-toggle" onClick={cycleAllOrbs} title={allCollapsed ? '전체 크게 보기' : '전체 작게(원형)'}>
            {allCollapsed ? '🔼' : '🔽'}
          </button>
        )}
      </div>

      {/* 연결 상태 / 오디오 차단 안내 */}
      {media.status === 'connecting' && <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>화상 연결 중…</div>}
      {media.status === 'error' && <div style={{ fontSize: 11, color: '#b91c1c', fontWeight: 700 }} title={String(media.error?.message || '')}>화상 연결 실패</div>}
      {media.audioBlocked && <button className="master-toggle" onClick={media.resumeAudio} title="소리 켜기">🔊</button>}
      {media.shareBlocked && <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>다른 참가자가 화면공유 중이에요</div>}

      {isVideosAllVisible && media.tiles.map((tile) => {
        // 선생님 화면: 학생(내 타일 아님) 아래에 "그리기 허용" 토글. identity 형식은 user-{userId}.
        const uid = String(tile.identity).replace(/^user-/, '')
        const allowed = !!roster[uid]?.canDraw
        const hasRoster = !!roster[uid]
        return (
          <div key={tile.identity} className="p-orb-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <VideoTile
              tile={tile}
              collapsed={collapsedOrbs.has(tile.identity)}
              onSingleClick={() => toggleOrb(tile.identity)}
              onDoubleClick={() => onFocusTile(tile.identity)}
            />
            {isTeacher && !tile.isLocal && hasRoster && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleStudentDraw(uid) }}
                title={allowed ? '판서 허용됨 — 클릭하면 회수' : '이 학생에게 판서를 허용'}
                style={{
                  marginTop: 5, fontSize: 10, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                  border: 'none', borderRadius: 999, padding: '3px 9px', color: '#fff',
                  background: allowed ? '#10b981' : 'rgba(0,0,0,0.55)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              >
                {allowed ? '✏️ 판서 허용됨' : '✏️ 그리기 허용'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
