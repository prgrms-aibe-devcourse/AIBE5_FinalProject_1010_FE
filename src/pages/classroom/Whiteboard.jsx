/**
 * @file Whiteboard.jsx
 * @description 강의실 중앙 고해상도 화이트보드 컴포넌트
 * - 순백색의 깨끗한 캔버스 위에 수학적 필기와 도식을 위한 미세 그리드를 제공합니다.
 */
export default function Whiteboard() {
  return (
    <div style={{ height: '100%', background: '#fff', position: 'relative' }}>
      {/* 정밀한 필기를 돕는 미세 도트 그리드 배경 */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      {/* SVG 기반의 벡터 판서 데모 영역 */}
      <svg viewBox="0 0 1000 800" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <text x="50" y="80" fontSize="32" fontWeight="900" fill="#451a03">수학 실전 풀이: 미분법의 응용</text>
        <path d="M 50 100 L 400 100" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
        
        <g transform="translate(100, 300)">
          {/* 함수 그래프 곡선 시뮬레이션 */}
          <path d="M 0 100 Q 150 -100 300 100 T 600 100" fill="none" stroke="#451a03" strokeWidth="3" />
          {/* 극대값 포인트 강조 */}
          <circle cx="150" cy="0" r="6" fill="#ef4444" />
          <text x="165" y="-10" fontSize="16" fontWeight="800" fill="#ef4444">극대값 지점</text>
        </g>
        
        <text x="50" y="550" fontSize="18" fill="#92400e" fontStyle="italic">Q. 함수 f(x)의 증감을 조사하고 극값을 구하시오.</text>
      </svg>
    </div>
  )
}
