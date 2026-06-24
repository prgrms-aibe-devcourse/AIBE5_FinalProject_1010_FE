/**
 * @file whiteboard/OptionsBar.jsx
 * @description 화이트보드 상단 옵션바 — 선굵기/투명도 슬라이더, (텍스트)글꼴·크기·굵기, (다각형)각수.
 */
import { FONTS, POLYGON_MIN, POLYGON_MAX } from './constants.js'

import ClassroomQuizPanel from '../room/ClassroomQuizPanel.jsx'

const divider = <span style={{ width: 1, height: 20, background: '#eee' }} />
const labelStyle = { display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontWeight: 700 }
const viewBtnStyle = (active = false) => ({
  width: 34,
  height: 32,
  border: active ? '2px solid #2563eb' : '1px solid #e5e7eb',
  borderRadius: 7,
  background: active ? '#eff6ff' : '#fff',
  color: active ? '#1d4ed8' : '#374151',
  cursor: 'pointer',
  fontWeight: 900,
  fontSize: 13,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'visible',
  padding: 0,
})
const viewGroupStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 3,
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: '#f8fafc',
}

function ViewButton({ active = false, title, onClick, style, children }) {
  return (
    <button type="button" onClick={onClick} title={title} style={{ ...viewBtnStyle(active), ...style }}>
      <span aria-hidden>{children}</span>
    </button>
  )
}

export default function OptionsBar({
  tool,
  strokeWidth,
  onWidth,
  opacity,
  onOpacity,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  bold,
  setBold,
  polygonSides,
  setPolygonSides,
  showWidth = true,
  showOpacity = true,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSetTool,
  sessionId,
  isTeacher,
  userNames,
}) {
  const clamp = (v) => Math.max(POLYGON_MIN, Math.min(POLYGON_MAX, v))
  const zoomText = `${Math.round(zoom * 100)}%`
  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 6, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '6px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', fontSize: 12 }}>
      <span style={labelStyle}>
        보기
        <ViewButton active={tool === 'hand'} title="손바닥 이동 도구(H)" onClick={() => onSetTool?.('hand')}>✋</ViewButton>
        <span style={viewGroupStyle} title="돋보기 확대/축소 도구">
          <ViewButton active={tool === 'zoomIn'} title="확대 도구(Z)" onClick={() => onSetTool?.('zoomIn')}>⌕＋</ViewButton>
          <ViewButton active={tool === 'zoomOut'} title="축소 도구(Shift+Z)" onClick={() => onSetTool?.('zoomOut')}>⌕－</ViewButton>
        </span>
        <span style={viewGroupStyle} title="즉시 줌 조작">
          <ViewButton title="가운데 기준 축소(Ctrl+-)" onClick={onZoomOut}>－</ViewButton>
          <ViewButton title="보기 100%로 초기화(Ctrl+0)" onClick={onZoomReset} style={{ width: 48, fontSize: 12 }}>{zoomText}</ViewButton>
          <ViewButton title="가운데 기준 확대(Ctrl++)" onClick={onZoomIn}>＋</ViewButton>
        </span>
      </span>
      {divider}
      {showWidth && (
        <label style={labelStyle}>{tool === 'eraser' ? '지우개 크기' : '굵기'}
          <input type="range" min={1} max={40} value={strokeWidth} onChange={(e) => onWidth(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ width: 26, textAlign: 'right', color: '#111' }}>{strokeWidth}</span>
        </label>
      )}
      {showWidth && showOpacity && divider}
      {showOpacity && (
        <label style={labelStyle}>투명도
          <input type="range" min={10} max={100} value={Math.round(opacity * 100)} onChange={(e) => onOpacity(Number(e.target.value) / 100)} style={{ width: 80 }} />
          <span style={{ width: 34, textAlign: 'right', color: '#111' }}>{Math.round(opacity * 100)}%</span>
        </label>
      )}
      {tool === 'text' && (<>
        {divider}
        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} title="글꼴" style={{ fontSize: 12, padding: 3 }}>{FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 2 }} title="글자 크기 (px, 최대 100)">
          <input type="number" min={1} max={100} value={fontSize}
            onChange={(e) => { let v = parseInt(e.target.value, 10); if (!Number.isFinite(v)) return; v = Math.max(1, Math.min(100, v)); setFontSize(v) }}
            style={{ width: 46, fontSize: 12, padding: '3px 4px', textAlign: 'right' }} />
          <span style={{ color: '#6b7280' }}>px</span>
        </label>
        <button onClick={() => setBold((b) => !b)} title="굵게" style={{ width: 26, height: 26, fontWeight: 900, border: bold ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>B</button>
      </>)}
      {tool === 'curve' && <span style={{ color: '#6b7280' }}>점 클릭 → 더블클릭으로 완료</span>}
      {tool === 'polygon' && (<>
        {divider}
        <span style={labelStyle}>
          <span style={{ background: '#111827', color: '#fff', borderRadius: 10, padding: '1px 8px' }}>{polygonSides}각형</span>
          <button onClick={() => setPolygonSides((n) => clamp(n + 1))} title="각 늘리기(↑)" style={{ width: 22, height: 22, border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: 'pointer' }}>▲</button>
          <button onClick={() => setPolygonSides((n) => clamp(n - 1))} title="각 줄이기(↓, 최소 3)" style={{ width: 22, height: 22, border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: 'pointer' }}>▼</button>
          <span style={{ color: '#6b7280', fontWeight: 400 }}>↑↓ 키로도 조절</span>
        </span>
      </>)}

      {divider}
      <ClassroomQuizPanel sessionId={sessionId} isTeacher={isTeacher} userNames={userNames} />
    </div>
  )
}

