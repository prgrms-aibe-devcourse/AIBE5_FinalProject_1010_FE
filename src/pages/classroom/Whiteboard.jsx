/**
 * @file Whiteboard.jsx
 * @description 강의실 화이트보드 — 객체(retained) 기반 <canvas>.
 * - 도형을 객체 배열(shapes)로 보관해 매 변경마다 전체 재렌더. 선택/이동/크기변경/삭제/수정 지원.
 * - 도구(tool)·색(color)·전체지우기(clearNonce)는 부모(좌측 툴바)가 props로 내려준다.
 *   tool: 'select' | 'pen' | 'highlighter' | 'line' | 'rect' | 'ellipse' | 'text'
 * - 선굵기·투명도(슬라이더)·텍스트 옵션(글꼴·크기·굵기)은 상단 옵션바에서 임의 조절. 새 도형 + 선택 도형에 적용.
 * - 형광펜: 반투명 multiply 합성으로 형광 효과.
 * - 로컬 전용(실시간 공유는 후속).
 */
import { useEffect, useRef, useState, useCallback } from 'react'

const TEXT_SIZE = 20
const HIT_PAD = 6
const HANDLE = 10

// 점-선분 거리 (지우개 히트 판정용)
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

const FONTS = [
  { label: '기본', value: 'sans-serif' },
  { label: '명조', value: 'serif' },
  { label: '고정폭', value: 'monospace' },
  { label: '손글씨', value: "'Jua', sans-serif" },
]
const FONT_SIZES = [14, 20, 28, 40, 56]

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
  const [editing, setEditing] = useState(null) // {x,y,value,id?}
  const [eraserCursor, setEraserCursor] = useState(null) // 지우개 원형 미리보기 위치

  const [strokeWidth, setStrokeWidth] = useState(3)
  const [opacity, setOpacity] = useState(1)
  const [fontFamily, setFontFamily] = useState('sans-serif')
  const [fontSize, setFontSize] = useState(TEXT_SIZE)
  const [bold, setBold] = useState(false)

  const drag = useRef(null)

  // 지우개 반경 = 굵기 슬라이더 값(최소 6). 미리보기 원과 실제 지움 범위가 일치.
  const eraseRadius = Math.max(6, strokeWidth)

  const shapesRef = useRef(shapes), draftRef = useRef(draft), selRef = useRef(selectedId)
  const toolRef = useRef(tool), colorRef = useRef(color), widthRef = useRef(strokeWidth), opacityRef = useRef(opacity)
  const eraseRadiusRef = useRef(eraseRadius)
  useEffect(() => { eraseRadiusRef.current = eraseRadius }, [eraseRadius])
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { selRef.current = selectedId }, [selectedId])
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { widthRef.current = strokeWidth }, [strokeWidth])
  useEffect(() => { opacityRef.current = opacity }, [opacity])

  const fontStr = (s) => `${s.bold ? 'bold ' : ''}${s.fontSize || TEXT_SIZE}px ${s.fontFamily || 'sans-serif'}`

  const paintShape = (ctx, s) => {
    ctx.save()
    ctx.globalAlpha = s.opacity ?? 1
    if (s.highlight) ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = s.color
    ctx.fillStyle = s.color
    ctx.lineWidth = s.width || 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
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
      ctx.beginPath()
      ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (s.type === 'text') {
      ctx.font = fontStr(s); ctx.textBaseline = 'top'; ctx.fillText(s.text, s.x, s.y)
    }
    ctx.restore()
  }

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

  const corners = (b) => ({
    nw: { x: b.x, y: b.y }, ne: { x: b.x + b.w, y: b.y },
    sw: { x: b.x, y: b.y + b.h }, se: { x: b.x + b.w, y: b.y + b.h },
  })

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of shapesRef.current) paintShape(ctx, s)
    if (draftRef.current) paintShape(ctx, draftRef.current)
    const sel = shapesRef.current.find((s) => s.id === selRef.current)
    if (sel) {
      const b = bbox(sel)
      ctx.save()
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1; ctx.setLineDash([5, 4])
      ctx.strokeRect(b.x - HIT_PAD, b.y - HIT_PAD, b.w + HIT_PAD * 2, b.h + HIT_PAD * 2)
      ctx.setLineDash([]); ctx.fillStyle = '#fff'
      Object.values(corners(b)).forEach((c) => {
        ctx.fillRect(c.x - HANDLE / 2, c.y - HANDLE / 2, HANDLE, HANDLE)
        ctx.strokeRect(c.x - HANDLE / 2, c.y - HANDLE / 2, HANDLE, HANDLE)
      })
      ctx.restore()
    }
  }, [bbox])

  const fit = useCallback(() => {
    const canvas = canvasRef.current, parent = wrapRef.current
    if (!canvas || !parent) return
    const dpr = window.devicePixelRatio || 1
    const w = parent.clientWidth, h = parent.clientHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
    redraw()
  }, [redraw])

  useEffect(() => { fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit) }, [fit])
  useEffect(() => { redraw() }, [shapes, draft, selectedId, redraw])

  useEffect(() => {
    if (clearNonce === 0) return
    setShapes([]); setSelectedId(null); setEditing(null)
  }, [clearNonce])

  // 색 변경 → 선택 도형에 적용(수정)
  useEffect(() => {
    if (!selRef.current) return
    setShapes((prev) => prev.map((s) => (s.id === selRef.current ? { ...s, color } : s)))
  }, [color])

  // 텍스트 입력창 포커스(열릴 때 1회) — autoFocus 보조
  useEffect(() => {
    if (!editing) return
    const r = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(r)
  }, [editing?.id, editing?.x, editing?.y])

  // Delete/Backspace로 선택 삭제 (텍스트 편집 중 제외)
  useEffect(() => {
    const onKey = (e) => {
      if (editing) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selRef.current) {
        setShapes((prev) => prev.filter((s) => s.id !== selRef.current)); setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const hitTest = (p) => {
    const arr = shapesRef.current
    for (let i = arr.length - 1; i >= 0; i--) {
      const b = bbox(arr[i])
      if (p.x >= b.x - HIT_PAD && p.x <= b.x + b.w + HIT_PAD && p.y >= b.y - HIT_PAD && p.y <= b.y + b.h + HIT_PAD) return arr[i].id
    }
    return null
  }

  const handleAt = (p, s) => {
    const c = corners(bbox(s))
    for (const [k, pt] of Object.entries(c)) {
      if (Math.abs(p.x - pt.x) <= HANDLE && Math.abs(p.y - pt.y) <= HANDLE) return { anchor: c[{ nw: 'se', ne: 'sw', sw: 'ne', se: 'nw' }[k]] }
    }
    return null
  }

  const mapShape = (s, ob, nb) => {
    const sx = ob.w ? nb.w / ob.w : 1, sy = ob.h ? nb.h / ob.h : 1
    const mp = (x, y) => ({ x: nb.x + (x - ob.x) * sx, y: nb.y + (y - ob.y) * sy })
    if (s.type === 'pen') return { ...s, points: s.points.map((p) => mp(p.x, p.y)) }
    if (s.type === 'line') { const a = mp(s.x1, s.y1), b = mp(s.x2, s.y2); return { ...s, x1: a.x, y1: a.y, x2: b.x, y2: b.y } }
    if (s.type === 'text') { const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, fontSize: Math.max(6, (s.fontSize || TEXT_SIZE) * sy) } }
    const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, w: s.w * sx, h: s.h * sy }
  }

  // 지우개: 점 p 부근에 닿는 도형인가
  const isErased = (s, p, r) => {
    if (s.type === 'pen') {
      const pts = s.points
      if (pts.length === 1) return Math.hypot(p.x - pts[0].x, p.y - pts[0].y) <= r + (s.width || 0) / 2
      for (let i = 1; i < pts.length; i++) {
        if (segDist(p.x, p.y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= r + (s.width || 0) / 2) return true
      }
      return false
    }
    if (s.type === 'line') return segDist(p.x, p.y, s.x1, s.y1, s.x2, s.y2) <= r + (s.width || 0) / 2
    const b = bbox(s) // rect/ellipse/text: 영역 근처면 지움
    return p.x >= b.x - r && p.x <= b.x + b.w + r && p.y >= b.y - r && p.y <= b.y + b.h + r
  }

  const eraseAt = (p) => {
    setShapes((prev) => prev.filter((s) => !isErased(s, p, eraseRadiusRef.current)))
  }

  const translate = (s, dx, dy) => {
    if (s.type === 'pen') return { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
    if (s.type === 'line') return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }
    return { ...s, x: s.x + dx, y: s.y + dy }
  }

  function handleDown(e) {
    const p = getPos(e); const t = toolRef.current

    if (t === 'text') { setSelectedId(null); setEditing({ x: p.x, y: p.y, value: '' }); return }

    canvasRef.current.setPointerCapture(e.pointerId)

    if (t === 'eraser') { setSelectedId(null); drag.current = { mode: 'erase' }; eraseAt(p); return }

    if (t === 'select') {
      const cur = shapesRef.current.find((s) => s.id === selRef.current)
      if (cur) { const h = handleAt(p, cur); if (h) { drag.current = { mode: 'resize', anchor: h.anchor, origShape: cur, origBox: bbox(cur) }; return } }
      const id = hitTest(p)
      setSelectedId(id)
      if (id) drag.current = { mode: 'move', last: p }
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
    if (toolRef.current === 'eraser') setEraserCursor(p) // 호버 시에도 원형 미리보기 따라다님
    if (!drag.current) return
    if (drag.current.mode === 'move') {
      const dx = p.x - drag.current.last.x, dy = p.y - drag.current.last.y
      drag.current.last = p
      const id = selRef.current
      setShapes((prev) => prev.map((s) => (s.id === id ? translate(s, dx, dy) : s)))
    } else if (drag.current.mode === 'resize') {
      const a = drag.current.anchor
      const nb = { x: Math.min(a.x, p.x), y: Math.min(a.y, p.y), w: Math.abs(p.x - a.x), h: Math.abs(p.y - a.y) }
      const t = mapShape(drag.current.origShape, drag.current.origBox, nb)
      setShapes((prev) => prev.map((s) => (s.id === t.id ? t : s)))
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
      if (d.type === 'rect' || d.type === 'ellipse') {
        if (d.w < 0) d = { ...d, x: d.x + d.w, w: -d.w }
        if (d.h < 0) d = { ...d, y: d.y + d.h, h: -d.h }
      }
      if (!tinyBox && !tinyLine) setShapes((prev) => [...prev, d])
      setDraft(null)
    }
    drag.current = null
  }

  const commitText = () => {
    if (!editing) return
    const text = editing.value.trim()
    setShapes((prev) => {
      if (editing.id) {
        if (!text) return prev.filter((s) => s.id !== editing.id)
        return prev.map((s) => (s.id === editing.id ? { ...s, text } : s))
      }
      if (!text) return prev
      return [...prev, { id: nextId(), type: 'text', color: colorRef.current, opacity: opacityRef.current, x: editing.x, y: editing.y, text, fontFamily, fontSize, bold }]
    })
    setEditing(null)
  }

  function handleDoubleClick(e) {
    if (toolRef.current !== 'select') return
    const p = getPos(e)
    const id = hitTest(p)
    const s = shapesRef.current.find((x) => x.id === id)
    if (s && s.type === 'text') { setSelectedId(id); setEditing({ x: s.x, y: s.y, value: s.text, id: s.id }) }
  }

  const applyToSelected = (patch) => {
    if (selRef.current) setShapes((prev) => prev.map((s) => (s.id === selRef.current ? { ...s, ...patch } : s)))
  }
  const onWidth = (w) => { setStrokeWidth(w); applyToSelected({ width: w }) }
  const onOpacity = (o) => { setOpacity(o); applyToSelected({ opacity: o }) }

  const cursor = tool === 'select' ? 'default' : tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair'
  const showTextOpts = tool === 'text'

  return (
    <div ref={wrapRef} style={{ height: '100%', background: '#fff', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

      {/* 옵션바: 선굵기·투명도 슬라이더 + (텍스트일 때) 글꼴/크기/굵기 */}
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
        style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={() => { handleUp(); setEraserCursor(null) }}
        onDoubleClick={handleDoubleClick}
      />

      {/* 지우개 원형 미리보기 (그림판/포토샵처럼) */}
      {tool === 'eraser' && eraserCursor && (
        <div
          style={{
            position: 'absolute', zIndex: 5, pointerEvents: 'none',
            left: eraserCursor.x - eraseRadius, top: eraserCursor.y - eraseRadius,
            width: eraseRadius * 2, height: eraseRadius * 2, borderRadius: '50%',
            border: '1.5px solid #6b7280', background: 'rgba(148,163,184,0.18)',
          }}
        />
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
          style={{
            position: 'absolute', left: editing.x, top: editing.y, zIndex: 7,
            font: `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`, color,
            border: '1px dashed #2563eb', background: 'rgba(255,255,255,0.95)',
            padding: '0 2px', outline: 'none', minWidth: 140,
          }}
        />
      )}
    </div>
  )
}
