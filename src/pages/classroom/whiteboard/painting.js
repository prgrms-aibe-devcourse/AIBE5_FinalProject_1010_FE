/**
 * @file whiteboard/painting.js
 * @description 캔버스 도형 렌더링. 도형 종류별 그리기를 한 곳에 모은다.
 */
import { TEXT_SIZE } from './constants.js'
import { center, fontStr } from './geometry.js'

/** pen(직선 연결) / curve(미드포인트 2차 베지어 스무딩) 경로 그리기 */
export const paintPath = (ctx, pts, smooth) => {
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

/** 도형 1개 렌더(회전·투명도·형광 합성 포함). 숨김 도형은 건너뜀. */
export const paintShape = (ctx, s) => {
  if (s.hidden) return
  ctx.save()
  const rot = s.rotation || 0
  if (rot) { const c = center(s, ctx); ctx.translate(c.x, c.y); ctx.rotate(rot); ctx.translate(-c.x, -c.y) }
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
  else if (s.type === 'text') {
    ctx.font = fontStr(s); ctx.textBaseline = 'top'
    const lh = (s.fontSize || TEXT_SIZE) * 1.25
    String(s.text).split('\n').forEach((ln, i) => ctx.fillText(ln, s.x, s.y + i * lh))
  }
  ctx.restore()
}
