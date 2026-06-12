/**
 * @file Whiteboard.jsx
 * @description 강의실 화이트보드 — 객체(retained) 기반 <canvas>.
 * - 도형을 객체 배열(shapes)로 보관, 매 변경마다 전체 재렌더. 선택/이동/크기변경/회전/삭제/수정.
 * - 도구(tool)·색(color)·전체지우기(clearNonce)는 부모(좌측 툴바) props.
 *   tool: 'select' | 'pen' | 'highlighter' | 'line' | 'rect' | 'ellipse' | 'text' | 'eraser'
 * - 선굵기·투명도 슬라이더, 텍스트 글꼴/크기/굵기는 상단 옵션바.
 * - 선택 시: 모서리 핸들=크기변경, 위쪽 핸들=회전, 안쪽=이동. 커서도 PPT/포토샵처럼 바뀜.
 * - 회전은 도형 중심 기준. 지오메트리는 미회전 상태로 저장하고 렌더 시 rotate 변환.
 * - 로컬 전용(실시간 공유는 후속).
 */
import { useEffect, useRef, useState, useCallback } from 'react'

const TEXT_SIZE = 20
const HIT_PAD = 6
const HANDLE = 10
const ROT_OFFSET = 24 // 회전 핸들이 박스 위로 떨어진 거리
const ROT_HIT = 10

const FONTS = [
  { label: '기본', value: 'sans-serif' },
  { label: '명조', value: 'serif' },
  { label: '고정폭', value: 'monospace' },
  { label: '손글씨', value: "'Jua', sans-serif" },
]
const FONT_SIZES = [14, 20, 28, 40, 56]

// 회전 커서(원형 화살표 SVG). 미지원 시 grab으로 폴백.
const ROTATE_CURSOR = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g fill='none' stroke='%23111827' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12a7 7 0 1 1 2.05 4.95'/><path d='M3 14l2.2 2.6L8 14'/></g></svg>\") 12 12, grab"

