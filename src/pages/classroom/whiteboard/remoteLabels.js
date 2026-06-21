import { bbox } from './geometry.js'

/**
 * 그리는 중 도형의 "현재 펜 끝(가장 최근 지점)" 좌표.
 * 원격 작성자 이름 라벨을 포인터 근처에 붙이기 위해 사용한다.
 */
export function liveAnchor(s) {
  if (s?.points?.length) { const p = s.points[s.points.length - 1]; return { x: p.x, y: p.y } }
  if (s?.type === 'line') return { x: s.x2, y: s.y2 }
  if (s?.type === 'text') return { x: s.x, y: s.y }
  if (s && s.w != null && s.h != null) return { x: s.x + s.w, y: s.y + s.h }
  const b = bbox(s, null)
  return { x: b.x, y: b.y }
}

export function paintNameLabel(c, name, x, y) {
  c.save()
  c.font = '700 12px sans-serif'
  const padX = 6, h = 18
  const w = c.measureText(name).width + padX * 2
  const lx = Math.max(2, x)
  let ly = y - h - 4
  if (ly < 2) ly = y + 4
  c.fillStyle = 'rgba(37,99,235,0.92)'
  if (c.roundRect) { c.beginPath(); c.roundRect(lx, ly, w, h, 5); c.fill() }
  else c.fillRect(lx, ly, w, h)
  c.fillStyle = '#fff'
  c.textBaseline = 'middle'
  c.textAlign = 'left'
  c.fillText(name, lx + padX, ly + h / 2 + 0.5)
  c.restore()
}
