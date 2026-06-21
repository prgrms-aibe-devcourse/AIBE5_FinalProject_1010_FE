/**
 * @file room/useSidebarScroll.js
 * @description 좌측 도구 바가 화면보다 길 때(노트북 등) 위/아래 화살표로 스크롤. 오버플로 감지해 화살표 표시.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export function useSidebarScroll() {
  const scrollRef = useRef(null)
  const [arrows, setArrows] = useState({ up: false, down: false })

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setArrows({ up: el.scrollTop > 4, down: el.scrollTop + el.clientHeight < el.scrollHeight - 4 })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => { ro.disconnect(); window.removeEventListener('resize', update) }
  }, [update])

  const scrollBy = (dy) => scrollRef.current?.scrollBy({ top: dy, behavior: 'smooth' })

  return { scrollRef, arrows, update, scrollBy }
}
