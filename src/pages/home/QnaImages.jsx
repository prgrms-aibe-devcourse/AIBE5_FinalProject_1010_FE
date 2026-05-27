/**
 * @file QnaImages.jsx
 * @description 질문 카드에 들어가는 손그림 스타일 SVG 문제 이미지 모음입니다.
 * - 수학, 물리, 화학 이미지가 함수 컴포넌트로 분리되어 있습니다.
 * - QuestionImage가 type 값에 따라 적절한 SVG를 선택합니다.
 */
/**
 * 질문 게시판 카드에 들어가는 손그림 SVG 모음.
 * imageType: 'math' | 'physics' | 'chemistry' | null
 */

export function MathImage() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#FFFDF9" />
      <g stroke="#FDE7E0" strokeWidth="0.5">
        <line x1="0" y1="50" x2="200" y2="50" />
        <line x1="0" y1="100" x2="200" y2="100" />
        <line x1="0" y1="150" x2="200" y2="150" />
        <line x1="50" y1="0" x2="50" y2="200" />
        <line x1="100" y1="0" x2="100" y2="200" />
        <line x1="150" y1="0" x2="150" y2="200" />
      </g>
      <text x="14" y="32" fontFamily="Caveat, cursive" fontSize="22" fontWeight="700" fill="#0F766E">f'(x) = 3x²-6x</text>
      <text x="14" y="58" fontFamily="Caveat, cursive" fontSize="18" fill="#1F2937">= 3x(x-2)</text>
      <text x="14" y="88" fontFamily="Caveat, cursive" fontSize="18" fill="#1F2937">x = 0, x = 2</text>
      <text x="14" y="120" fontFamily="Caveat, cursive" fontSize="20" fontWeight="700" fill="#FB7185">극댓값 = -2 ?</text>
      <path d="M 130 115 L 175 110" stroke="#FB7185" strokeWidth="2" fill="none" markerEnd="url(#qnaArrow1)" />
      <text x="140" y="135" fontFamily="Caveat, cursive" fontSize="16" fill="#FB7185">이거 맞아?</text>
      <defs>
        <marker id="qnaArrow1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#FB7185" />
        </marker>
      </defs>
      <g transform="translate(10, 150)">
        <line x1="0" y1="20" x2="100" y2="20" stroke="#9CA3AF" strokeWidth="1" />
        <line x1="50" y1="0" x2="50" y2="40" stroke="#9CA3AF" strokeWidth="1" />
        <path d="M 15 30 Q 35 5 50 18 Q 65 32 85 12" stroke="#0EA5A4" strokeWidth="2" fill="none" />
      </g>
    </svg>
  )
}

export function PhysicsImage() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#DBEEF8" />
      <line x1="0" y1="170" x2="200" y2="170" stroke="#1F2937" strokeWidth="2" />
      <polygon points="20,170 180,170 180,90" fill="#FDA4AF" stroke="#1F2937" strokeWidth="2" />
      <path d="M 60 170 A 40 40 0 0 0 38 152" stroke="#1F2937" strokeWidth="1.5" fill="none" />
      <text x="42" y="165" fontFamily="Caveat, cursive" fontSize="16" fill="#1F2937">30°</text>
      <g transform="translate(130, 110) rotate(-26.5)">
        <rect x="-18" y="-18" width="36" height="36" fill="#FBBF24" stroke="#1F2937" strokeWidth="2" />
        <text x="0" y="4" fontFamily="Caveat, cursive" fontSize="14" fontWeight="700" fill="#1F2937" textAnchor="middle">2kg</text>
      </g>
      <line x1="138" y1="118" x2="138" y2="170" stroke="#0F766E" strokeWidth="2.5" markerEnd="url(#qnaArrowG)" />
      <text x="142" y="148" fontFamily="Caveat, cursive" fontSize="14" fill="#0F766E">mg</text>
      <defs>
        <marker id="qnaArrowG" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#0F766E" />
        </marker>
      </defs>
      <text x="40" y="50" fontFamily="Caveat, cursive" fontSize="32" fontWeight="700" fill="#FB7185">a = ?</text>
    </svg>
  )
}

export function ChemistryImage() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#ECE7FB" />
      <circle cx="100" cy="80" r="28" fill="#FB7185" stroke="#1F2937" strokeWidth="2" />
      <text x="100" y="86" fontFamily="Caveat, cursive" fontSize="22" fontWeight="700" fill="#1F2937" textAnchor="middle">O</text>
      <line x1="100" y1="80" x2="55" y2="135" stroke="#1F2937" strokeWidth="2.5" />
      <line x1="100" y1="80" x2="145" y2="135" stroke="#1F2937" strokeWidth="2.5" />
      <circle cx="55" cy="135" r="18" fill="#7DD3FC" stroke="#1F2937" strokeWidth="2" />
      <text x="55" y="141" fontFamily="Caveat, cursive" fontSize="18" fontWeight="700" fill="#1F2937" textAnchor="middle">H</text>
      <circle cx="145" cy="135" r="18" fill="#7DD3FC" stroke="#1F2937" strokeWidth="2" />
      <text x="145" y="141" fontFamily="Caveat, cursive" fontSize="18" fontWeight="700" fill="#1F2937" textAnchor="middle">H</text>
      <path d="M 80 105 A 28 28 0 0 0 120 105" stroke="#0F766E" strokeWidth="2" fill="none" />
      <text x="100" y="125" fontFamily="Caveat, cursive" fontSize="18" fontWeight="700" fill="#0F766E" textAnchor="middle">104.5°</text>
      <circle cx="86" cy="55" r="2.5" fill="#1F2937" />
      <circle cx="92" cy="50" r="2.5" fill="#1F2937" />
      <circle cx="108" cy="50" r="2.5" fill="#1F2937" />
      <circle cx="114" cy="55" r="2.5" fill="#1F2937" />
      <text x="100" y="36" fontFamily="Caveat, cursive" fontSize="13" fill="#1F2937" textAnchor="middle">비공유 전자쌍</text>
    </svg>
  )
}

/**
 * imageType 문자열을 받아 알맞은 SVG 컴포넌트를 선택하는 라우터 역할입니다.
 * 새 과목 이미지를 추가하려면 위에 SVG 컴포넌트를 만들고 이 switch에 case를 추가하세요.
 */
export function QuestionImage({ type, label }) {
  if (!type) return null
  return (
    <div className="qna-image">
      <span className="img-tag">📷 {label}</span>
      {type === 'math' && <MathImage />}
      {type === 'physics' && <PhysicsImage />}
      {type === 'chemistry' && <ChemistryImage />}
    </div>
  )
}
