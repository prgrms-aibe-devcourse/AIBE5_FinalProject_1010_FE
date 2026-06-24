/**
 * @file whiteboard/useWhiteboardLayers.js
 * @description 레이어 패널 상태 + 동작(선택/숨김/삭제/순서변경/패널 이동).
 *
 * 레이어 = 현재 페이지의 shapes 목록(그리는 순서 = z-순서). 패널에서의 조작은 모두
 * setShapes로 반영되어 useWhiteboardSync를 통해 원격까지 동기화된다.
 *
 * - onPickLayer: 선택(Shift=토글). 텍스트 레이어는 더블 진입 없이 바로 편집 오버레이로.
 * - dropLayer: 드래그앤드롭으로 z-순서 재배치.
 * - onPanelDown: 패널 헤더를 잡고 보드 영역 안에서 이동.
 */
import { useRef, useState } from 'react'
import { snapPages } from './syncState.js'

export function useWhiteboardLayers({
  selRef,
  setSel,
  onPickSelectTool,
  shapesRef,
  openTextEditor,
  pushUndo,
  pagesRef,
  setShapes,
  wrapRef,
}) {
  const [layersOpen, setLayersOpen] = useState(true)
  const [dragLayer, setDragLayer] = useState(null)
  const [panelPos, setPanelPos] = useState(null)
  const panelRef = useRef(null)

  const onPickLayer = (e, id, isText) => {
    if (e.shiftKey) { const cur = selRef.current; setSel(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) }
    else setSel([id])
    onPickSelectTool?.()
    if (isText) { const s = shapesRef.current.find((x) => x.id === id); if (s) openTextEditor({ x: s.x, y: s.y }, s) }
  }
  const deleteLayer = (id) => { pushUndo(snapPages(pagesRef.current)); setShapes((prev) => prev.filter((s) => s.id !== id)); setSel(selRef.current.filter((x) => x !== id)) }
  const toggleHidden = (id) => { pushUndo(snapPages(pagesRef.current)); setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s))) }
  const dropLayer = (targetId) => {
    const from = dragLayer; setDragLayer(null)
    if (!from || from === targetId) return
    pushUndo(snapPages(pagesRef.current))
    setShapes((prev) => { const arr = prev.slice(); const fi = arr.findIndex((s) => s.id === from), ti = arr.findIndex((s) => s.id === targetId); if (fi < 0 || ti < 0) return prev; const [mv] = arr.splice(fi, 1); arr.splice(ti, 0, mv); return arr })
  }
  // 패널 헤더를 누르고 있는 동안만 이동 (보드 영역 안으로 제한)
  const onPanelDown = (e) => {
    const el = panelRef.current
    if (!el) return
    e.preventDefault()
    const start = { sx: e.clientX, sy: e.clientY, left: el.offsetLeft, top: el.offsetTop }
    const move = (ev) => {
      const wrap = wrapRef.current
      let left = start.left + (ev.clientX - start.sx), top = start.top + (ev.clientY - start.sy)
      if (wrap && el) { left = Math.max(0, Math.min(left, wrap.clientWidth - el.offsetWidth)); top = Math.max(0, Math.min(top, wrap.clientHeight - el.offsetHeight)) }
      setPanelPos({ left, top })
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return {
    layersOpen, setLayersOpen,
    dragLayer, setDragLayer,
    panelPos, panelRef,
    onPickLayer, deleteLayer, toggleHidden, dropLayer, onPanelDown,
  }
}
