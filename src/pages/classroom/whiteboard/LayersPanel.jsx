/**
 * @file whiteboard/LayersPanel.jsx
 * @description 포토샵식 레이어 패널 — 도형별 모양 아이콘, 클릭 선택, 드래그 정렬, 표시/숨김, 수정/삭제.
 *   헤더 드래그로 패널 이동(이동 로직은 부모가 onPanelDown으로 처리). 목록 고정 높이 + 스크롤.
 */
import { layerBtn } from './constants.js'

const layerLabel = (s) => s.type === 'text'
  ? `텍스트: ${(s.text || '').slice(0, 9) || '(빈)'}`
  : s.type === 'image' ? '사진'
    : s.type === 'polygon' ? `${s.sides || 5}각형`
      : (({ pen: '펜', curve: '곡선', line: '직선', rect: '사각형', ellipse: '원', triangle: '삼각형' }[s.type]) + (s.highlight ? ' (형광)' : ''))

function LayerIcon({ s }) {
  const st = s.color || '#111'
  const wrap = (child) => <svg width="18" height="18" viewBox="0 0 20 20" style={{ flex: '0 0 auto' }}>{child}</svg>
  if (s.type === 'rect') return wrap(<rect x="3" y="5" width="14" height="10" fill="none" stroke={st} strokeWidth="2" />)
  if (s.type === 'ellipse') return wrap(<ellipse cx="10" cy="10" rx="7" ry="5" fill="none" stroke={st} strokeWidth="2" />)
  if (s.type === 'line') return wrap(<line x1="3" y1="16" x2="17" y2="4" stroke={st} strokeWidth="2" strokeLinecap="round" />)
  if (s.type === 'curve') return wrap(<path d="M3 14 Q 8 2 12 10 T 17 8" fill="none" stroke={st} strokeWidth="2" strokeLinecap="round" />)
  if (s.type === 'triangle') return wrap(<path d="M10 4 L17 16 L3 16 Z" fill="none" stroke={st} strokeWidth="2" strokeLinejoin="round" />)
  if (s.type === 'polygon') return wrap(<path d="M10 3 L16 7.5 L13.5 15 L6.5 15 L4 7.5 Z" fill="none" stroke={st} strokeWidth="2" strokeLinejoin="round" />)
  if (s.type === 'image') return wrap(<g fill="none" stroke={st} strokeWidth="1.6"><rect x="3" y="4" width="14" height="12" rx="1.5" /><circle cx="7" cy="8" r="1.3" fill={st} stroke="none" /><path d="M4 14 L8 10 L11 13 L14 9 L16 12" /></g>)
  if (s.type === 'text') return <span style={{ width: 18, textAlign: 'center', fontWeight: 900, color: st }}>T</span>
  return wrap(<path d="M3 13 q 4 -9 7 0 t 7 0" fill="none" stroke={st} strokeWidth="2" strokeLinecap="round" />) // pen/형광 물결
}

export default function LayersPanel({ shapes, selectedIds, open, setOpen, panelRef, panelPos, onPanelDown, onPick, onToggleHidden, onDelete, onDragStartLayer, onDropLayer }) {
  const panelShapes = shapes.filter((s) => s.type !== 'pdf')

  return (
    <div ref={panelRef} style={{ position: 'absolute', ...(panelPos ? { left: panelPos.left, top: panelPos.top } : { left: 10, top: '55%' }), zIndex: 8, width: 195, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', fontSize: 12, display: 'flex', flexDirection: 'column' }}>
      <div onPointerDown={onPanelDown} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', cursor: 'move', fontWeight: 800, color: '#374151', borderBottom: open ? '1px solid #f1f5f9' : 'none', userSelect: 'none' }}>
        <span>≡ 레이어 ({panelShapes.length})</span>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setOpen((o) => !o)} style={layerBtn}>{open ? '▾' : '▸'}</button>
      </div>
      {open && (
        <div style={{ overflowY: 'auto', maxHeight: 240, padding: 4 }}>
          {panelShapes.length === 0 && <div style={{ color: '#9ca3af', textAlign: 'center', padding: '10px 0' }}>아직 없음</div>}
          {panelShapes.slice().reverse().map((s) => {
            const sel = selectedIds.includes(s.id)
            return (
              <div key={s.id} draggable onDragStart={() => onDragStartLayer(s.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDropLayer(s.id)}
                onClick={(e) => onPick(e, s.id, false)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 5px', borderRadius: 6, cursor: 'pointer', background: sel ? '#dbeafe' : 'transparent', opacity: s.hidden ? 0.45 : 1 }}>
                <button title={s.hidden ? '표시' : '숨기기'} onClick={(e) => { e.stopPropagation(); onToggleHidden(s.id) }} style={layerBtn}>{s.hidden ? '🙈' : '👁'}</button>
                <LayerIcon s={s} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layerLabel(s)}</span>
                {s.type === 'text' && <button title="수정" onClick={(e) => { e.stopPropagation(); onPick(e, s.id, true) }} style={layerBtn}>✎</button>}
                <button title="삭제" onClick={(e) => { e.stopPropagation(); onDelete(s.id) }} style={{ ...layerBtn, color: '#ef4444' }}>🗑</button>
                <span title="드래그로 순서 변경" style={{ cursor: 'grab', color: '#9ca3af' }}>⠿</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
