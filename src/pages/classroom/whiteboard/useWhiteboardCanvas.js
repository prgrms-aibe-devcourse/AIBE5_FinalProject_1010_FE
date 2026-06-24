/**
 * @file whiteboard/useWhiteboardCanvas.js
 * @description 화이트보드 <canvas> 렌더링 + 크기 맞춤(fit) + 다시그리기(redraw) effect.
 *
 * - redraw: 현재 페이지의 모든 도형 → 그리는 중 draft → 원격 라이브 미리보기(+이름 라벨)
 *   → 선택 표시(점선 박스·회전 핸들·크기 핸들) 순으로 한 번에 다시 그린다.
 * - fit: 부모 크기 + DPR에 맞춰 캔버스 픽셀 크기를 설정하고 다시 그린다.
 * - 화면 좌표계는 viewRef(scale/translate)를 기준으로 setTransform 한다(보드 좌표 ↔ 화면 좌표).
 *
 * 상태는 모두 ref로 받아 redraw를 의존성 없는 안정 함수([])로 유지한다. 값 변경 시
 * 마지막 effect가 redraw를 다시 호출한다.
 */
import { useCallback, useEffect } from 'react'
import { HIT_PAD, HANDLE, ROT_OFFSET } from './constants.js'
import { bbox, corners, edges } from './geometry.js'
import { paintShape } from './painting.js'
import { liveAnchor, paintNameLabel } from './remoteLabels.js'

export function useWhiteboardCanvas({
  canvasRef,
  ctxRef,
  wrapRef,
  viewRef,
  shapesRef,
  draftRef,
  curveHoverRef,
  selRef,
  remoteLiveRef,
  drawerNamesRef,
  activePageIdRef,
  view,
  shapes,
  draft,
  selectedIds,
  marquee,
  curveHover,
}) {
  const redraw = useCallback(() => {
    const canvas = canvasRef.current, c = ctxRef.current
    if (!canvas || !c) return
    const dpr = window.devicePixelRatio || 1
    const { scale, x, y } = viewRef.current
    c.save()
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, canvas.width, canvas.height)
    c.restore()
    c.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * x, dpr * y)
    for (const s of shapesRef.current) paintShape(c, s)
    if (draftRef.current) { let d = draftRef.current; if (d.type === 'curve' && curveHoverRef.current) d = { ...d, points: [...d.points, curveHoverRef.current] }; paintShape(c, d) }
    // 원격 참가자가 그리는 중인 도형(라이브 미리보기) — 현재 페이지 것만. 그 위에 작성자 이름 라벨(이슈 #100).
    const curPageId = activePageIdRef.current
    Object.entries(remoteLiveRef.current).forEach(([senderId, lv]) => {
      if (!lv || !lv.shape || lv.pageId !== curPageId) return
      paintShape(c, lv.shape)
      const name = drawerNamesRef.current[String(senderId)]
      if (name) {
        const a = liveAnchor(lv.shape)        // 현재 펜 끝에 라벨을 붙여 포인터를 따라가게
        paintNameLabel(c, name, a.x + 8, a.y) // 펜 끝 살짝 우측 위
      }
    })
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
        // 변(edge) 중점 핸들 — 한 축만 크기변경
        Object.values(edges(b)).forEach((ec) => { c.fillRect(ec.x - HANDLE / 2, ec.y - HANDLE / 2, HANDLE, HANDLE); c.strokeRect(ec.x - HANDLE / 2, ec.y - HANDLE / 2, HANDLE, HANDLE) })
      }
      c.restore()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fit = useCallback(() => {
    const canvas = canvasRef.current, parent = wrapRef.current
    if (!canvas || !parent) return
    const dpr = window.devicePixelRatio || 1, w = parent.clientWidth, h = parent.clientHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); ctxRef.current = c; redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redraw])

  useEffect(() => { fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit) }, [fit])
  useEffect(() => { viewRef.current = view; redraw() }, [view, redraw, viewRef])
  useEffect(() => { redraw() }, [shapes, draft, selectedIds, marquee, curveHover, redraw])

  return { redraw, fit }
}
