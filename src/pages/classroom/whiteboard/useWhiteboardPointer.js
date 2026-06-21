/**
 * @file whiteboard/useWhiteboardPointer.js
 * @description 화이트보드 캔버스의 포인터 상호작용 핵심.
 *
 * 보유 핸들러:
 * - handleDown/handleMove/handleUp: 도구별 동작(보기 팬·줌, 그리기, 선택/이동/크기/회전, 지우기, 마퀴 선택).
 * - handleDoubleClick: 곡선 종료 / 텍스트 편집 진입.
 * - commitText: 텍스트 편집 확정(추가/수정/삭제).
 * - openTextEditor: 텍스트 입력 오버레이 진입(레이어 패널에서도 사용).
 * - zoomFromCenter/resetView: 화면 중앙 기준 줌·뷰 초기화(단축키에서도 사용).
 *
 * 좌표는 screenToBoard(viewRef)로 화면 → 보드 좌표로 변환해 다룬다.
 * 히스토리(begin/commit/cancel/pushUndo)와 movedRef는 useWhiteboardHistory에서 주입받는다.
 * 그리기 권한(canDraw)이 없으면 보기 도구 외 시작을 모두 차단한다(학생 기본).
 */
import {
  BOX_TYPES, ROTATE_CURSOR, nextId, isViewTool,
} from './constants.js'
import {
  aabbHit, bbox, center, toLocal, mapShape, translate, cloneShape,
  hitTest, handleAt, resizeCursor, isErased, screenAABB,
} from './geometry.js'
import { DEFAULT_VIEW, screenToBoard, zoomAtScreenPoint } from './viewTransform.js'
import { snapPages } from './syncState.js'

