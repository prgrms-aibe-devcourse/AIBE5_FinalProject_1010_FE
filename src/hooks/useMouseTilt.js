/**
 * @file useMouseTilt.js
 * @description 카드에 3D 마우스 틸트 효과를 붙이는 커스텀 훅입니다.
 * - ref로 받은 DOM 요소에 mousemove/mouseleave 이벤트를 직접 연결합니다.
 * - strength 값을 키우면 카드가 더 크게 기울어집니다.
 * - 언마운트 시 이벤트를 제거하여 메모리 누수를 막습니다.
 */
import { useEffect } from 'react'

/**
 * 카드 요소에 마우스 움직임 기반 3D tilt 효과를 부여하는 훅.
 * 사용:
 *   const ref = useRef(null)
 *   useMouseTilt(ref, { strength: 8 })
 *   <div ref={ref} className="card">…</div>
 */
export default function useMouseTilt(ref, { strength = 8 } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e) => {
      // 요소의 화면상 위치와 크기를 가져와 마우스가 카드 안에서 어느 지점에 있는지 계산합니다.
      const r = el.getBoundingClientRect()
      // x/y는 카드 중심 기준 -0.5~0.5 범위입니다.
      // 중심에서 멀어질수록 회전 각도가 커집니다.
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(800px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translate(-3px, -3px)`
    }
    const onLeave = () => {
      // 마우스가 카드 밖으로 나가면 transform을 지워 원래 위치로 복귀시킵니다.
      el.style.transform = ''
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [ref, strength])
}
