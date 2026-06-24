/**
 * @file room/useDraggablePanel.js
 * @description 헤들을 잡고 끌어 패널을 자유 이동(부모 영역 안으로 제한). 화상 패널 위치 이동 등에 사용.
 * - pos가 null이면 기본 위치(CSS) 사용, 드래그하면 {left,top} 좌표로 고정.
 */
import { useEffect, useRef, useState } from 'react'

export function useDraggablePanel() {
  const panelRef = useRef(null)
  const [pos, setPos] = useState(null)
  const listenersRef = useRef(null) // 드래그 중 window 리스너({move,up}) — 언마운트 시 정리

  const onDragStart = (e) => {
    const el = panelRef.current
    if (!el) return
    e.preventDefault()
    const parent = el.offsetParent // 위치 기준 조상(예: board-shield)
    const start = { x: e.clientX, y: e.clientY, left: el.offsetLeft, top: el.offsetTop }
    const move = (ev) => {
      let left = start.left + (ev.clientX - start.x)
      let top = start.top + (ev.clientY - start.y)
      if (parent) {
        left = Math.max(0, Math.min(left, parent.clientWidth - el.offsetWidth))
        top = Math.max(0, Math.min(top, parent.clientHeight - el.offsetHeight))
      }
      setPos({ left, top })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      listenersRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    listenersRef.current = { move, up }
  }

  // 드래그 도중 언마운트(자동종료 등) 시 window 리스너가 남지 않게 정리
  useEffect(() => () => {
    const d = listenersRef.current
    if (d) { window.removeEventListener('pointermove', d.move); window.removeEventListener('pointerup', d.up) }
  }, [])

  return { panelRef, pos, onDragStart }
}
