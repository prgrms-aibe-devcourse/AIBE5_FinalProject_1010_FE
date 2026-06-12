/**
 * @file Whiteboard.jsx
 * @description 강의실 화이트보드 — 객체(retained) 기반 <canvas>.
 * - 도형 객체 배열(shapes)로 보관, 매 변경 전체 재렌더. 다중선택/이동/크기변경/회전/삭제/수정.
 * - 도구: select·pen·highlighter·line·curve·rect·ellipse·text·eraser (부모 props tool/color/clearNonce)
 * - 선택: 빈 곳 드래그=마퀴 다중선택, Shift+클릭=토글, 도형 위 드래그=선택 전체 이동.
 *   단일 선택 시 모서리=크기변경, 위 핸들=회전. Shift(45°/비율/수직수평), Ctrl+이동=복사.
 * - 레이어 패널: 도형별 모양 아이콘, 클릭 선택, 드래그 정렬, 표시/숨김, 수정/삭제, 스크롤.
 * - 로컬 전용(실시간 공유는 후속).
 */
import { useEffect, useRef, useState, useCallback } from 'react'

const TEXT_SIZE = 20
const HIT_PAD = 6
const HANDLE = 10
const ROT_OFFSET = 24
const ROT_HIT = 10
const FONTS = [
  { label: '기본', value: 'sans-serif' }, { label: '명조', value: 'serif' },
  { label: '고정폭', value: 'monospace' }, { label: '손글씨', value: "'Jua', sans-serif" },
]
const FONT_SIZES = [14, 20, 28, 40, 56]
const ROTATE_CURSOR = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g fill='none' stroke='%23111827' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12a7 7 0 1 1 2.05 4.95'/><path d='M3 14l2.2 2.6L8 14'/></g></svg>\") 12 12, grab"
const layerBtn = { width: 18, height: 18, lineHeight: '16px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, flex: '0 0 auto' }
const isPath = (s) => s.type === 'pen' || s.type === 'curve'

const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy); t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
const rotatePt = (x, y, cx, cy, ang) => {
  const cos = Math.cos(ang), sin = Math.sin(ang), dx = x - cx, dy = y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}
const aabbHit = (a, b) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)

let _id = 0
const nextId = () => `s${++_id}`

