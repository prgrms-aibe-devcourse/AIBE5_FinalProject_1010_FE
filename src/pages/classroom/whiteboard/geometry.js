/**
 * @file whiteboard/geometry.js
 * @description 도형 기하 연산·히트테스트(순수 함수). 텍스트 폭 측정이 필요한 함수는 ctx를 인자로 받는다.
 */
import { TEXT_SIZE, HIT_PAD, HANDLE, ROT_OFFSET, ROT_HIT, isPath } from './constants.js'

export const fontStr = (s) => `${s.bold ? 'bold ' : ''}${s.fontSize || TEXT_SIZE}px ${s.fontFamily || 'sans-serif'}`

export const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy); t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
export const rotatePt = (x, y, cx, cy, ang) => {
  const cos = Math.cos(ang), sin = Math.sin(ang), dx = x - cx, dy = y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}
export const aabbHit = (a, b) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)

/** 미회전 경계 박스. 텍스트는 ctx.measureText로 폭 계산 */
export const bbox = (s, ctx) => {
  if (isPath(s)) {
    const xs = s.points.map((p) => p.x), ys = s.points.map((p) => p.y)
    const x = Math.min(...xs), y = Math.min(...ys)
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
  }
  if (s.type === 'line') return { x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2), w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) }
  if (s.type === 'text') {
    const lines = String(s.text || '').split('\n')
    let w = 40
    if (ctx) { ctx.font = fontStr(s); w = Math.max(20, ...lines.map((l) => ctx.measureText(l).width)) }
    const lh = (s.fontSize || TEXT_SIZE) * 1.25
    return { x: s.x, y: s.y, w, h: Math.max(1, lines.length) * lh }
  }
  return { x: Math.min(s.x, s.x + s.w), y: Math.min(s.y, s.y + s.h), w: Math.abs(s.w), h: Math.abs(s.h) }
}

export const center = (s, ctx) => { const b = bbox(s, ctx); return { x: b.x + b.w / 2, y: b.y + b.h / 2 } }
export const toLocal = (p, s, ctx) => { const c = center(s, ctx); return rotatePt(p.x, p.y, c.x, c.y, -(s.rotation || 0)) }
export const corners = (b) => ({ nw: { x: b.x, y: b.y }, ne: { x: b.x + b.w, y: b.y }, sw: { x: b.x, y: b.y + b.h }, se: { x: b.x + b.w, y: b.y + b.h } })
/** 변 중점(상/하/좌/우) — 한 축 크기변경 핸들 위치 */
export const edges = (b) => ({ n: { x: b.x + b.w / 2, y: b.y }, s: { x: b.x + b.w / 2, y: b.y + b.h }, w: { x: b.x, y: b.y + b.h / 2 }, e: { x: b.x + b.w, y: b.y + b.h / 2 } })

/** 회전 반영 화면 좌표계 AABB (마퀴 교차판정용) */
export const screenAABB = (s, ctx) => {
  const b = bbox(s, ctx), c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }, rot = s.rotation || 0
  const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]].map(([x, y]) => rotatePt(x, y, c.x, c.y, rot))
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

/** 크기변경: 원본 박스(ob)→새 박스(nb)로 지오메트리 매핑 */
export const mapShape = (s, ob, nb) => {
  const sx = ob.w ? nb.w / ob.w : 1, sy = ob.h ? nb.h / ob.h : 1
  const mp = (x, y) => ({ x: nb.x + (x - ob.x) * sx, y: nb.y + (y - ob.y) * sy })
  if (isPath(s)) return { ...s, points: s.points.map((p) => mp(p.x, p.y)) }
  if (s.type === 'line') { const a = mp(s.x1, s.y1), b = mp(s.x2, s.y2); return { ...s, x1: a.x, y1: a.y, x2: b.x, y2: b.y } }
  if (s.type === 'text') { const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, fontSize: Math.max(6, (s.fontSize || TEXT_SIZE) * sy) } }
  const tl = mp(s.x, s.y); return { ...s, x: tl.x, y: tl.y, w: s.w * sx, h: s.h * sy }
}
export const translate = (s, dx, dy) => {
  if (isPath(s)) return { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
  if (s.type === 'line') return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }
  return { ...s, x: s.x + dx, y: s.y + dy }
}
export const cloneShape = (s, id) => { const c = { ...s, id }; if (isPath(s)) c.points = s.points.map((p) => ({ ...p })); return c }

/** 위에서부터 점 p에 맞는 도형 id (숨김 제외) */
export const hitTest = (shapes, p, ctx) => {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].hidden) continue
    const lp = toLocal(p, shapes[i], ctx); const b = bbox(shapes[i], ctx)
    if (lp.x >= b.x - HIT_PAD && lp.x <= b.x + b.w + HIT_PAD && lp.y >= b.y - HIT_PAD && lp.y <= b.y + b.h + HIT_PAD) return shapes[i].id
  }
  return null
}

/** 선택 도형 위 조작 지점(회전 핸들/크기 핸들) */
export const handleAt = (p, s, ctx) => {
  const lp = toLocal(p, s, ctx); const b = bbox(s, ctx)
  const rh = { x: b.x + b.w / 2, y: b.y - HIT_PAD - ROT_OFFSET }
  if (Math.hypot(lp.x - rh.x, lp.y - rh.y) <= ROT_HIT) return { kind: 'rotate' }
  const c = corners(b)
  for (const [k, pt] of Object.entries(c)) if (Math.abs(lp.x - pt.x) <= HANDLE && Math.abs(lp.y - pt.y) <= HANDLE) return { kind: 'resize', cornerKey: k, anchor: c[{ nw: 'se', ne: 'sw', sw: 'ne', se: 'nw' }[k]] }
  // 변(edge) 중점 핸들 — 한 축(가로 또는 세로)만 변경. 모서리보다 뒤에 검사(모서리 우선).
  const ed = edges(b)
  for (const [k, pt] of Object.entries(ed)) if (Math.abs(lp.x - pt.x) <= HANDLE && Math.abs(lp.y - pt.y) <= HANDLE) return { kind: 'resize', edgeKey: k }
  return null
}

/** 모서리/변 키 + 회전각 → CSS resize 커서 (edge는 방향벡터 n/s/e/w 포함) */
export const resizeCursor = (key, rotation) => {
  const v = { nw: [-1, -1], ne: [1, -1], se: [1, 1], sw: [-1, 1], n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[key]
  if (!v) return 'default'
  const deg = (Math.atan2(v[1], v[0]) + (rotation || 0)) * 180 / Math.PI, a = ((deg % 180) + 180) % 180
  if (a < 22.5 || a >= 157.5) return 'ew-resize'
  if (a < 67.5) return 'nwse-resize'
  if (a < 112.5) return 'ns-resize'
  return 'nesw-resize'
}

/** 지우개: 점 p 부근에 도형이 닿는가 */
export const isErased = (s, p, r, ctx) => {
  const lp = toLocal(p, s, ctx)
  if (isPath(s)) {
    const pts = s.points
    if (pts.length === 1) return Math.hypot(lp.x - pts[0].x, lp.y - pts[0].y) <= r + (s.width || 0) / 2
    for (let i = 1; i < pts.length; i++) if (segDist(lp.x, lp.y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= r + (s.width || 0) / 2) return true
    return false
  }
  if (s.type === 'line') return segDist(lp.x, lp.y, s.x1, s.y1, s.x2, s.y2) <= r + (s.width || 0) / 2
  const b = bbox(s, ctx)
  return lp.x >= b.x - r && lp.x <= b.x + b.w + r && lp.y >= b.y - r && lp.y <= b.y + b.h + r
}
