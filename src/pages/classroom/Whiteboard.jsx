/**
 * @file Whiteboard.jsx
 * @description 강의실 화이트보드 — 객체(retained) 기반 <canvas> 오케스트레이터.
 * - 상태(shapes/draft/selection/drag)와 포인터 핸들러만 보유.
 * - 순수 로직은 whiteboard/{constants,geometry,painting}.js, UI는 whiteboard/{OptionsBar,LayersPanel}.jsx로 분리.
 * - 도구: select·pen·highlighter·line·curve·rect·ellipse·triangle·polygon·text·eraser.
 * - 로컬 전용(실시간 공유는 후속).
 */
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import {
  TEXT_SIZE, HIT_PAD, HANDLE, ROT_OFFSET, ROTATE_CURSOR, BOX_TYPES, POLYGON_MIN, POLYGON_MAX, nextId,
} from './whiteboard/constants.js'
import {
  rotatePt, aabbHit, bbox, center, toLocal, corners, screenAABB,
  mapShape, translate, cloneShape, hitTest, handleAt, resizeCursor, isErased,
} from './whiteboard/geometry.js'
import { paintShape } from './whiteboard/painting.js'
import OptionsBar from './whiteboard/OptionsBar.jsx'
import LayersPanel from './whiteboard/LayersPanel.jsx'

