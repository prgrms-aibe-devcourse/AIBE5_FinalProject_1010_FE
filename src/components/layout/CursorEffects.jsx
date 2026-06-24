/**
 * @file CursorEffects.jsx
 * @description 커스텀 마우스 커서 효과를 담당합니다.
 * - 작은 점(cursor-dot)은 즉시 마우스를 따라갑니다.
 * - 큰 빛 번짐(cursor-glow)은 requestAnimationFrame으로 부드럽게 따라갑니다.
 * - 버튼/카드 위에 올라가면 hover 클래스를 붙여 커서 크기를 바꿉니다.
 */
import { useEffect, useRef } from 'react'

/**
 * 마우스 커서 따라다니는 도트 + 글로우.
 * - .cursor-dot: 즉시 따라옴
 * - .cursor-glow: 부드러운 lerp로 따라옴
 * - hover 가능한 요소(a, button, .card 등) 위에서는 도트 확대
 */
export default function CursorEffects() {
  // dotRef: 실제 마우스 위치에 바로 붙는 작은 점입니다.
  // glowRef: 약간 늦게 따라오는 큰 배경 광원입니다.
  const dotRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    // 마우스 좌표와 glow 좌표를 분리합니다.
    // glow는 보간해서 따라오기 때문에 부드러운 꼬리 효과가 생깁니다.
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let glowX = mouseX, glowY = mouseY
    let raf

    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = mouseX + 'px'
        dotRef.current.style.top = mouseY + 'px'
      }
    }

    const loop = () => {
      // lerp 보간: 현재 glow 위치에서 마우스 위치 방향으로 12%씩만 이동합니다.
      // 값이 크면 더 빠르게, 작으면 더 묵직하게 따라옵니다.
      glowX += (mouseX - glowX) * 0.12
      glowY += (mouseY - glowY) * 0.12
      if (glowRef.current) {
        glowRef.current.style.left = glowX + 'px'
        glowRef.current.style.top = glowY + 'px'
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    window.addEventListener('mousemove', onMove)

    // Hover 상태 - 동적으로 추가되는 요소까지 잡기 위해 delegation 사용
    const hoverable = 'a, button, .card, .cat, .live-card, .teacher-card, .feature-card, .sticker, .form-input, .qna-card'
    const onOver = (e) => {
      if (e.target.closest && e.target.closest(hoverable)) {
        dotRef.current?.classList.add('hover')
      }
    }
    const onOut = (e) => {
      if (e.target.closest && e.target.closest(hoverable)) {
        dotRef.current?.classList.remove('hover')
      }
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [])

  return (
    <>
      <div className="cursor-glow" ref={glowRef} />
      <div className="cursor-dot" ref={dotRef} />
    </>
  )
}
