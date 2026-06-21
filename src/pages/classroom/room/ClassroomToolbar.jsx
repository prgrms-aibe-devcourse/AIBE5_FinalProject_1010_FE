/**
 * @file room/ClassroomToolbar.jsx
 * @description 강의실 좌측 그리기 도구 바(프레젠테이션). 도구 그룹/플라이아웃 · 이미지/PDF/오디오 불러오기 ·
 * 전체 지우기 · 색상 프리셋/직접선택. 판서 권한 없으면(myCanDraw=false) 그리기 도구는 비활성(보기 도구 제외).
 * 화면보다 길면 위/아래 화살표로 스크롤.
 */
import { TOOL_GROUPS, TOOL_SHORTCUTS, PRESET_COLORS } from './useDrawingTools.js'

const shortcutBadgeStyle = {
  position: 'absolute', right: 2, bottom: 1, minWidth: 13, maxWidth: 28, height: 10, padding: '0 2px',
  borderRadius: 4, background: 'rgba(17,24,39,0.86)', color: '#fff', fontSize: 7, lineHeight: '10px',
  fontWeight: 900, textAlign: 'center', pointerEvents: 'none', letterSpacing: 0, transform: 'translateZ(0)',
}
const ShortcutBadge = ({ value }) => (value ? <span style={shortcutBadgeStyle}>{value}</span> : null)

export default function ClassroomToolbar({
  fsAsideStyle, myCanDraw, isTeacher,
  tool, color, setColor, onClearAll, wbRef, onPickAudio,
  scrollRef, arrows, onScrollUpdate, scrollBy,
  flyout, groupItem, groupShortcut, selectSub, onGroupDown, clearPress, onGroupClick,
}) {
  const drawOnlyDisabledStyle = !myCanDraw ? { opacity: 0.35, pointerEvents: 'none', filter: 'grayscale(1)' } : null

  return (
    <aside
      className="side-drawing-bar"
      style={fsAsideStyle}
      title={!myCanDraw ? '손바닥/확대/축소는 사용할 수 있고, 판서는 선생님 허용 후 사용할 수 있어요' : undefined}
    >
      <button className="side-scroll-arrow" onClick={() => scrollBy(-160)} title="위 도구 보기" style={{ visibility: arrows.up ? 'visible' : 'hidden' }}>▲</button>
      <div className="side-drawing-scroll" ref={scrollRef} onScroll={onScrollUpdate}>
        {TOOL_GROUPS.map((g) => {
          const active = g.items.some((i) => i.key === tool)
          const disabled = !myCanDraw && !g.viewOnly
          return (
            <div key={g.key} style={{ position: 'relative', opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', filter: disabled ? 'grayscale(1)' : 'none' }}>
              <div
                className={`draw-btn ${active ? 'active' : ''}`}
                title={disabled ? '선생님이 판서를 허용해야 사용할 수 있어요' : (g.single ? g.items[0].label : `${groupItem(g).label} (길게 눌러 변경)`)}
                onPointerDown={() => onGroupDown(g)}
                onPointerUp={clearPress}
                onClick={() => onGroupClick(g)}
                onPointerLeave={clearPress}
                style={{ position: 'relative' }}
              >
                {groupItem(g).icon}
                <ShortcutBadge value={groupShortcut(g)} />
                {!g.single && <span style={{ position: 'absolute', right: 2, top: -2, fontSize: 9, color: '#9ca3af' }}>▾</span>}
              </div>
              {flyout === g.key && !g.single && (
                <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 'calc(100% + 8px)', top: 0, zIndex: 50, display: 'flex', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  {g.items.map((it) => (
                    <button key={it.key} title={it.label} onClick={() => selectSub(g, it.key)}
                      style={{ position: 'relative', width: 38, height: 38, fontSize: 17, border: tool === it.key ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', paddingBottom: 8 }}>
                      {it.icon}
                      <ShortcutBadge value={TOOL_SHORTCUTS[it.key]} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {/* 사진 불러오기 (여러 장) */}
        <label className="draw-btn" title={myCanDraw ? '사진 불러오기 (여러 장)' : '선생님이 판서를 허용해야 사용할 수 있어요'} style={{ cursor: 'pointer', ...drawOnlyDisabledStyle }}>
          🖼️
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={(e) => { wbRef.current?.addImages(e.target.files); e.target.value = '' }} />
        </label>
        <label className="draw-btn" title={myCanDraw ? 'PDF 불러오기' : '선생님이 판서를 허용해야 사용할 수 있어요'} style={{ cursor: 'pointer', fontSize: 11, fontWeight: 900, ...drawOnlyDisabledStyle }}>
          PDF
          <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }}
            onChange={(e) => { wbRef.current?.addPdf(e.target.files); e.target.value = '' }} />
        </label>
        {/* 듣기 자료(오디오) 불러오기 — 선생님만. 업로드 후 전원 동기화 재생(이슈 #117). */}
        {isTeacher && (
          <label className="draw-btn" title="듣기 자료(오디오) 불러오기 — 전원 동기화 재생" style={{ cursor: 'pointer', fontSize: 16 }}>
            🎧
            <input type="file" accept="audio/*" multiple style={{ display: 'none' }} onChange={onPickAudio} />
          </label>
        )}
        {/* 전체 지우기 */}
        <div className="draw-btn" title={myCanDraw ? '전체 지우기' : '선생님이 판서를 허용해야 사용할 수 있어요'} onClick={onClearAll} style={drawOnlyDisabledStyle || undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <g transform="rotate(-32 12 13)">
              <rect x="3" y="9" width="17" height="8" rx="2" fill="#fbcfe8" stroke="#db2777" strokeWidth="1.6" />
              <rect x="13" y="9" width="7" height="8" rx="2" fill="#f9a8d4" stroke="#db2777" strokeWidth="1.6" />
            </g>
            <line x1="3" y1="21" x2="21" y2="21" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ width: '30px', height: '1px', background: 'var(--soft-border)', margin: '12px 0' }}></div>

        {/* 색상: 프리셋 + 임의 색 선택(네이티브 컬러피커) */}
        {PRESET_COLORS.map((c) => (
          <div
            key={c}
            className="draw-color-circle"
            style={{ background: c, border: c === '#ffffff' ? '1px solid var(--soft-border,#e5e7eb)' : 'none', outline: color.toLowerCase() === c ? '2px solid #2563eb' : 'none', outlineOffset: 2, ...drawOnlyDisabledStyle }}
            title={myCanDraw ? `색상 ${c}` : '선생님이 판서를 허용해야 사용할 수 있어요'}
            onClick={() => setColor(c)}
          ></div>
        ))}
        <label
          className="draw-color-picker"
          title={myCanDraw ? '색상 직접 선택' : '선생님이 판서를 허용해야 사용할 수 있어요'}
          style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--soft-border,#e5e7eb)', display: 'inline-block', position: 'relative', ...drawOnlyDisabledStyle }}
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#111111'}
            onChange={(e) => setColor(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', border: 'none', padding: 0 }}
          />
        </label>
      </div>
      <button className="side-scroll-arrow" onClick={() => scrollBy(160)} title="아래 도구 보기" style={{ visibility: arrows.down ? 'visible' : 'hidden' }}>▼</button>
    </aside>
  )
}