const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
const rotatePt = (x, y, cx, cy, ang) => {
  const cos = Math.cos(ang), sin = Math.sin(ang), dx = x - cx, dy = y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

let _id = 0
const nextId = () => `s${++_id}`

export default function Whiteboard({ tool = 'pen', color = '#111111', clearNonce = 0 }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const [shapes, setShapes] = useState([])
  const [draft, setDraft] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [eraserCursor, setEraserCursor] = useState(null)
  const [hoverCursor, setHoverCursor] = useState('default') // select 도구 동적 커서

  const [degText, setDegText] = useState('0') // 회전 각도 말풍선 입력값
  const degFocus = useRef(false)

  const [strokeWidth, setStrokeWidth] = useState(3)
  const [opacity, setOpacity] = useState(1)
  const [fontFamily, setFontFamily] = useState('sans-serif')
  const [fontSize, setFontSize] = useState(TEXT_SIZE)
  const [bold, setBold] = useState(false)

  const drag = useRef(null)

  const eraseRadius = Math.max(6, strokeWidth)
  const shapesRef = useRef(shapes), draftRef = useRef(draft), selRef = useRef(selectedId)
  const toolRef = useRef(tool), colorRef = useRef(color), widthRef = useRef(strokeWidth), opacityRef = useRef(opacity)
  const eraseRadiusRef = useRef(eraseRadius)
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { selRef.current = selectedId }, [selectedId])
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { widthRef.current = strokeWidth }, [strokeWidth])
  useEffect(() => { opacityRef.current = opacity }, [opacity])
  useEffect(() => { eraseRadiusRef.current = eraseRadius }, [eraseRadius])

  const fontStr = (s) => `${s.bold ? 'bold ' : ''}${s.fontSize || TEXT_SIZE}px ${s.fontFamily || 'sans-serif'}`

  const bbox = useCallback((s) => {
    if (s.type === 'pen') {
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

  const paintShape = (ctx, s) => {
    ctx.save()
    const rot = s.rotation || 0
    if (rot) { const c = center(s); ctx.translate(c.x, c.y); ctx.rotate(rot); ctx.translate(-c.x, -c.y) }
    ctx.globalAlpha = s.opacity ?? 1
    if (s.highlight) ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color
    ctx.lineWidth = s.width || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (s.type === 'pen') {
      ctx.beginPath()
      s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1)
      ctx.stroke()
    } else if (s.type === 'line') {
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke()
    } else if (s.type === 'rect') {
      ctx.strokeRect(s.x, s.y, s.w, s.h)
    } else if (s.type === 'ellipse') {
      ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2); ctx.stroke()
    } else if (s.type === 'text') {
      ctx.font = fontStr(s); ctx.textBaseline = 'top'; ctx.fillText(s.text, s.x, s.y)
    }
    ctx.restore()
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of shapesRef.current) paintShape(ctx, s)
    if (draftRef.current) paintShape(ctx, draftRef.current)
    const sel = shapesRef.current.find((s) => s.id === selRef.current)
    if (sel) {
      const b = bbox(sel), rot = sel.rotation || 0, c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
      ctx.save()
      if (rot) { ctx.translate(c.x, c.y); ctx.rotate(rot); ctx.translate(-c.x, -c.y) }
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1
      ctx.setLineDash([5, 4]); ctx.strokeRect(b.x - HIT_PAD, b.y - HIT_PAD, b.w + HIT_PAD * 2, b.h + HIT_PAD * 2); ctx.setLineDash([])
      // 회전 핸들
      const topX = b.x + b.w / 2, topY = b.y - HIT_PAD
      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(topX, topY - ROT_OFFSET); ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(topX, topY - ROT_OFFSET, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      // 모서리 핸들
      Object.values(corners(b)).forEach((cc) => { ctx.fillRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE); ctx.strokeRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE) })
      ctx.restore()
    }
  }, [bbox, center])

  const fit = useCallback(() => {
    const canvas = canvasRef.current, parent = wrapRef.current
    if (!canvas || !parent) return
    const dpr = window.devicePixelRatio || 1
    const w = parent.clientWidth, h = parent.clientHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctxRef.current = ctx
    redraw()
  }, [redraw])

  useEffect(() => { fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit) }, [fit])
  useEffect(() => { redraw() }, [shapes, draft, selectedId, redraw])
  useEffect(() => { if (clearNonce === 0) return; setShapes([]); setSelectedId(null); setEditing(null) }, [clearNonce])
  useEffect(() => { if (!selRef.current) return; setShapes((prev) => prev.map((s) => (s.id === selRef.current ? { ...s, color } : s))) }, [color])
  useEffect(() => { if (!editing) return; const r = requestAnimationFrame(() => inputRef.current?.focus()); return () => cancelAnimationFrame(r) }, [editing?.id, editing?.x, editing?.y])

  useEffect(() => {
    const onKey = (e) => {
      if (editing) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selRef.current) { setShapes((prev) => prev.filter((s) => s.id !== selRef.current)); setSelectedId(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  const getPos = (e) => { const r = canvasRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }

  // 회전 고려한 히트테스트(로컬 좌표로 변환 후 bbox 검사)
  const hitTest = (p) => {
    const arr = shapesRef.current
    for (let i = arr.length - 1; i >= 0; i--) {
      const lp = toLocal(p, arr[i]); const b = bbox(arr[i])
      if (lp.x >= b.x - HIT_PAD && lp.x <= b.x + b.w + HIT_PAD && lp.y >= b.y - HIT_PAD && lp.y <= b.y + b.h + HIT_PAD) return arr[i].id
    }
    return null
  }

  // 선택 도형 위 어떤 조작 지점인가 (로컬 좌표)
  const handleAt = (p, s) => {
    const lp = toLocal(p, s); const b = bbox(s)
    const rh = { x: b.x + b.w / 2, y: b.y - HIT_PAD - ROT_OFFSET }
    if (Math.hypot(lp.x - rh.x, lp.y - rh.y) <= ROT_HIT) return { kind: 'rotate' }
    const c = corners(b)
    for (const [k, pt] of Object.entries(c)) {
      if (Math.abs(lp.x - pt.x) <= HANDLE && Math.abs(lp.y - pt.y) <= HANDLE) return { kind: 'resize', cornerKey: k, anchor: c[{ nw: 'se', ne: 'sw', sw: 'ne', se: 'nw' }[k]] }
    }
    return null
  }

  const resizeCursor = (cornerKey, rotation) => {
    const v = { nw: [-1, -1], ne: [1, -1], se: [1, 1], sw: [-1, 1] }[cornerKey]
    const deg = (Math.atan2(v[1], v[0]) + (rotation || 0)) * 180 / Math.PI
    const a = ((deg % 180) + 180) % 180
    if (a < 22.5 || a >= 157.5) return 'ew-resize'
    if (a < 67.5) return 'nwse-resize'
    if (a < 112.5) return 'ns-resize'
    return 'nesw-resize'
  }

  const mapShape = (s, ob, nb) => {
    const sx = ob.w ? nb.w / ob.w : 1, sy = ob.h ? nb.h / ob.h : 1
    const mp = (x, y) => ({ x: nb.x + (x - ob.x) * sx, y: nb.y + (y - ob.y) * sy })
    if (s.type === 'pen') return { ...s, points: s.points.map((p) => mp(p.x, p.y)) }
    if (s.type === 'line') { const a = mp(s.x1, s.y1), b = mp(s.x2, s.y2); return { ...s, x1: a.x, y1: a.y, x2: b.x, y2: b.y } }
    if (s.type === 'text') { const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, fontSize: Math.max(6, (s.fontSize || TEXT_SIZE) * sy) } }
    const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, w: s.w * sx, h: s.h * sy }
  }

  const translate = (s, dx, dy) => {
    if (s.type === 'pen') return { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
    if (s.type === 'line') return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }
    return { ...s, x: s.x + dx, y: s.y + dy }
  }

  const cloneShape = (s, id) => {
    const c = { ...s, id }
    if (s.type === 'pen') c.points = s.points.map((p) => ({ ...p }))
    return c
  }

  // 선택 도형 회전(도) ↔ 말풍선 입력값 동기화 (입력 중이 아닐 때만)
  useEffect(() => {
    if (degFocus.current) return
    const s = shapes.find((x) => x.id === selectedId)
    setDegText(s ? String((((Math.round((s.rotation || 0) * 180 / Math.PI)) % 360) + 360) % 360) : '0')
  }, [shapes, selectedId])

  const isErased = (s, p, r) => {
    const lp = toLocal(p, s)
    if (s.type === 'pen') {
      const pts = s.points
      if (pts.length === 1) return Math.hypot(lp.x - pts[0].x, lp.y - pts[0].y) <= r + (s.width || 0) / 2
      for (let i = 1; i < pts.length; i++) if (segDist(lp.x, lp.y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= r + (s.width || 0) / 2) return true
      return false
    }
    if (s.type === 'line') return segDist(lp.x, lp.y, s.x1, s.y1, s.x2, s.y2) <= r + (s.width || 0) / 2
    const b = bbox(s)
    return lp.x >= b.x - r && lp.x <= b.x + b.w + r && lp.y >= b.y - r && lp.y <= b.y + b.h + r
  }
  const eraseAt = (p) => setShapes((prev) => prev.filter((s) => !isErased(s, p, eraseRadiusRef.current)))

  function handleDown(e) {
    const p = getPos(e); const t = toolRef.current
    if (t === 'text') { setSelectedId(null); setEditing({ x: p.x, y: p.y, value: '' }); return }
    canvasRef.current.setPointerCapture(e.pointerId)
    if (t === 'eraser') { setSelectedId(null); drag.current = { mode: 'erase' }; eraseAt(p); return }

    if (t === 'select') {
      const cur = shapesRef.current.find((s) => s.id === selRef.current)
      if (cur) {
        const h = handleAt(p, cur)
        if (h?.kind === 'rotate') {
          const c = center(cur)
          drag.current = { mode: 'rotate', cx: c.x, cy: c.y, start: Math.atan2(p.y - c.y, p.x - c.x), orig: cur.rotation || 0, id: cur.id }
          return
        }
        if (h?.kind === 'resize') { drag.current = { mode: 'resize', anchor: h.anchor, origShape: cur, origBox: bbox(cur), id: cur.id }; return }
      }
      const id = hitTest(p)
      if (id) {
        const base = shapesRef.current.find((s) => s.id === id)
        let targetId = id
        if (e.ctrlKey) { // Ctrl+드래그 = 복사본을 끌고감(원본 유지)
          const clone = cloneShape(base, nextId())
          setShapes((prev) => [...prev, clone])
          targetId = clone.id
        }
        setSelectedId(targetId)
        drag.current = { mode: 'move', id: targetId, startP: p, origShape: cloneShape(base, targetId) }
      } else {
        setSelectedId(null)
      }
      return
    }

    setSelectedId(null)
    drag.current = { mode: 'draw', last: p }
    const c = colorRef.current, w = widthRef.current, op = opacityRef.current
    if (t === 'pen') setDraft({ id: nextId(), type: 'pen', color: c, width: w, opacity: op, points: [p] })
    else if (t === 'highlighter') setDraft({ id: nextId(), type: 'pen', highlight: true, color: c, width: Math.max(w, 12), opacity: Math.min(op, 0.5), points: [p] })
    else if (t === 'line') setDraft({ id: nextId(), type: 'line', color: c, width: w, opacity: op, x1: p.x, y1: p.y, x2: p.x, y2: p.y })
    else if (t === 'rect') setDraft({ id: nextId(), type: 'rect', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0 })
    else if (t === 'ellipse') setDraft({ id: nextId(), type: 'ellipse', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0 })
  }

  function handleMove(e) {
    const p = getPos(e)
    const t = toolRef.current
    if (t === 'eraser') setEraserCursor(p)

    // 드래그 중이 아니면: select 도구 동적 커서 계산
    if (!drag.current) {
      if (t === 'select') {
        const cur = shapesRef.current.find((s) => s.id === selRef.current)
        let cz = 'default'
        if (cur) {
          const h = handleAt(p, cur)
          if (h?.kind === 'rotate') cz = ROTATE_CURSOR
          else if (h?.kind === 'resize') cz = resizeCursor(h.cornerKey, cur.rotation)
          else if (hitTest(p)) cz = 'move'
        } else if (hitTest(p)) cz = 'move'
        setHoverCursor(cz)
      }
      return
    }

    if (drag.current.mode === 'move') {
      let dx = p.x - drag.current.startP.x, dy = p.y - drag.current.startP.y
      if (e.shiftKey) { if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0 } // 수직/수평 고정
      const id = drag.current.id
      const moved = translate(drag.current.origShape, dx, dy)
      setShapes((prev) => prev.map((s) => (s.id === id ? moved : s)))
    } else if (drag.current.mode === 'rotate') {
      const ang = Math.atan2(p.y - drag.current.cy, p.x - drag.current.cx)
      let rotation = drag.current.orig + (ang - drag.current.start)
      if (e.shiftKey) rotation = Math.round(rotation / (Math.PI / 4)) * (Math.PI / 4) // 45° 스냅
      const id = drag.current.id
      setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, rotation } : s)))
    } else if (drag.current.mode === 'resize') {
      const lp = toLocal(p, drag.current.origShape)
      const a = drag.current.anchor
      let nb = { x: Math.min(a.x, lp.x), y: Math.min(a.y, lp.y), w: Math.abs(lp.x - a.x), h: Math.abs(lp.y - a.y) }
      if (e.shiftKey) { // 비율 유지
        const ob = drag.current.origBox
        if (ob.w > 0 && ob.h > 0) {
          const sc = Math.max(nb.w / ob.w, nb.h / ob.h)
          const w = ob.w * sc, h = ob.h * sc
          const sx = lp.x >= a.x ? 1 : -1, sy = lp.y >= a.y ? 1 : -1
          const ox = a.x + sx * w, oy = a.y + sy * h
          nb = { x: Math.min(a.x, ox), y: Math.min(a.y, oy), w, h }
        }
      }
      const t2 = mapShape(drag.current.origShape, drag.current.origBox, nb)
      setShapes((prev) => prev.map((s) => (s.id === t2.id ? t2 : s)))
    } else if (drag.current.mode === 'erase') {
      eraseAt(p)
    } else {
      setDraft((d) => {
        if (!d) return d
        if (d.type === 'pen') return { ...d, points: [...d.points, p] }
        if (d.type === 'line') return { ...d, x2: p.x, y2: p.y }
        return { ...d, w: p.x - d.x, h: p.y - d.y }
      })
    }
  }

  function handleUp() {
    if (drag.current?.mode === 'draw' && draftRef.current) {
      let d = draftRef.current
      const tinyBox = (d.type === 'rect' || d.type === 'ellipse') && Math.abs(d.w) < 3 && Math.abs(d.h) < 3
      const tinyLine = d.type === 'line' && Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3
      if (d.type === 'rect' || d.type === 'ellipse') { if (d.w < 0) d = { ...d, x: d.x + d.w, w: -d.w }; if (d.h < 0) d = { ...d, y: d.y + d.h, h: -d.h } }
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
    if (toolRef.current !== 'select') return
    const p = getPos(e); const id = hitTest(p); const s = shapesRef.current.find((x) => x.id === id)
    if (s && s.type === 'text') { setSelectedId(id); setEditing({ x: s.x, y: s.y, value: s.text, id: s.id }) }
  }

  const applyToSelected = (patch) => { if (selRef.current) setShapes((prev) => prev.map((s) => (s.id === selRef.current ? { ...s, ...patch } : s))) }
  const onWidth = (w) => { setStrokeWidth(w); applyToSelected({ width: w }) }
  const onOpacity = (o) => { setOpacity(o); applyToSelected({ opacity: o }) }

  const baseCursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : tool === 'select' ? hoverCursor : 'crosshair'
  const showTextOpts = tool === 'text'

  // 회전 각도 말풍선 위치(선택 도형의 회전 핸들 화면 좌표)
  let rotHud = null
  const selShape = shapes.find((s) => s.id === selectedId)
  if (selShape && tool === 'select' && ctxRef.current) {
    const b = bbox(selShape), c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    rotHud = rotatePt(b.x + b.w / 2, b.y - HIT_PAD - ROT_OFFSET, c.x, c.y, selShape.rotation || 0)
  }
  const applyDeg = (text) => { const n = parseFloat(text); if (Number.isFinite(n)) applyToSelected({ rotation: (n * Math.PI) / 180 }) }

  return (
    <div ref={wrapRef} style={{ height: '100%', background: '#fff', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 6, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '6px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', fontSize: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontWeight: 700 }}>
          굵기
          <input type="range" min={1} max={40} value={strokeWidth} onChange={(e) => onWidth(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ width: 26, textAlign: 'right', color: '#111' }}>{strokeWidth}</span>
        </label>
        <span style={{ width: 1, height: 20, background: '#eee' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontWeight: 700 }}>
          투명도
          <input type="range" min={10} max={100} value={Math.round(opacity * 100)} onChange={(e) => onOpacity(Number(e.target.value) / 100)} style={{ width: 80 }} />
          <span style={{ width: 34, textAlign: 'right', color: '#111' }}>{Math.round(opacity * 100)}%</span>
        </label>
        {showTextOpts && (
          <>
            <span style={{ width: 1, height: 20, background: '#eee' }} />
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} title="글꼴" style={{ fontSize: 12, padding: 3 }}>
              {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} title="글자 크기" style={{ fontSize: 12, padding: 3 }}>
              {FONT_SIZES.map((sz) => <option key={sz} value={sz}>{sz}px</option>)}
            </select>
            <button onClick={() => setBold((b) => !b)} title="굵게" style={{ width: 26, height: 26, fontWeight: 900, border: bold ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>B</button>
          </>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: baseCursor }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={() => { handleUp(); setEraserCursor(null) }}
        onDoubleClick={handleDoubleClick}
      />

      {tool === 'eraser' && eraserCursor && (
        <div style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none', left: eraserCursor.x - eraseRadius, top: eraserCursor.y - eraseRadius, width: eraseRadius * 2, height: eraseRadius * 2, borderRadius: '50%', border: '1.5px solid #6b7280', background: 'rgba(148,163,184,0.18)' }} />
      )}

      {/* 회전 각도 말풍선 (선택 도형, 회전 중 실시간 표시 + 직접 입력) */}
      {rotHud && (
        <div style={{ position: 'absolute', left: rotHud.x, top: rotHud.y - 32, transform: 'translateX(-50%)', zIndex: 8, background: '#111827', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <input
            value={degText}
            onFocus={() => { degFocus.current = true }}
            onBlur={() => { degFocus.current = false }}
            onChange={(e) => { setDegText(e.target.value); applyDeg(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            title="회전 각도(도) — 직접 입력 가능"
            style={{ width: 36, border: 'none', borderRadius: 4, padding: '1px 3px', fontSize: 11, textAlign: 'right' }}
          />
          <span>°</span>
        </div>
      )}

      {editing && (
        <input
          ref={inputRef}
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing((ed) => ({ ...ed, value: e.target.value }))}
          onBlur={commitText}
          onKeyDown={(e) => { if (e.key === 'Enter') commitText(); else if (e.key === 'Escape') setEditing(null) }}
          placeholder="입력 후 Enter"
          style={{ position: 'absolute', left: editing.x, top: editing.y, zIndex: 7, font: `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`, color, border: '1px dashed #2563eb', background: 'rgba(255,255,255,0.95)', padding: '0 2px', outline: 'none', minWidth: 140 }}
        />
      )}
    </div>
  )
}