export default function Whiteboard({ tool = 'pen', color = '#111111', clearNonce = 0, onPickSelectTool }) {
  const canvasRef = useRef(null), ctxRef = useRef(null), wrapRef = useRef(null), inputRef = useRef(null)

  const [shapes, setShapes] = useState([])
  const [draft, setDraft] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [editing, setEditing] = useState(null)
  const [eraserCursor, setEraserCursor] = useState(null)
  const [hoverCursor, setHoverCursor] = useState('default')
  const [marquee, setMarquee] = useState(null)         // 드래그 다중선택 박스
  const [curveHover, setCurveHover] = useState(null)   // 곡선 미리보기 커서점
  const [layersOpen, setLayersOpen] = useState(true)
  const [dragLayer, setDragLayer] = useState(null)
  const [panelPos, setPanelPos] = useState(null) // 레이어 패널 위치(드래그로 이동). null이면 기본 우상단
  const panelRef = useRef(null)
  const [degText, setDegText] = useState('0')
  const degFocus = useRef(false)

  const [strokeWidth, setStrokeWidth] = useState(3)
  const [opacity, setOpacity] = useState(1)
  const [fontFamily, setFontFamily] = useState('sans-serif')
  const [fontSize, setFontSize] = useState(TEXT_SIZE)
  const [bold, setBold] = useState(false)
  const [polygonSides, setPolygonSides] = useState(5)
  const polygonSidesRef = useRef(polygonSides)
  useEffect(() => { polygonSidesRef.current = polygonSides }, [polygonSides])

  const drag = useRef(null)
  const eraseRadius = Math.max(6, strokeWidth)
  const shapesRef = useRef(shapes), draftRef = useRef(draft), selRef = useRef(selectedIds)
  const toolRef = useRef(tool), colorRef = useRef(color), widthRef = useRef(strokeWidth), opacityRef = useRef(opacity)
  const eraseRadiusRef = useRef(eraseRadius), curveHoverRef = useRef(curveHover)
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { selRef.current = selectedIds }, [selectedIds])
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { widthRef.current = strokeWidth }, [strokeWidth])
  useEffect(() => { opacityRef.current = opacity }, [opacity])
  useEffect(() => { eraseRadiusRef.current = eraseRadius }, [eraseRadius])
  useEffect(() => { curveHoverRef.current = curveHover }, [curveHover])

  const fontStr = (s) => `${s.bold ? 'bold ' : ''}${s.fontSize || TEXT_SIZE}px ${s.fontFamily || 'sans-serif'}`
  const setSel = (ids) => setSelectedIds(ids)
  const isSel = (id) => selRef.current.includes(id)

  const bbox = useCallback((s) => {
    if (isPath(s)) {
      const xs = s.points.map((p) => p.x), ys = s.points.map((p) => p.y)
      const x = Math.min(...xs), y = Math.min(...ys)
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
    }
    if (s.type === 'line') return { x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2), w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) }
    if (s.type === 'text') {
      const ctx = ctxRef.current; let w = 40
      if (ctx) { ctx.font = fontStr(s); w = ctx.measureText(s.text || '').width }
      return { x: s.x, y: s.y, w, h: s.fontSize || TEXT_SIZE }
    }
    return { x: Math.min(s.x, s.x + s.w), y: Math.min(s.y, s.y + s.h), w: Math.abs(s.w), h: Math.abs(s.h) }
  }, [])

  const center = useCallback((s) => { const b = bbox(s); return { x: b.x + b.w / 2, y: b.y + b.h / 2 } }, [bbox])
  const toLocal = useCallback((p, s) => { const c = center(s); return rotatePt(p.x, p.y, c.x, c.y, -(s.rotation || 0)) }, [center])
  const corners = (b) => ({ nw: { x: b.x, y: b.y }, ne: { x: b.x + b.w, y: b.y }, sw: { x: b.x, y: b.y + b.h }, se: { x: b.x + b.w, y: b.y + b.h } })
  const screenAABB = useCallback((s) => {
    const b = bbox(s), c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }, rot = s.rotation || 0
    const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]].map(([x, y]) => rotatePt(x, y, c.x, c.y, rot))
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
  }, [bbox])

  const paintPath = (ctx, pts, smooth) => {
    ctx.beginPath()
    if (pts.length === 1) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1); ctx.stroke(); return }
    ctx.moveTo(pts[0].x, pts[0].y)
    if (!smooth || pts.length === 2) { for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y) }
    else {
      for (let i = 1; i < pts.length - 1; i++) { const xc = (pts[i].x + pts[i + 1].x) / 2, yc = (pts[i].y + pts[i + 1].y) / 2; ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc) }
      ctx.quadraticCurveTo(pts[pts.length - 1].x, pts[pts.length - 1].y, pts[pts.length - 1].x, pts[pts.length - 1].y)
    }
    ctx.stroke()
  }

  const paintShape = (ctx, s) => {
    if (s.hidden) return
    ctx.save()
    const rot = s.rotation || 0
    if (rot) { const c = center(s); ctx.translate(c.x, c.y); ctx.rotate(rot); ctx.translate(-c.x, -c.y) }
    ctx.globalAlpha = s.opacity ?? 1
    if (s.highlight) ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (s.type === 'pen') paintPath(ctx, s.points, false)
    else if (s.type === 'curve') paintPath(ctx, s.points, true)
    else if (s.type === 'line') { ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke() }
    else if (s.type === 'rect') ctx.strokeRect(s.x, s.y, s.w, s.h)
    else if (s.type === 'ellipse') { ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2); ctx.stroke() }
    else if (s.type === 'triangle') { ctx.beginPath(); ctx.moveTo(s.x + s.w / 2, s.y); ctx.lineTo(s.x + s.w, s.y + s.h); ctx.lineTo(s.x, s.y + s.h); ctx.closePath(); ctx.stroke() }
    else if (s.type === 'polygon') { const n = Math.max(3, s.sides || 5), cx = s.x + s.w / 2, cy = s.y + s.h / 2, rx = s.w / 2, ry = s.h / 2; ctx.beginPath(); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (2 * Math.PI * i) / n, px = cx + rx * Math.cos(a), py = cy + ry * Math.sin(a); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py) } ctx.closePath(); ctx.stroke() }
    else if (s.type === 'text') { ctx.font = fontStr(s); ctx.textBaseline = 'top'; ctx.fillText(s.text, s.x, s.y) }
    ctx.restore()
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of shapesRef.current) paintShape(ctx, s)
    if (draftRef.current) { let d = draftRef.current; if (d.type === 'curve' && curveHoverRef.current) d = { ...d, points: [...d.points, curveHoverRef.current] }; paintShape(ctx, d) }
    const ids = selRef.current
    ids.forEach((id) => {
      const sel = shapesRef.current.find((s) => s.id === id)
      if (!sel) return
      const b = bbox(sel), rot = sel.rotation || 0, c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
      ctx.save()
      if (rot) { ctx.translate(c.x, c.y); ctx.rotate(rot); ctx.translate(-c.x, -c.y) }
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1; ctx.setLineDash([5, 4])
      ctx.strokeRect(b.x - HIT_PAD, b.y - HIT_PAD, b.w + HIT_PAD * 2, b.h + HIT_PAD * 2); ctx.setLineDash([])
      if (ids.length === 1) {
        const tx = b.x + b.w / 2, ty = b.y - HIT_PAD
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - ROT_OFFSET); ctx.stroke()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tx, ty - ROT_OFFSET, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        Object.values(corners(b)).forEach((cc) => { ctx.fillRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE); ctx.strokeRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE) })
      }
      ctx.restore()
    })
  }, [bbox, center])

  const fit = useCallback(() => {
    const canvas = canvasRef.current, parent = wrapRef.current
    if (!canvas || !parent) return
    const dpr = window.devicePixelRatio || 1, w = parent.clientWidth, h = parent.clientHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctxRef.current = ctx; redraw()
  }, [redraw])

  useEffect(() => { fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit) }, [fit])
  useEffect(() => { redraw() }, [shapes, draft, selectedIds, marquee, curveHover, redraw])
  useEffect(() => { if (clearNonce === 0) return; setShapes([]); setSelectedIds([]); setEditing(null); setDraft(null) }, [clearNonce])
  useEffect(() => { if (!selRef.current.length) return; const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, color } : s))) }, [color])
  useEffect(() => { if (!editing) return; const r = requestAnimationFrame(() => inputRef.current?.focus()); return () => cancelAnimationFrame(r) }, [editing?.id, editing?.x, editing?.y])
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
        const clamp = (v) => Math.max(3, Math.min(12, v))
        setPolygonSides((n) => clamp(n + delta))
        // 드래그로 그리는 중인 미확정 다각형도 실시간 반영(누른 상태에서 ↑↓)
        setDraft((d) => (d && d.type === 'polygon') ? { ...d, sides: clamp((d.sides || 5) + delta) } : d)
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

  const hitTest = (p) => {
    const arr = shapesRef.current
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].hidden) continue
      const lp = toLocal(p, arr[i]); const b = bbox(arr[i])
      if (lp.x >= b.x - HIT_PAD && lp.x <= b.x + b.w + HIT_PAD && lp.y >= b.y - HIT_PAD && lp.y <= b.y + b.h + HIT_PAD) return arr[i].id
    }
    return null
  }
  const handleAt = (p, s) => {
    const lp = toLocal(p, s); const b = bbox(s)
    const rh = { x: b.x + b.w / 2, y: b.y - HIT_PAD - ROT_OFFSET }
    if (Math.hypot(lp.x - rh.x, lp.y - rh.y) <= ROT_HIT) return { kind: 'rotate' }
    const c = corners(b)
    for (const [k, pt] of Object.entries(c)) if (Math.abs(lp.x - pt.x) <= HANDLE && Math.abs(lp.y - pt.y) <= HANDLE) return { kind: 'resize', cornerKey: k, anchor: c[{ nw: 'se', ne: 'sw', sw: 'ne', se: 'nw' }[k]] }
    return null
  }
  const resizeCursor = (cornerKey, rotation) => {
    const v = { nw: [-1, -1], ne: [1, -1], se: [1, 1], sw: [-1, 1] }[cornerKey]
    const deg = (Math.atan2(v[1], v[0]) + (rotation || 0)) * 180 / Math.PI, a = ((deg % 180) + 180) % 180
    if (a < 22.5 || a >= 157.5) return 'ew-resize'
    if (a < 67.5) return 'nwse-resize'
    if (a < 112.5) return 'ns-resize'
    return 'nesw-resize'
  }

  const mapShape = (s, ob, nb) => {
    const sx = ob.w ? nb.w / ob.w : 1, sy = ob.h ? nb.h / ob.h : 1
    const mp = (x, y) => ({ x: nb.x + (x - ob.x) * sx, y: nb.y + (y - ob.y) * sy })
    if (isPath(s)) return { ...s, points: s.points.map((p) => mp(p.x, p.y)) }
    if (s.type === 'line') { const a = mp(s.x1, s.y1), b = mp(s.x2, s.y2); return { ...s, x1: a.x, y1: a.y, x2: b.x, y2: b.y } }
    if (s.type === 'text') { const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, fontSize: Math.max(6, (s.fontSize || TEXT_SIZE) * sy) } }
    const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, w: s.w * sx, h: s.h * sy }
  }
  const translate = (s, dx, dy) => {
    if (isPath(s)) return { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
    if (s.type === 'line') return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }
    return { ...s, x: s.x + dx, y: s.y + dy }
  }
  const cloneShape = (s, id) => { const c = { ...s, id }; if (isPath(s)) c.points = s.points.map((p) => ({ ...p })); return c }

  const isErased = (s, p, r) => {
    const lp = toLocal(p, s)
    if (isPath(s)) {
      const pts = s.points
      if (pts.length === 1) return Math.hypot(lp.x - pts[0].x, lp.y - pts[0].y) <= r + (s.width || 0) / 2
      for (let i = 1; i < pts.length; i++) if (segDist(lp.x, lp.y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= r + (s.width || 0) / 2) return true
      return false
    }
    if (s.type === 'line') return segDist(lp.x, lp.y, s.x1, s.y1, s.x2, s.y2) <= r + (s.width || 0) / 2
    const b = bbox(s)
    return lp.x >= b.x - r && lp.x <= b.x + b.w + r && lp.y >= b.y - r && lp.y <= b.y + b.h + r
  }
  const eraseAt = (p) => setShapes((prev) => prev.filter((s) => s.hidden || !isErased(s, p, eraseRadiusRef.current)))

  function handleDown(e) {
    const p = getPos(e); const t = toolRef.current
    if (t === 'text') { setSel([]); setEditing({ x: p.x, y: p.y, value: '' }); return }
    if (t === 'curve') { setSel([]); setDraft((d) => (d && d.type === 'curve') ? { ...d, points: [...d.points, p] } : { id: nextId(), type: 'curve', color: colorRef.current, width: widthRef.current, opacity: opacityRef.current, points: [p] }); return }

    canvasRef.current.setPointerCapture(e.pointerId)
    if (t === 'eraser') { setSel([]); drag.current = { mode: 'erase' }; eraseAt(p); return }

    if (t === 'select') {
      // 단일 선택 상태에서 핸들(크기/회전) 우선
      if (selRef.current.length === 1) {
        const cur = shapesRef.current.find((s) => s.id === selRef.current[0])
        if (cur) {
          const h = handleAt(p, cur)
          if (h?.kind === 'rotate') { const c = center(cur); drag.current = { mode: 'rotate', cx: c.x, cy: c.y, start: Math.atan2(p.y - c.y, p.x - c.x), orig: cur.rotation || 0, id: cur.id }; return }
          if (h?.kind === 'resize') { drag.current = { mode: 'resize', anchor: h.anchor, origShape: cur, origBox: bbox(cur), id: cur.id }; return }
        }
      }
      const id = hitTest(p)
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
    else if (t === 'rect') setDraft({ id: nextId(), type: 'rect', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0 })
    else if (t === 'ellipse') setDraft({ id: nextId(), type: 'ellipse', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0 })
    else if (t === 'triangle') setDraft({ id: nextId(), type: 'triangle', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0 })
    else if (t === 'polygon') setDraft({ id: nextId(), type: 'polygon', sides: polygonSidesRef.current, color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0 })
  }

  function handleMove(e) {
    const p = getPos(e); const t = toolRef.current
    if (t === 'eraser') setEraserCursor(p)
    if (t === 'curve' && draftRef.current?.type === 'curve') setCurveHover(p)

    if (!drag.current) {
      if (t === 'select') {
        let cz = 'default'
        if (selRef.current.length === 1) { const cur = shapesRef.current.find((s) => s.id === selRef.current[0]); if (cur) { const h = handleAt(p, cur); if (h?.kind === 'rotate') cz = ROTATE_CURSOR; else if (h?.kind === 'resize') cz = resizeCursor(h.cornerKey, cur.rotation); else if (hitTest(p)) cz = 'move' } else if (hitTest(p)) cz = 'move' }
        else if (hitTest(p)) cz = 'move'
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
      const lp = toLocal(p, drag.current.origShape), a = drag.current.anchor
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
      setDraft((d) => { if (!d) return d; if (d.type === 'pen') return { ...d, points: [...d.points, p] }; if (d.type === 'line') return { ...d, x2: p.x, y2: p.y }; return { ...d, w: p.x - d.x, h: p.y - d.y } })
    }
  }

  function handleUp() {
    const dc = drag.current
    if (dc?.mode === 'marquee') {
      const m = marquee
      if (m && (m.w > 2 || m.h > 2)) {
        const hits = shapesRef.current.filter((s) => !s.hidden && aabbHit(screenAABB(s), m)).map((s) => s.id)
        setSel(dc.add ? [...new Set([...selRef.current, ...hits])] : hits)
      }
      setMarquee(null)
    } else if (dc?.mode === 'draw' && draftRef.current) {
      let d = draftRef.current
      const isBox = ['rect', 'ellipse', 'triangle', 'polygon'].includes(d.type)
      const tinyBox = isBox && Math.abs(d.w) < 3 && Math.abs(d.h) < 3
      const tinyLine = d.type === 'line' && Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3
      if (isBox) { if (d.w < 0) d = { ...d, x: d.x + d.w, w: -d.w }; if (d.h < 0) d = { ...d, y: d.y + d.h, h: -d.h } }
      if (!tinyBox && !tinyLine) setShapes((prev) => [...prev, d])
      setDraft(null)
    }
    drag.current = null
  }

  const commitText = () => {
    if (!editing) return
    const text = editing.value.trim()
    setShapes((prev) => {
      if (editing.id) { if (!text) return prev.filter((s) => s.id !== editing.id); return prev.map((s) => (s.id === editing.id ? { ...s, text } : s)) }
      if (!text) return prev
      return [...prev, { id: nextId(), type: 'text', color: colorRef.current, opacity: opacityRef.current, x: editing.x, y: editing.y, text, fontFamily, fontSize, bold }]
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
    const id = hitTest(getPos(e)); const s = shapesRef.current.find((x) => x.id === id)
    if (s && s.type === 'text') { setSel([id]); setEditing({ x: s.x, y: s.y, value: s.text, id: s.id }) }
  }

  const applyToSelected = (patch) => { const set = new Set(selRef.current); if (set.size) setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, ...patch } : s))) }
  const onWidth = (w) => { setStrokeWidth(w); applyToSelected({ width: w }) }
  const onOpacity = (o) => { setOpacity(o); applyToSelected({ opacity: o }) }
  const applyDeg = (text) => { const n = parseFloat(text); if (Number.isFinite(n)) applyToSelected({ rotation: (n * Math.PI) / 180 }) }

  // 레이어 동작
  const pickLayer = (e, id, isText) => {
    if (e.shiftKey) { const cur = selRef.current; setSel(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) }
    else setSel([id])
    onPickSelectTool?.()
    if (isText) { const s = shapesRef.current.find((x) => x.id === id); if (s) setEditing({ x: s.x, y: s.y, value: s.text, id: s.id }) }
  }
  const deleteLayer = (id) => { setShapes((prev) => prev.filter((s) => s.id !== id)); setSel(selRef.current.filter((x) => x !== id)) }
  const toggleHidden = (id) => setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)))
  const dropLayer = (targetId) => {
    const from = dragLayer; setDragLayer(null)
    if (!from || from === targetId) return
    setShapes((prev) => { const arr = prev.slice(); const fi = arr.findIndex((s) => s.id === from), ti = arr.findIndex((s) => s.id === targetId); if (fi < 0 || ti < 0) return prev; const [mv] = arr.splice(fi, 1); arr.splice(ti, 0, mv); return arr })
  }
  // 레이어 패널 헤더를 "누르고 있는 동안만" 이동 (window 리스너로 떼는 즉시 종료)
  const onPanelDown = (e) => {
    const el = panelRef.current
    if (!el) return
    e.preventDefault()
    const start = { sx: e.clientX, sy: e.clientY, left: el.offsetLeft, top: el.offsetTop }
    const move = (ev) => {
      const wrap = wrapRef.current
      let left = start.left + (ev.clientX - start.sx)
      let top = start.top + (ev.clientY - start.sy)
      if (wrap && el) { // 화이트보드 영역 안으로만 제한(밖으로 나가 못 잡는 일 방지)
        left = Math.max(0, Math.min(left, wrap.clientWidth - el.offsetWidth))
        top = Math.max(0, Math.min(top, wrap.clientHeight - el.offsetHeight))
      }
      setPanelPos({ left, top })
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const layerLabel = (s) => s.type === 'text' ? `텍스트: ${(s.text || '').slice(0, 9) || '(빈)'}` : s.type === 'polygon' ? `${s.sides || 5}각형` : (({ pen: '펜', curve: '곡선', line: '직선', rect: '사각형', ellipse: '원', triangle: '삼각형' }[s.type]) + (s.highlight ? ' (형광)' : ''))
  const LayerIcon = ({ s }) => {
    const st = s.color || '#111'
    const wrap = (child) => <svg width="18" height="18" viewBox="0 0 20 20" style={{ flex: '0 0 auto' }}>{child}</svg>
    if (s.type === 'rect') return wrap(<rect x="3" y="5" width="14" height="10" fill="none" stroke={st} strokeWidth="2" />)
    if (s.type === 'ellipse') return wrap(<ellipse cx="10" cy="10" rx="7" ry="5" fill="none" stroke={st} strokeWidth="2" />)
    if (s.type === 'line') return wrap(<line x1="3" y1="16" x2="17" y2="4" stroke={st} strokeWidth="2" strokeLinecap="round" />)
    if (s.type === 'curve') return wrap(<path d="M3 14 Q 8 2 12 10 T 17 8" fill="none" stroke={st} strokeWidth="2" strokeLinecap="round" />)
    if (s.type === 'triangle') return wrap(<path d="M10 4 L17 16 L3 16 Z" fill="none" stroke={st} strokeWidth="2" strokeLinejoin="round" />)
    if (s.type === 'polygon') return wrap(<path d="M10 3 L16 7.5 L13.5 15 L6.5 15 L4 7.5 Z" fill="none" stroke={st} strokeWidth="2" strokeLinejoin="round" />)
    if (s.type === 'text') return <span style={{ width: 18, textAlign: 'center', fontWeight: 900, color: st }}>T</span>
    return wrap(<path d="M3 13 q 4 -9 7 0 t 7 0" fill="none" stroke={st} strokeWidth="2" strokeLinecap="round" />) // pen/highlight squiggle
  }

  const baseCursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : tool === 'curve' ? 'crosshair' : tool === 'select' ? hoverCursor : 'crosshair'
  const showTextOpts = tool === 'text'
  let rotHud = null
  if (selectedIds.length === 1 && tool === 'select' && ctxRef.current) {
    const s = shapes.find((x) => x.id === selectedIds[0])
    if (s) { const b = bbox(s), c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; rotHud = rotatePt(b.x + b.w / 2, b.y - HIT_PAD - ROT_OFFSET, c.x, c.y, s.rotation || 0) }
  }

  return (
    <div ref={wrapRef} style={{ height: '100%', background: '#fff', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 6, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '6px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', fontSize: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontWeight: 700 }}>굵기
          <input type="range" min={1} max={40} value={strokeWidth} onChange={(e) => onWidth(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ width: 26, textAlign: 'right', color: '#111' }}>{strokeWidth}</span>
        </label>
        <span style={{ width: 1, height: 20, background: '#eee' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontWeight: 700 }}>투명도
          <input type="range" min={10} max={100} value={Math.round(opacity * 100)} onChange={(e) => onOpacity(Number(e.target.value) / 100)} style={{ width: 80 }} />
          <span style={{ width: 34, textAlign: 'right', color: '#111' }}>{Math.round(opacity * 100)}%</span>
        </label>
        {showTextOpts && (<>
          <span style={{ width: 1, height: 20, background: '#eee' }} />
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} title="글꼴" style={{ fontSize: 12, padding: 3 }}>{FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
          <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} title="글자 크기" style={{ fontSize: 12, padding: 3 }}>{FONT_SIZES.map((sz) => <option key={sz} value={sz}>{sz}px</option>)}</select>
          <button onClick={() => setBold((b) => !b)} title="굵게" style={{ width: 26, height: 26, fontWeight: 900, border: bold ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>B</button>
        </>)}
        {tool === 'curve' && <span style={{ color: '#6b7280' }}>점 클릭 → 더블클릭으로 완료</span>}
        {tool === 'polygon' && (
          <>
            <span style={{ width: 1, height: 20, background: '#eee' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontWeight: 700 }}>
              <span style={{ background: '#111827', color: '#fff', borderRadius: 10, padding: '1px 8px' }}>{polygonSides}각형</span>
              <button onClick={() => setPolygonSides((n) => Math.min(12, n + 1))} title="각 늘리기(↑)" style={{ width: 22, height: 22, border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: 'pointer' }}>▲</button>
              <button onClick={() => setPolygonSides((n) => Math.max(3, n - 1))} title="각 줄이기(↓, 최소 3)" style={{ width: 22, height: 22, border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: 'pointer' }}>▼</button>
              <span style={{ color: '#6b7280', fontWeight: 400 }}>↑↓ 키로도 조절</span>
            </span>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: baseCursor }}
        onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp}
        onPointerLeave={() => { handleUp(); setEraserCursor(null) }} onDoubleClick={handleDoubleClick} />

      {marquee && <div style={{ position: 'absolute', left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, border: '1px dashed #2563eb', background: 'rgba(37,99,235,0.08)', zIndex: 4, pointerEvents: 'none' }} />}

      {tool === 'eraser' && eraserCursor && (
        <div style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none', left: eraserCursor.x - eraseRadius, top: eraserCursor.y - eraseRadius, width: eraseRadius * 2, height: eraseRadius * 2, borderRadius: '50%', border: '1.5px solid #6b7280', background: 'rgba(148,163,184,0.18)' }} />
      )}

      {/* 레이어 패널 (헤더 드래그로 이동, 목록은 고정 높이+스크롤) */}
      <div ref={panelRef} style={{ position: 'absolute', ...(panelPos ? { left: panelPos.left, top: panelPos.top } : { left: 10, top: '55%' }), zIndex: 8, width: 195, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', fontSize: 12, display: 'flex', flexDirection: 'column' }}>
        <div onPointerDown={onPanelDown} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', cursor: 'move', fontWeight: 800, color: '#374151', borderBottom: layersOpen ? '1px solid #f1f5f9' : 'none', userSelect: 'none' }}>
          <span>≡ 레이어 ({shapes.length})</span>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setLayersOpen((o) => !o)} style={layerBtn}>{layersOpen ? '▾' : '▸'}</button>
        </div>
        {layersOpen && (
          <div style={{ overflowY: 'auto', maxHeight: 240, padding: 4 }}>
            {shapes.length === 0 && <div style={{ color: '#9ca3af', textAlign: 'center', padding: '10px 0' }}>아직 없음</div>}
            {shapes.slice().reverse().map((s) => {
              const sel = selectedIds.includes(s.id)
              return (
                <div key={s.id} draggable onDragStart={() => setDragLayer(s.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropLayer(s.id)}
                  onClick={(e) => pickLayer(e, s.id, false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 5px', borderRadius: 6, cursor: 'pointer', background: sel ? '#dbeafe' : 'transparent', opacity: s.hidden ? 0.45 : 1 }}>
                  <button title={s.hidden ? '표시' : '숨기기'} onClick={(e) => { e.stopPropagation(); toggleHidden(s.id) }} style={layerBtn}>{s.hidden ? '🙈' : '👁'}</button>
                  <LayerIcon s={s} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layerLabel(s)}</span>
                  {s.type === 'text' && <button title="수정" onClick={(e) => { e.stopPropagation(); pickLayer(e, s.id, true) }} style={layerBtn}>✎</button>}
                  <button title="삭제" onClick={(e) => { e.stopPropagation(); deleteLayer(s.id) }} style={{ ...layerBtn, color: '#ef4444' }}>🗑</button>
                  <span title="드래그로 순서 변경" style={{ cursor: 'grab', color: '#9ca3af' }}>⠿</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rotHud && (
        <div style={{ position: 'absolute', left: rotHud.x, top: rotHud.y - 32, transform: 'translateX(-50%)', zIndex: 8, background: '#111827', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <input value={degText} onFocus={() => { degFocus.current = true }} onBlur={() => { degFocus.current = false }} onChange={(e) => { setDegText(e.target.value); applyDeg(e.target.value) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} title="회전 각도(도)" style={{ width: 36, border: 'none', borderRadius: 4, padding: '1px 3px', fontSize: 11, textAlign: 'right' }} /><span>°</span>
        </div>
      )}

      {editing && (
        <input ref={inputRef} autoFocus value={editing.value} onChange={(e) => setEditing((ed) => ({ ...ed, value: e.target.value }))} onBlur={commitText}
          onKeyDown={(e) => { if (e.key === 'Enter') commitText(); else if (e.key === 'Escape') setEditing(null) }} placeholder="입력 후 Enter"
          style={{ position: 'absolute', left: editing.x, top: editing.y, zIndex: 7, font: `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`, color, border: '1px dashed #2563eb', background: 'rgba(255,255,255,0.95)', padding: '0 2px', outline: 'none', minWidth: 140 }} />
      )}
    </div>
  )
}
