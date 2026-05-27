/**
 * @file BgShapes.jsx
 * @description 전역 배경에 떠다니는 파스텔 블롭 장식입니다.
 * - 페이지 내용과 별개로 화면 뒤쪽에 깔리는 분위기용 컴포넌트입니다.
 * - data-speed 값으로 각 블롭의 마우스 반응 속도를 조절합니다.
 */
import { useEffect, useRef } from 'react'

/**
 * 배경에 떠다니는 부드러운 블롭 4개.
 * 마우스 위치에 따라 미세하게 패럴랙스 이동.
 */
export default function BgShapes() {
  // 블롭들이 들어 있는 DOM을 직접 참조합니다.
  // 여기서는 React state가 아니라 style.transform을 직접 바꿔 잦은 리렌더링을 피합니다.
  const containerRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      const blobs = containerRef.current?.querySelectorAll('.blob')
      if (!blobs) return
      // 화면 중심을 0으로 보고, 마우스가 좌/우/상/하 어디에 있는지 -1~1 범위로 정규화합니다.
      const cx = (e.clientX / window.innerWidth - 0.5) * 2
      const cy = (e.clientY / window.innerHeight - 0.5) * 2
      blobs.forEach((b) => {
        // data-speed가 클수록 더 많이 움직입니다.
        // JSX의 <div className="blob b1" data-speed="0.04" /> 값과 연결됩니다.
        const speed = parseFloat(b.dataset.speed || 0.04)
        b.style.transform = `translate(${cx * 60 * speed * 10}px, ${cy * 60 * speed * 10}px)`
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="bg-shapes" ref={containerRef}>
      <div className="blob b1" data-speed="0.04" />
      <div className="blob b2" data-speed="0.06" />
      <div className="blob b3" data-speed="0.03" />
      <div className="blob b4" data-speed="0.05" />
    </div>
  )
}
