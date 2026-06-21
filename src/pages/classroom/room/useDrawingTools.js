/**
 * @file room/useDrawingTools.js
 * @description 강의실 좌측 도구 바 ↔ 화이트보드가 공유하는 그리기 도구 상태/핸들러.
 * - 도구(tool)·색(color)·전체지우기(clearNonce)·도구 그룹(길게 눌러 하위 도구 플라이아웃) 관리.
 * - 단축키로 도구가 바뀔 때 그룹 표시(groupCurrent)도 동기화(handleSetTool).
 */
import { useEffect, useRef, useState } from 'react'

export const TOOL_GROUPS = [
  { key: 'select', single: true, items: [{ key: 'select', icon: '🖱️', label: '선택/이동' }] },
  { key: 'pen', items: [{ key: 'pen', icon: '✏️', label: '펜' }, { key: 'highlighter', icon: '🖍️', label: '형광펜' }] },
  { key: 'line', items: [{ key: 'line', icon: '📏', label: '직선' }, { key: 'curve', icon: '〰️', label: '곡선' }] },
  { key: 'shape', items: [{ key: 'rect', icon: '▭', label: '사각형' }, { key: 'ellipse', icon: '◯', label: '원' }, { key: 'triangle', icon: '△', label: '삼각형' }, { key: 'polygon', icon: '⬠', label: '다각형' }] },
  { key: 'text', single: true, items: [{ key: 'text', icon: 'T', label: '텍스트' }] },
  { key: 'eraser', single: true, items: [{ key: 'eraser', icon: '🧽', label: '지우개' }] },
  { key: 'hand', single: true, viewOnly: true, items: [{ key: 'hand', icon: '✋', label: '손바닥 이동' }] },
  { key: 'zoom', viewOnly: true, items: [{ key: 'zoomIn', icon: '⌕＋', label: '확대' }, { key: 'zoomOut', icon: '⌕－', label: '축소' }] },
]
export const PRESET_COLORS = ['#111111', '#ef4444', '#f59e0b', '#10b981', '#2563eb', '#ffffff']
export const TOOL_SHORTCUTS = {
  select: 'V', pen: 'P', highlighter: 'P', line: 'L', curve: 'L',
  rect: 'M', ellipse: 'M', triangle: 'M', polygon: 'M',
  text: 'T', eraser: 'E', hand: 'H', zoomIn: 'Z', zoomOut: 'Shift+Z',
}

export function useDrawingTools() {
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#111111')
  const [clearNonce, setClearNonce] = useState(0)
  const [groupCurrent, setGroupCurrent] = useState({ pen: 'pen', line: 'line', shape: 'rect', zoom: 'zoomIn' })
  const [flyout, setFlyout] = useState(null)
  const pressTimer = useRef(null)
  const longPressed = useRef(false)
  const wbRef = useRef(null) // 화이트보드 핸들(사진/PDF 불러오기 호출용)

  const groupCurrentKey = (g) => (g.single ? g.items[0].key : (groupCurrent[g.key] || g.items[0].key))
  const groupItem = (g) => g.items.find((i) => i.key === groupCurrentKey(g)) || g.items[0]
  const groupShortcut = (g) => TOOL_SHORTCUTS[groupCurrentKey(g)]
  const selectSub = (g, key) => { setTool(key); if (!g.single) setGroupCurrent((p) => ({ ...p, [g.key]: key })); setFlyout(null) }
  // 화이트보드 단축키(P/L/M/T/V/E)로 도구가 바뀔 때 — tool + 좌측 툴바 그룹 표시도 함께 동기화.
  const handleSetTool = (toolKey) => {
    setTool(toolKey)
    const g = TOOL_GROUPS.find((grp) => !grp.single && grp.items.some((it) => it.key === toolKey))
    if (g) setGroupCurrent((p) => ({ ...p, [g.key]: toolKey }))
  }
  const onGroupDown = (g) => { longPressed.current = false; if (g.single) return; pressTimer.current = setTimeout(() => { longPressed.current = true; setFlyout(g.key) }, 300) }
  const clearPress = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null } }
  const onGroupClick = (g) => { if (longPressed.current) { longPressed.current = false; return } selectSub(g, groupCurrentKey(g)) }

  // 플라이아웃 열린 동안 바깥 클릭하면 닫기
  useEffect(() => {
    if (!flyout) return undefined
    const close = () => setFlyout(null)
    const id = setTimeout(() => window.addEventListener('pointerdown', close), 0)
    return () => { clearTimeout(id); window.removeEventListener('pointerdown', close) }
  }, [flyout])

  return {
    tool, setTool, color, setColor, clearNonce, setClearNonce, wbRef, handleSetTool,
    flyout, groupItem, groupShortcut, groupCurrentKey, selectSub, onGroupDown, clearPress, onGroupClick,
  }
}
