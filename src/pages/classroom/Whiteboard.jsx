/**
 * @file Whiteboard.jsx
 * @description 강의실 중앙 공유 화이트보드 화면입니다.
 * - 툴바의 펜/직선/도형/텍스트/지우개 선택 상태를 관리합니다.
 * - 색상 팔레트를 클릭하면 선택 색상이 active로 표시됩니다.
 * - 실제 드로잉 엔진은 아직 없고, 수업 판서 SVG로 데모 화면을 구성합니다.
 */
import { useState } from 'react'

/**
 * 중앙 화이트보드 영역.
 * - 상단 툴바: 펜/직선/도형/텍스트/지우개 + 색상 팔레트 + 이미지/실행취소
 * - 메인 캔버스: 미적분 풀이 SVG (선생님 판서 시뮬)
 * - 우하단: 확대/축소/리셋
 */
export default function Whiteboard() {
  // 현재 선택된 화이트보드 도구입니다. 실제 드로잉 엔진을 붙이면 이 값으로 그리기 모드를 분기합니다.
  const [tool, setTool] = useState('pen')

  // 현재 선택된 펜 색상입니다. 지금은 active 표시만 하며, 추후 stroke 색상으로 연결할 수 있습니다.
  const [color, setColor] = useState('#1F2937')

  // 툴바 버튼 정의입니다. 버튼을 추가하려면 이 배열에 key/label/icon을 추가하면 됩니다.
  const tools = [
    { key: 'pen',    label: '펜',     icon: <PenIcon /> },
    { key: 'line',   label: '직선',   icon: <LineIcon /> },
    { key: 'shape',  label: '도형',   icon: <ShapeIcon /> },
    { key: 'text',   label: '텍스트', icon: <TextIcon /> },
    { key: 'eraser', label: '지우개', icon: <EraserIcon /> },
  ]
  const colors = ['#1F2937', '#FB7185', '#FBBF24', '#10B981', '#7DD3FC', '#7C3AED', '#EC4899']

  return (
    <section className="whiteboard-area">
      <div className="wb-toolbar">
        <div className="tool-group">
          {tools.map((t) => (
            <button key={t.key}
              className={`tool-btn ${tool === t.key ? 'active' : ''}`}
              onClick={() => setTool(t.key)} title={t.label}>
              {t.icon}
            </button>
          ))}
        </div>

        <div className="color-palette">
          {colors.map((c) => (
            <div key={c}
              className={`color ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)} />
          ))}
        </div>

        <div className="tool-group">
          <button className="tool-btn" title="이미지"><ImageIcon /></button>
          <button className="tool-btn" title="실행취소"><UndoIcon /></button>
          <button className="tool-btn" title="다시실행"><RedoIcon /></button>
        </div>

        <div className="wb-spacer"></div>

        <div className="wb-meta">
          <span className="badge-sm">✏️ 선생님 그리는 중</span>
          <button className="tool-btn" title="권한">👥</button>
          <button className="tool-btn" title="저장"><SaveIcon /></button>
        </div>
      </div>

      <div className="wb-canvas-wrap">
        <div className="wb-canvas"><WhiteboardSVG /></div>
        <Pointers />
        <ZoomControls />
      </div>
    </section>
  )
}

/**
 * 화이트보드 위 사용자 커서 표시입니다.
 * 협업 화이트보드 구현 시 WebSocket으로 받은 다른 사용자의 좌표를 이 형태로 렌더링하면 됩니다.
 */
function Pointers() {
  return (
    <>
      <div className="wb-pointer p1">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#FB7185" stroke="#1F2937" strokeWidth="1.5"><path d="M3 3l7 17 3-8 8-3z" /></svg>
        <div className="label" style={{ background: 'var(--peach-bg)' }}>박선생님</div>
      </div>
      <div className="wb-pointer p2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#0EA5A4" stroke="#1F2937" strokeWidth="1.5"><path d="M3 3l7 17 3-8 8-3z" /></svg>
        <div className="label" style={{ background: 'var(--mint-bg)' }}>김민지</div>
      </div>
    </>
  )
}

/**
 * 우하단 줌 컨트롤 UI입니다. 현재는 버튼 모양만 있으며 실제 scale 상태는 추후 연결 대상입니다.
 */
function ZoomControls() {
  return (
    <div className="wb-zoom-controls">
      <button title="확대">+</button>
      <button title="축소">−</button>
      <button title="리셋">⊙</button>
    </div>
  )
}

/**
 * 데모용 판서 SVG입니다.
 * 실제 구현에서는 canvas, SVG editor, Excalidraw 계열 라이브러리 등으로 교체할 수 있습니다.
 */
function WhiteboardSVG() {
  return (
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
      <text x="40" y="50" fontSize="24" fontWeight="900" fill="#1F2937">📌 문제 5번. 미적분 II 응용</text>
      <text x="40" y="100" fontSize="18" fontWeight="700" fill="#1F2937">f(x) = x³ - 3x² + 2 의 극값을 구하시오.</text>

      <text x="40" y="160" fontFamily="Caveat, cursive" fontSize="22" fontWeight="700" fill="#0F766E">① f'(x) 구하기</text>
      <text x="60" y="195" fontSize="20" fontFamily="serif" fill="#1F2937">f'(x) = 3x² - 6x = 3x(x - 2)</text>

      <text x="40" y="245" fontFamily="Caveat, cursive" fontSize="22" fontWeight="700" fill="#0F766E">② f'(x) = 0 인 x 값</text>
      <text x="60" y="275" fontSize="20" fontFamily="serif" fill="#1F2937">x = 0, x = 2</text>

      <g transform="translate(450, 130)">
        <line x1="0" y1="120" x2="280" y2="120" stroke="#1F2937" strokeWidth="2" />
        <line x1="140" y1="20" x2="140" y2="220" stroke="#1F2937" strokeWidth="2" />
        <polygon points="280,120 270,115 270,125" fill="#1F2937" />
        <polygon points="140,20 135,30 145,30" fill="#1F2937" />
        <text x="270" y="140" fontSize="14" fill="#4B5563">x</text>
        <text x="148" y="30" fontSize="14" fill="#4B5563">y</text>
        <path d="M 60 30 Q 100 60 130 110 Q 160 180 190 180 Q 220 175 260 200" fill="none" stroke="#FB7185" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="130" cy="105" r="6" fill="#FBBF24" stroke="#1F2937" strokeWidth="2" />
        <text x="100" y="100" fontFamily="Caveat, cursive" fontSize="18" fontWeight="700" fill="#0F766E">최댓값</text>
        <circle cx="190" cy="180" r="6" fill="#7DD3FC" stroke="#1F2937" strokeWidth="2" />
        <text x="195" y="202" fontFamily="Caveat, cursive" fontSize="18" fontWeight="700" fill="#0E7490">최솟값</text>
      </g>

      <text x="40" y="335" fontFamily="Caveat, cursive" fontSize="22" fontWeight="700" fill="#0F766E">③ 극값 정리</text>
      <text x="60" y="365" fontSize="18" fontFamily="serif" fill="#1F2937">극댓값: f(0) = </text>
      <text x="195" y="365" fontSize="20" fontWeight="800" fontFamily="serif" fill="#E11D48">2</text>
      <text x="60" y="395" fontSize="18" fontFamily="serif" fill="#1F2937">극솟값: f(2) = </text>
      <text x="195" y="395" fontSize="20" fontWeight="800" fontFamily="serif" fill="#E11D48">-2</text>

      <rect x="45" y="343" width="180" height="30" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="4 3" rx="4" />
      <rect x="45" y="375" width="180" height="30" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="4 3" rx="4" />

      <path d="M 320 380 Q 360 360, 400 380 T 440 380" fill="none" stroke="#FB7185" strokeWidth="3" strokeLinecap="round" />
      <text x="320" y="445" fontFamily="Caveat, cursive" fontSize="20" fontWeight="700" fill="#E11D48">✏️ 학생 풀이중...</text>
    </svg>
  )
}

// SVG icons (compact)
// 툴바에서만 쓰는 작은 아이콘들이라 별도 파일로 분리하지 않고 하단에 모아두었습니다.
const PenIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
const LineIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/></svg>
const ShapeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
const TextIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
const EraserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H9L4 15a1 1 0 0 1 0-1.4l9-9a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4z"/></svg>
const ImageIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
const UndoIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>
const RedoIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>
const SaveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