export default function Whiteboard({ tool = 'pen', color = '#111111', clearNonce = 0, onPickSelectTool }) {
  const canvasRef = useRef(null), ctxRef = useRef(null), wrapRef = useRef(null), inputRef = useRef(null)
  const composingRef = useRef(false)

  const [shapes, setShapes] = useState([])
  const [draft, setDraft] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [editing, setEditing] = useState(null)
  const [eraserCursor, setEraserCursor] = useState(null)
  const [hoverCursor, setHoverCursor] = useState('default')
  const [marquee, setMarquee] = useState(null)
  const [curveHover, setCurveHover] = useState(null)
  const [layersOpen, setLayersOpen] = useState(true)
  const [dragLayer, setDragLayer] = useState(null)
  const [panelPos, setPanelPos] = useState(null)
  const panelRef = useRef(null)
  const [degText, setDegText] = useState('0')
  const degFocus = useRef(false)

  const [strokeWidth, setStrokeWidth] = useState(3)
  const [opacity, setOpacity] = useState(1)
  const [fontFamily, setFontFamily] = useState('sans-serif')
  const [fontSize, setFontSize] = useState(TEXT_SIZE)
  const [bold, setBold] = useState(false)
  const [polygonSides, setPolygonSides] = useState(5)

  const drag = useRef(null)
  const eraseRadius = Math.max(6, strokeWidth)
  const shapesRef = useRef(shapes), draftRef = useRef(draft), selRef = useRef(selectedIds)
  const toolRef = useRef(tool), colorRef = useRef(color), widthRef = useRef(strokeWidth), opacityRef = useRef(opacity)
  const eraseRadiusRef = useRef(eraseRadius), curveHoverRef = useRef(curveHover), polygonSidesRef = useRef(polygonSides)
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { selRef.current = selectedIds }, [selectedIds])
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { widthRef.current = strokeWidth }, [strokeWidth])
  useEffect(() => { opacityRef.current = opacity }, [opacity])
  useEffect(() => { eraseRadiusRef.current = eraseRadius }, [eraseRadius])
  useEffect(() => { curveHoverRef.current = curveHover }, [curveHover])
  useEffect(() => { polygonSidesRef.current = polygonSides }, [polygonSides])

  const setSel = (ids) => setSelectedIds(ids)
  const ctx = () => ctxRef.current

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, c = ctxRef.current
    if (!canvas || !c) return
    c.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of shapesRef.current) paintShape(c, s)
    if (draftRef.current) { let d = draftRef.current; if (d.type === 'curve' && curveHoverRef.current) d = { ...d, points: [...d.points, curveHoverRef.current] }; paintShape(c, d) }
    const ids = selRef.current
    ids.forEach((id) => {
      const sel = shapesRef.current.find((s) => s.id === id)
      if (!sel) return
      const b = bbox(sel, c), rot = sel.rotation || 0, ce = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
      c.save()
      if (rot) { c.translate(ce.x, ce.y); c.rotate(rot); c.translate(-ce.x, -ce.y) }
      c.strokeStyle = '#2563eb'; c.lineWidth = 1; c.setLineDash([5, 4])
      c.strokeRect(b.x - HIT_PAD, b.y - HIT_PAD, b.w + HIT_PAD * 2, b.h + HIT_PAD * 2); c.setLineDash([])
      if (ids.length === 1) {
        const tx = b.x + b.w / 2, ty = b.y - HIT_PAD
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - ROT_OFFSET); c.stroke()
        c.fillStyle = '#fff'; c.beginPath(); c.arc(tx, ty - ROT_OFFSET, 6, 0, Math.PI * 2); c.fill(); c.stroke()
        Object.values(corners(b)).forEach((cc) => { c.fillRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE); c.strokeRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE) })
      }
      c.restore()
    })
  }, [])

  const fit = useCallback(() => {
    const canvas = canvasRef.current, parent = wrapRef.current
    if (!canvas || !parent) return
    const dpr = window.devicePixelRatio || 1, w = parent.clientWidth, h = parent.clientHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); ctxRef.current = c; redraw()
  }, [redraw])

  useEffect(() => { fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit) }, [fit])
  useEffect(() => { redraw() }, [shapes, draft, selectedIds, marquee, curveHover, redraw])
  useEffect(() => { if (clearNonce === 0) return; setShapes([]); setSelectedIds([]); setEditing(null); setDraft(null) }, [clearNonce])
  useEffect(() => { if (!selRef.current.length) return; const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, color } : s))) }, [color])
  useLayoutEffect(() => {
    if (!editing) return
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }, [editing?.id, editing?.x, editing?.y])
  useEffect(() => {
    if (degFocus.current) return
    const s = selectedIds.length === 1 ? shapes.find((x) => x.id === selectedIds[0]) : null
    setDegText(s ? String((((Math.round((s.rotation || 0) * 180 / Math.PI)) % 360) + 360) % 360) : '0')
  }, [shapes, selectedIds])

  useEffect(() => {
    const onKey = (e) => {
      if (editing) return
      if (toolRef.current === 'polygon' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        const delta = e.key === 'ArrowUp' ? 1 : -1
        const clamp = (v) => Math.max(POLYGON_MIN, Math.min(POLYGON_MAX, v))
        setPolygonSides((n) => clamp(n + delta))
        setDraft((d) => (d && d.type === 'polygon') ? { ...d, sides: clamp((d.sides || 5) + delta) } : d) // 그리는 중 실시간
        if (selRef.current.length) { const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) && s.type === 'polygon' ? { ...s, sides: clamp((s.sides || 5) + delta) } : s))) }
        return
      }
      if (e.key === 'Escape' && draftRef.current?.type === 'curve') { setDraft(null); setCurveHover(null); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selRef.current.length) {
        const set = new Set(selRef.current); setShapes((prev) => prev.filter((s) => !set.has(s.id))); setSelectedIds([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  const getPos = (e) => { const r = canvasRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
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
    if (editing) {
      e.preventDefault()
      e.stopPropagation()
      inputRef.current?.blur()
      return
    }

    const p = getPos(e); const t = toolRef.current
    if (t === 'text' || tool === 'text') {
      e.preventDefault()
      e.stopPropagation()
      openTextEditor(p)
      return
    }
    if (t === 'curve') { setSel([]); setDraft((d) => (d && d.type === 'curve') ? { ...d, points: [...d.points, p] } : { id: nextId(), type: 'curve', color: colorRef.current, width: widthRef.current, opacity: opacityRef.current, points: [p] }); return }

    canvasRef.current.setPointerCapture(e.pointerId)
    if (t === 'eraser') { setSel([]); drag.current = { mode: 'erase' }; eraseAt(p); return }

    if (t === 'select') {
      if (selRef.current.length === 1) {
        const cur = shapesRef.current.find((s) => s.id === selRef.current[0])
        if (cur) {
          const h = handleAt(p, cur, ctx())
          if (h?.kind === 'rotate') { const ce = center(cur, ctx()); drag.current = { mode: 'rotate', cx: ce.x, cy: ce.y, start: Math.atan2(p.y - ce.y, p.x - ce.x), orig: cur.rotation || 0, id: cur.id }; return }
          if (h?.kind === 'resize') { drag.current = { mode: 'resize', anchor: h.anchor, origShape: cur, origBox: bbox(cur, ctx()), id: cur.id }; return }
        }
      }
      const id = hitTest(shapesRef.current, p, ctx())
      if (id) {
        let ids
        if (e.shiftKey) { const cur = selRef.current; ids = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; setSel(ids); if (!ids.includes(id)) { drag.current = null; return } }
        else { ids = selRef.current.includes(id) ? selRef.current : [id]; setSel(ids) }
        const base = ids.map((i) => shapesRef.current.find((s) => s.id === i)).filter(Boolean)
        let moveIds, orig
        if (e.ctrlKey) { const clones = base.map((b) => cloneShape(b, nextId())); setShapes((prev) => [...prev, ...clones]); moveIds = clones.map((c) => c.id); setSel(moveIds); orig = clones.map((c) => cloneShape(c, c.id)) }
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
    const p = getPos(e); const t = toolRef.current
    if (t === 'eraser') setEraserCursor(p)
    if (t === 'curve' && draftRef.current?.type === 'curve') setCurveHover(p)

    if (!drag.current) {
      if (t === 'select') {
        let cz = 'default'
        if (selRef.current.length === 1) { const cur = shapesRef.current.find((s) => s.id === selRef.current[0]); if (cur) { const h = handleAt(p, cur, ctx()); if (h?.kind === 'rotate') cz = ROTATE_CURSOR; else if (h?.kind === 'resize') cz = resizeCursor(h.cornerKey, cur.rotation); else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' } else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' }
        else if (hitTest(shapesRef.current, p, ctx())) cz = 'move'
        setHoverCursor(cz)
      }
      return
    }

    const m = drag.current.mode
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
      const lp = toLocal(p, drag.current.origShape, ctx()), a = drag.current.anchor
      let nb = { x: Math.min(a.x, lp.x), y: Math.min(a.y, lp.y), w: Math.abs(lp.x - a.x), h: Math.abs(lp.y - a.y) }
      if (e.shiftKey) { const ob = drag.current.origBox; if (ob.w > 0 && ob.h > 0) { const sc = Math.max(nb.w / ob.w, nb.h / ob.h), w = ob.w * sc, h = ob.h * sc, sx = lp.x >= a.x ? 1 : -1, sy = lp.y >= a.y ? 1 : -1, ox = a.x + sx * w, oy = a.y + sy * h; nb = { x: Math.min(a.x, ox), y: Math.min(a.y, oy), w, h } } }
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
    if (dc?.mode === 'marquee') {
      const m = marquee
      if (m && (m.w > 2 || m.h > 2)) {
        const hits = shapesRef.current.filter((s) => !s.hidden && aabbHit(screenAABB(s, ctx()), m)).map((s) => s.id)
        setSel(dc.add ? [...new Set([...selRef.current, ...hits])] : hits)
      }
      setMarquee(null)
    } else if (dc?.mode === 'draw' && draftRef.current) {
      let d = draftRef.current
      const isBox = BOX_TYPES.includes(d.type)
      const tinyBox = isBox && Math.abs(d.w) < 3 && Math.abs(d.h) < 3
      const tinyLine = d.type === 'line' && Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3
      if (isBox) { if (d.w < 0) d = { ...d, x: d.x + d.w, w: -d.w }; if (d.h < 0) d = { ...d, y: d.y + d.h, h: -d.h } }
      if (!tinyBox && !tinyLine) setShapes((prev) => [...prev, d])
      setDraft(null)
    }
    drag.current = null
  }

  const commitText = () => {
    const current = editing
    if (!current) return
    const raw = current.value
    const empty = !raw.trim()
    setShapes((prev) => {
      if (current.id) { if (empty) return prev.filter((s) => s.id !== current.id); return prev.map((s) => (s.id === current.id ? { ...s, text: raw } : s)) }
      if (empty) return prev
      return [...prev, { id: nextId(), type: 'text', color: colorRef.current, opacity: opacityRef.current, x: current.x, y: current.y, text: raw, fontFamily, fontSize, bold }]
    })
    setEditing(null)
  }
  function handleDoubleClick(e) {
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

  const applyToSelected = (patch) => { const set = new Set(selRef.current); if (set.size) setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, ...patch } : s))) }
  const onWidth = (w) => { setStrokeWidth(w); applyToSelected({ width: w }) }
  const onOpacity = (o) => { setOpacity(o); applyToSelected({ opacity: o }) }
  const applyDeg = (text) => { const n = parseFloat(text); if (Number.isFinite(n)) applyToSelected({ rotation: (n * Math.PI) / 180 }) }

  // 레이어 동작
  const onPickLayer = (e, id, isText) => {
    if (e.shiftKey) { const cur = selRef.current; setSel(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) }
    else setSel([id])
    onPickSelectTool?.()
    if (isText) { const s = shapesRef.current.find((x) => x.id === id); if (s) openTextEditor({ x: s.x, y: s.y }, s) }
  }
  const deleteLayer = (id) => { setShapes((prev) => prev.filter((s) => s.id !== id)); setSel(selRef.current.filter((x) => x !== id)) }
  const toggleHidden = (id) => setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)))
  const dropLayer = (targetId) => {
    const from = dragLayer; setDragLayer(null)
    if (!from || from === targetId) return
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

  const baseCursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : tool === 'select' ? hoverCursor : 'crosshair'
  let rotHud = null
  if (selectedIds.length === 1 && tool === 'select' && ctxRef.current) {
    const s = shapes.find((x) => x.id === selectedIds[0])
    if (s) { const b = bbox(s, ctxRef.current), ce = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; rotHud = rotatePt(b.x + b.w / 2, b.y - HIT_PAD - ROT_OFFSET, ce.x, ce.y, s.rotation || 0) }
  }

  return (
    <div ref={wrapRef} style={{ height: '100%', background: '#fff', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

      <OptionsBar
        tool={tool} strokeWidth={strokeWidth} onWidth={onWidth} opacity={opacity} onOpacity={onOpacity}
        fontFamily={fontFamily} setFontFamily={setFontFamily} fontSize={fontSize} setFontSize={setFontSize}
        bold={bold} setBold={setBold} polygonSides={polygonSides} setPolygonSides={setPolygonSides}
      />

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: baseCursor }}
        onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp}
        onPointerLeave={() => { handleUp(); setEraserCursor(null) }} onDoubleClick={handleDoubleClick} />

      {marquee && <div style={{ position: 'absolute', left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, border: '1px dashed #2563eb', background: 'rgba(37,99,235,0.08)', zIndex: 4, pointerEvents: 'none' }} />}

      {tool === 'eraser' && eraserCursor && (
        <div style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none', left: eraserCursor.x - eraseRadius, top: eraserCursor.y - eraseRadius, width: eraseRadius * 2, height: eraseRadius * 2, borderRadius: '50%', border: '1.5px solid #6b7280', background: 'rgba(148,163,184,0.18)' }} />
      )}

      <LayersPanel
        shapes={shapes} selectedIds={selectedIds} open={layersOpen} setOpen={setLayersOpen}
        panelRef={panelRef} panelPos={panelPos} onPanelDown={onPanelDown}
        onPick={onPickLayer} onToggleHidden={toggleHidden} onDelete={deleteLayer}
        onDragStartLayer={setDragLayer} onDropLayer={dropLayer}
      />

      {rotHud && (
        <div style={{ position: 'absolute', left: rotHud.x, top: rotHud.y - 32, transform: 'translateX(-50%)', zIndex: 8, background: '#111827', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <input value={degText} onFocus={() => { degFocus.current = true }} onBlur={() => { degFocus.current = false }} onChange={(e) => { setDegText(e.target.value); applyDeg(e.target.value) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} title="회전 각도(도)" style={{ width: 36, border: 'none', borderRadius: 4, padding: '1px 3px', fontSize: 11, textAlign: 'right' }} /><span>°</span>
        </div>
      )}

      {editing && (
        <textarea
          key={editing.id || `${Math.round(editing.x)}_${Math.round(editing.y)}`}
          ref={inputRef}
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing((ed) => (ed ? { ...ed, value: e.target.value } : ed))}
          onBlur={commitText}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          onKeyDown={(e) => {
            e.stopPropagation() // 전역 단축키(Delete 등) 차단
            if (e.nativeEvent.isComposing || composingRef.current) return
            if (e.key === 'Escape') { e.preventDefault(); setEditing(null) }
          }}
          rows={Math.max(1, String(editing.value || '').split('\n').length)}
          placeholder="텍스트 입력 (Enter=줄바꿈, 영역 밖 클릭=완료)"
          style={{ position: 'absolute', left: editing.x, top: editing.y, zIndex: 9, font: `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`, color, lineHeight: 1.25, border: '1px dashed #2563eb', background: 'rgba(255,255,255,0.97)', padding: '2px 4px', outline: 'none', minWidth: 180, minHeight: Math.round(fontSize * 1.5), resize: 'both', overflow: 'auto', whiteSpace: 'pre-wrap' }}
        />
      )}
    </div>
  )
}