export function useWhiteboardPointer({
  canvasRef, wrapRef, ctxRef, viewRef,
  toolRef, colorRef, widthRef, opacityRef, polygonSidesRef, eraseRadiusRef,
  shapesRef, draftRef, selRef, drag,
  setView, setIsPanning, setShapes, setSel, setEditing, setDraft, setMarquee, setCurveHover, setHoverCursor, setEraserCursor,
  beginHistory, commitHistory, cancelHistory, pushUndo, movedRef,
  pagesRef,
  editing, tool, canDraw, marquee, fontFamily, fontSize, bold,
  inputRef,
}) {
  const ctx = () => ctxRef.current
  const getScreenPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const getPos = (e) => screenToBoard(getScreenPos(e), viewRef.current)
  const zoomAt = (screenPoint, factor) => setView((cur) => zoomAtScreenPoint(cur, screenPoint, factor))
  const zoomFromCenter = (factor) => {
    const el = wrapRef.current
    zoomAt({ x: (el?.clientWidth || 0) / 2, y: (el?.clientHeight || 0) / 2 }, factor)
  }
  const resetView = () => setView(DEFAULT_VIEW)
  const eraseAt = (p) => setShapes((prev) => prev.filter((s) => s.hidden || !isErased(s, p, eraseRadiusRef.current, ctx())))
  const openTextEditor = (p, shape = null) => {
    drag.current = null
    setDraft(null)
    setMarquee(null)
    setCurveHover(null)
    if (shape) {
      setSel([shape.id])
      setEditing({ id: shape.id, x: shape.x, y: shape.y, value: shape.text || '' })
      return
    }
    setSel([])
    setEditing({ x: p.x, y: p.y, value: '' })
  }

  function handleDown(e) {
    const screenP = getScreenPos(e)
    const p = screenToBoard(screenP, viewRef.current)
    const t = toolRef.current
    if (editing) {
      e.preventDefault()
      e.stopPropagation()
      inputRef.current?.blur()
      return
    }

    if (isViewTool(t)) {
      e.preventDefault()
      e.stopPropagation()
      canvasRef.current.setPointerCapture(e.pointerId)
      if (t === 'hand') {
        drag.current = { mode: 'pan', startScreen: screenP, startView: viewRef.current }
        setIsPanning(true)
        return
      }
      zoomAt(screenP, (t === 'zoomOut' || e.altKey) ? 1 / 1.2 : 1.2)
      return
    }

    // 판서 권한 없음(학생 기본) — 보기 도구 외 그리기/선택/텍스트 시작을 모두 차단.
    if (!canDraw) return

    if (t === 'text' || tool === 'text') {
      e.preventDefault()
      e.stopPropagation()
      openTextEditor(p)
      return
    }
    if (t === 'curve') { if (!draftRef.current || draftRef.current.type !== 'curve') beginHistory(); setSel([]); setDraft((d) => (d && d.type === 'curve') ? { ...d, points: [...d.points, p] } : { id: nextId(), type: 'curve', color: colorRef.current, width: widthRef.current, opacity: opacityRef.current, points: [p] }); return }

    canvasRef.current.setPointerCapture(e.pointerId)
    movedRef.current = false
    beginHistory() // 동작 시작 전 스냅샷 보류 — 실제 변경 시 handleUp에서 커밋, 아니면 취소
    if (t === 'eraser') { setSel([]); drag.current = { mode: 'erase' }; movedRef.current = true; eraseAt(p); return }

    if (t === 'select') {
      if (selRef.current.length === 1) {
        const cur = shapesRef.current.find((s) => s.id === selRef.current[0])
        if (cur) {
          const h = handleAt(p, cur, ctx())
          if (h?.kind === 'rotate') { const ce = center(cur, ctx()); drag.current = { mode: 'rotate', cx: ce.x, cy: ce.y, start: Math.atan2(p.y - ce.y, p.x - ce.x), orig: cur.rotation || 0, id: cur.id }; return }
          if (h?.kind === 'resize') { drag.current = { mode: 'resize', anchor: h.anchor, edge: h.edgeKey, origShape: cur, origBox: bbox(cur, ctx()), id: cur.id }; return }
        }
      }
      const id = hitTest(shapesRef.current, p, ctx())
      if (id) {
        let ids
        if (e.shiftKey) { const cur = selRef.current; ids = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; setSel(ids); if (!ids.includes(id)) { drag.current = null; return } }
        else { ids = selRef.current.includes(id) ? selRef.current : [id]; setSel(ids) }
        const base = ids.map((i) => shapesRef.current.find((s) => s.id === i)).filter(Boolean)
        let moveIds, orig
        if (e.ctrlKey) { const clones = base.map((b) => cloneShape(b, nextId())); setShapes((prev) => [...prev, ...clones]); moveIds = clones.map((c) => c.id); setSel(moveIds); orig = clones.map((c) => cloneShape(c, c.id)); movedRef.current = true }
        else { moveIds = ids; orig = base.map((b) => cloneShape(b, b.id)) }
        drag.current = { mode: 'move', ids: moveIds, startP: p, orig }
      } else {
        if (!e.shiftKey) setSel([])
        drag.current = { mode: 'marquee', start: p, add: e.shiftKey }
        setMarquee({ x: p.x, y: p.y, w: 0, h: 0 })
      }
      return
    }

    setSel([]); drag.current = { mode: 'draw' }
    const c = colorRef.current, w = widthRef.current, op = opacityRef.current
    if (t === 'pen') setDraft({ id: nextId(), type: 'pen', color: c, width: w, opacity: op, points: [p] })
    else if (t === 'highlighter') setDraft({ id: nextId(), type: 'pen', highlight: true, color: c, width: Math.max(w, 12), opacity: Math.min(op, 0.5), points: [p] })
    else if (t === 'line') setDraft({ id: nextId(), type: 'line', color: c, width: w, opacity: op, x1: p.x, y1: p.y, x2: p.x, y2: p.y })
    else if (t === 'rect') setDraft({ id: nextId(), type: 'rect', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
    else if (t === 'ellipse') setDraft({ id: nextId(), type: 'ellipse', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
    else if (t === 'triangle') setDraft({ id: nextId(), type: 'triangle', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
    else if (t === 'polygon') setDraft({ id: nextId(), type: 'polygon', sides: polygonSidesRef.current, color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
  }

  function handleMove(e) {
    const screenP = getScreenPos(e)
    const p = screenToBoard(screenP, viewRef.current)
    const t = toolRef.current
    if (drag.current?.mode === 'pan') {
      const { startScreen, startView } = drag.current
      setView({ ...startView, x: startView.x + (screenP.x - startScreen.x), y: startView.y + (screenP.y - startScreen.y) })
      return
    }
    if (!canDraw && !isViewTool(t)) return
    if (t === 'eraser') setEraserCursor(p)
    if (t === 'curve' && draftRef.current?.type === 'curve') setCurveHover(p)

    if (!drag.current) {
      if (t === 'select') {
        let cz = 'default'
        if (selRef.current.length === 1) { const cur = shapesRef.current.find((s) => s.id === selRef.current[0]); if (cur) { const h = handleAt(p, cur, ctx()); if (h?.kind === 'rotate') cz = ROTATE_CURSOR; else if (h?.kind === 'resize') cz = resizeCursor(h.cornerKey || h.edgeKey, cur.rotation); else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' } else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' }
        else if (hitTest(shapesRef.current, p, ctx())) cz = 'move'
        setHoverCursor(cz)
      }
      return
    }

    const m = drag.current.mode
    if (m === 'move' || m === 'rotate' || m === 'resize' || m === 'erase') movedRef.current = true // 실제 변경 발생 표시(handleUp에서 히스토리 커밋 판단)
    if (m === 'move') {
      let dx = p.x - drag.current.startP.x, dy = p.y - drag.current.startP.y
      if (e.shiftKey) { if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0 }
      const byId = new Map(drag.current.orig.map((o) => [o.id, o]))
      setShapes((prev) => prev.map((s) => (byId.has(s.id) ? translate(byId.get(s.id), dx, dy) : s)))
    } else if (m === 'rotate') {
      const ang = Math.atan2(p.y - drag.current.cy, p.x - drag.current.cx)
      let rotation = drag.current.orig + (ang - drag.current.start)
      if (e.shiftKey) rotation = Math.round(rotation / (Math.PI / 4)) * (Math.PI / 4)
      setShapes((prev) => prev.map((s) => (s.id === drag.current.id ? { ...s, rotation } : s)))
    } else if (m === 'resize') {
      const lp = toLocal(p, drag.current.origShape, ctx()), ob = drag.current.origBox
      let nb
      if (drag.current.edge) {
        // 변(edge) 핸들: 한 축만 변경(반대 변 고정). 가로(e/w) 또는 세로(n/s).
        const ek = drag.current.edge
        if (ek === 'e' || ek === 'w') {
          const ax = ek === 'e' ? ob.x : ob.x + ob.w
          nb = { x: Math.min(ax, lp.x), y: ob.y, w: Math.abs(lp.x - ax), h: ob.h }
        } else {
          const ay = ek === 's' ? ob.y : ob.y + ob.h
          nb = { x: ob.x, y: Math.min(ay, lp.y), w: ob.w, h: Math.abs(lp.y - ay) }
        }
      } else {
        const a = drag.current.anchor
        nb = { x: Math.min(a.x, lp.x), y: Math.min(a.y, lp.y), w: Math.abs(lp.x - a.x), h: Math.abs(lp.y - a.y) }
        if (e.shiftKey && ob.w > 0 && ob.h > 0) { const sc = Math.max(nb.w / ob.w, nb.h / ob.h), w = ob.w * sc, h = ob.h * sc, sx = lp.x >= a.x ? 1 : -1, sy = lp.y >= a.y ? 1 : -1, ox = a.x + sx * w, oy = a.y + sy * h; nb = { x: Math.min(a.x, ox), y: Math.min(a.y, oy), w, h } }
      }
      const t2 = mapShape(drag.current.origShape, drag.current.origBox, nb)
      setShapes((prev) => prev.map((s) => (s.id === t2.id ? t2 : s)))
    } else if (m === 'erase') {
      eraseAt(p)
    } else if (m === 'marquee') {
      const s0 = drag.current.start
      setMarquee({ x: Math.min(s0.x, p.x), y: Math.min(s0.y, p.y), w: Math.abs(p.x - s0.x), h: Math.abs(p.y - s0.y) })
    } else {
      const shift = e.shiftKey, ctrl = e.ctrlKey
      setDraft((d) => {
        if (!d) return d
        if (d.type === 'pen') return { ...d, points: [...d.points, p] }
        if (d.type === 'line') return { ...d, x2: p.x, y2: p.y }
        // 박스형(rect/ellipse/triangle/polygon): Shift=정비율, Ctrl=중심 기준
        const sx = d.sx ?? d.x, sy = d.sy ?? d.y
        let dw = p.x - sx, dh = p.y - sy
        if (shift) { const m = Math.max(Math.abs(dw), Math.abs(dh)); dw = dw < 0 ? -m : m; dh = dh < 0 ? -m : m }
        if (ctrl) { const aw = Math.abs(dw), ah = Math.abs(dh); return { ...d, x: sx - aw, y: sy - ah, w: 2 * aw, h: 2 * ah } }
        return { ...d, x: sx, y: sy, w: dw, h: dh }
      })
    }
  }

  function handleUp() {
    const dc = drag.current
    if (dc?.mode === 'pan') {
      setIsPanning(false)
      drag.current = null
      return
    }
    if (dc?.mode === 'marquee') {
      const m = marquee
      if (m && (m.w > 2 || m.h > 2)) {
        const hits = shapesRef.current.filter((s) => !s.hidden && !s.locked && s.type !== 'pdf' && aabbHit(screenAABB(s, ctx()), m)).map((s) => s.id)
        setSel(dc.add ? [...new Set([...selRef.current, ...hits])] : hits)
      }
      setMarquee(null)
      cancelHistory() // 선택(마퀴)만 — 변경 없음
    } else if (dc?.mode === 'draw' && draftRef.current) {
      let d = draftRef.current
      const isBox = BOX_TYPES.includes(d.type)
      const tinyBox = isBox && Math.abs(d.w) < 3 && Math.abs(d.h) < 3
      const tinyLine = d.type === 'line' && Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3
      if (isBox) { if (d.w < 0) d = { ...d, x: d.x + d.w, w: -d.w }; if (d.h < 0) d = { ...d, y: d.y + d.h, h: -d.h } }
      if (!tinyBox && !tinyLine) { setShapes((prev) => [...prev, d]); commitHistory() } else cancelHistory()
      setDraft(null)
    } else if (dc && (dc.mode === 'move' || dc.mode === 'resize' || dc.mode === 'rotate' || dc.mode === 'erase')) {
      if (movedRef.current) commitHistory(); else cancelHistory() // 실제 변경 있을 때만 기록
    } else {
      cancelHistory()
    }
    drag.current = null
    setIsPanning(false)
  }

  const commitText = () => {
    const current = editing
    if (!current) return
    const raw = current.value
    const empty = !raw.trim()
    if (current.id || !empty) pushUndo(snapPages(pagesRef.current)) // 텍스트 추가/수정/삭제는 되돌릴 수 있게
    setShapes((prev) => {
      if (current.id) { if (empty) return prev.filter((s) => s.id !== current.id); return prev.map((s) => (s.id === current.id ? { ...s, text: raw } : s)) }
      if (empty) return prev
      return [...prev, { id: nextId(), type: 'text', color: colorRef.current, opacity: opacityRef.current, x: current.x, y: current.y, text: raw, fontFamily, fontSize, bold }]
    })
    setEditing(null)
  }

  function handleDoubleClick(e) {
    if (!canDraw) return // 판서 권한 없으면 더블클릭(텍스트 편집/곡선 종료)도 차단
    if (toolRef.current === 'curve' && draftRef.current?.type === 'curve') {
      const raw = draftRef.current.points
      const pts = raw.filter((q, i) => i === 0 || Math.hypot(q.x - raw[i - 1].x, q.y - raw[i - 1].y) > 4)
      if (pts.length >= 2) setShapes((prev) => [...prev, { ...draftRef.current, points: pts }])
      setDraft(null); setCurveHover(null); return
    }
    if (toolRef.current !== 'select') return
    const id = hitTest(shapesRef.current, getPos(e), ctx()); const s = shapesRef.current.find((x) => x.id === id)
    if (s && s.type === 'text') openTextEditor({ x: s.x, y: s.y }, s)
  }

  return { handleDown, handleMove, handleUp, handleDoubleClick, commitText, openTextEditor, zoomFromCenter, resetView }
}
