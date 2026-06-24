/**
 * @file HeroIllustration.jsx
 * @description 메인 Hero 영역 오른쪽에 보이는 SVG 일러스트 컴포넌트입니다.
 * - 선생님, 학생, 화이트보드, 장식 스티커를 SVG로 직접 그립니다.
 * - 마우스 이동에 따라 SVG, 배경 원, 눈동자, 스티커가 반응합니다.
 * - 색상/도형 수정은 JSX 내부 SVG 태그에서, 움직임 수정은 useEffect 내부에서 합니다.
 */
import { useEffect, useRef, useState } from 'react'
import ClassroomLauncher from '../../pages/home/ClassroomLauncher.jsx'
import { fetchLiveClassrooms } from '../../api/classroomApi.js'

/**
 * Hero 일러스트 (선생님 + 학생 + 화이트보드).
 * 마우스 움직임에 따라:
 *  - SVG 자체가 살짝 기울고
 *  - 배경 원이 반대로 움직이고
 *  - 양옆 stickers 가 깊이별로 움직이고
 *  - 두 캐릭터의 눈동자(.pupil)가 마우스를 따라감
 */
export default function HeroIllustration() {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const bgRef = useRef(null)
  const [totalViewers, setTotalViewers] = useState(0)

  useEffect(() => {
    let active = true
    fetchLiveClassrooms()
      .then((list) => {
        if (active && Array.isArray(list)) {
          const total = list.reduce((sum, c) => sum + c.participantCount, 0)
          setTotalViewers(total > 0 ? total : 0)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    const svg = svgRef.current
    const bg = bgRef.current
    if (!wrap || !svg) return

    const stickers = wrap.querySelectorAll('.sticker')
    const pupils = svg.querySelectorAll('.pupil')
    const orig = Array.from(pupils).map(p => ({
      cx: parseFloat(p.getAttribute('cx')),
      cy: parseFloat(p.getAttribute('cy')),
    }))

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect()
      const cx = (e.clientX - r.left - r.width / 2) / r.width
      const cy = (e.clientY - r.top - r.height / 2) / r.height

      svg.style.transform = `translate(${cx * 14}px, ${cy * 14}px) rotate(${cx * 1.5}deg)`
      if (bg) bg.style.transform = `translate(${cx * -10}px, ${cy * -10}px) scale(${1 + Math.abs(cx) * 0.02})`

      stickers.forEach((s) => {
        const depth = parseFloat(s.dataset.depth || 20)
        s.style.transform = `translate(${cx * depth}px, ${cy * depth}px)`
      })

      pupils.forEach((p, i) => {
        const o = orig[i]
        const dx = Math.max(-2.2, Math.min(2.2, cx * 5))
        const dy = Math.max(-2.2, Math.min(2.2, cy * 5))
        p.setAttribute('cx', o.cx + dx)
        p.setAttribute('cy', o.cy + dy)
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="illust-wrap" id="illust" ref={wrapRef}>
      <div className="illust-bg-circle" id="illustBg" ref={bgRef}></div>

      {/* === SVG 본체: 선생님/학생/화이트보드 일러스트를 구성하는 주요 도형 묶음 === */}
        <svg className="illust-svg" id="illustSvg" ref={svgRef} viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFDF9"/>
              <stop offset="100%" stopColor="#F8F5EE"/>
            </linearGradient>
          </defs>

          {/* Ground line */}
          <line x1="40" y1="440" x2="560" y2="440" stroke="#1F2937" strokeWidth="2" strokeDasharray="4 4" opacity="0.3"/>

          {/* Plant left */}
          <g transform="translate(40, 360)">
            <rect x="0" y="50" width="42" height="36" rx="4" fill="#FB7185" stroke="#1F2937" strokeWidth="2"/>
            <path d="M 21 50 Q 8 30 6 8" stroke="#0F766E" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <ellipse cx="6" cy="6" rx="8" ry="14" fill="#0EA5A4" stroke="#1F2937" strokeWidth="2" transform="rotate(-20 6 6)"/>
            <ellipse cx="20" cy="0" rx="8" ry="14" fill="#0EA5A4" stroke="#1F2937" strokeWidth="2"/>
            <ellipse cx="34" cy="6" rx="8" ry="14" fill="#0EA5A4" stroke="#1F2937" strokeWidth="2" transform="rotate(20 34 6)"/>
          </g>

          {/* Whiteboard behind teacher */}
          <g transform="translate(80, 80)">
            <rect x="0" y="0" width="260" height="200" rx="14" fill="url(#boardGrad)" stroke="#1F2937" strokeWidth="2.5"/>
            <rect x="0" y="0" width="260" height="200" rx="14" fill="none" stroke="#FB7185" strokeWidth="2" strokeDasharray="4 4" transform="translate(4 4)"/>
            {/* Equations */}
            <text x="20" y="40" fontFamily="Caveat, cursive" fontSize="26" fontWeight="700" fill="#0F766E">f(x) = x² + 2x</text>
            <text x="20" y="80" fontFamily="Caveat, cursive" fontSize="22" fill="#1F2937">∫ f'(x) dx = ?</text>
            {/* Graph */}
            <g transform="translate(20, 100)">
              <line x1="0" y1="60" x2="120" y2="60" stroke="#9CA3AF" strokeWidth="1.5"/>
              <line x1="60" y1="0" x2="60" y2="80" stroke="#9CA3AF" strokeWidth="1.5"/>
              <path d="M 10 70 Q 60 -10 110 70" stroke="#FB7185" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <circle cx="60" cy="20" r="4" fill="#FBBF24" stroke="#1F2937" strokeWidth="1.5"/>
            </g>
            {/* Smiley */}
            <g transform="translate(180, 130)">
              <circle cx="20" cy="20" r="22" fill="#FBBF24" stroke="#1F2937" strokeWidth="2"/>
              <circle cx="13" cy="16" r="2" fill="#1F2937"/>
              <circle cx="27" cy="16" r="2" fill="#1F2937"/>
              <path d="M 11 24 Q 20 32 29 24" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </g>
          </g>

          {/* Teacher figure */}
          <g id="teacher" transform="translate(140, 230)">
            {/* Body / dress */}
            <path d="M 30 80 L 10 220 L 90 220 L 70 80 Z" fill="#0EA5A4" stroke="#1F2937" strokeWidth="2.5"/>
            {/* Arm holding marker, pointing */}
            <path d="M 70 100 Q 105 90 130 70" stroke="#FDA4AF" strokeWidth="14" fill="none" strokeLinecap="round"/>
            <path d="M 70 100 Q 105 90 130 70" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Marker */}
            <rect x="130" y="62" width="20" height="8" rx="2" fill="#FB7185" stroke="#1F2937" strokeWidth="2" transform="rotate(-25 140 66)"/>
            {/* Other arm */}
            <path d="M 30 90 Q 15 130 20 160" stroke="#FDA4AF" strokeWidth="14" fill="none" strokeLinecap="round"/>
            <path d="M 30 90 Q 15 130 20 160" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Head */}
            <circle cx="50" cy="50" r="32" fill="#FDE7E0" stroke="#1F2937" strokeWidth="2.5"/>
            {/* Hair */}
            <path d="M 18 50 Q 18 18 50 18 Q 82 18 82 50 Q 82 36 72 30 Q 60 26 50 28 Q 38 32 28 32 Q 22 38 18 50 Z" fill="#1F2937"/>
            <path d="M 20 50 Q 18 80 26 90 L 30 80 Q 24 60 20 50" fill="#1F2937"/>
            {/* Eyes (look at student → reactive) */}
            <g id="teacherEyes">
              <circle cx="40" cy="52" r="4" fill="white" stroke="#1F2937" strokeWidth="1.5"/>
              <circle cx="60" cy="52" r="4" fill="white" stroke="#1F2937" strokeWidth="1.5"/>
              <circle className="pupil" cx="40" cy="52" r="2" fill="#1F2937"/>
              <circle className="pupil" cx="60" cy="52" r="2" fill="#1F2937"/>
            </g>
            {/* Smile */}
            <path d="M 43 64 Q 50 70 57 64" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
            {/* Cheeks */}
            <circle cx="32" cy="62" r="3" fill="#FB7185" opacity="0.6"/>
            <circle cx="68" cy="62" r="3" fill="#FB7185" opacity="0.6"/>
            {/* Glasses */}
            <circle cx="40" cy="52" r="8" fill="none" stroke="#1F2937" strokeWidth="2"/>
            <circle cx="60" cy="52" r="8" fill="none" stroke="#1F2937" strokeWidth="2"/>
            <line x1="48" y1="52" x2="52" y2="52" stroke="#1F2937" strokeWidth="2"/>
            {/* Collar accent */}
            <circle cx="50" cy="92" r="4" fill="#FBBF24" stroke="#1F2937" strokeWidth="2"/>
            {/* Legs */}
            <rect x="22" y="218" width="22" height="35" rx="6" fill="#1F2937"/>
            <rect x="56" y="218" width="22" height="35" rx="6" fill="#1F2937"/>
            {/* Shoes */}
            <ellipse cx="33" cy="255" rx="14" ry="6" fill="#FB7185" stroke="#1F2937" strokeWidth="2"/>
            <ellipse cx="67" cy="255" rx="14" ry="6" fill="#FB7185" stroke="#1F2937" strokeWidth="2"/>
          </g>

          {/* Connection sparkle line */}
          <path id="connectLine" d="M 280 240 Q 360 200 430 230" stroke="#FBBF24" strokeWidth="3" fill="none" strokeDasharray="6 6" strokeLinecap="round" opacity="0.7">
            <animate attributeName="strokeDashoffset" from="0" to="-60" dur="2s" repeatCount="indefinite"/>
          </path>
          {/* Heart on connection */}
          <g transform="translate(353, 195)" id="connectHeart">
            <path d="M 0 4 C 0 0, 4 -4, 8 0 C 12 -4, 16 0, 16 4 C 16 10, 8 14, 8 14 C 8 14, 0 10, 0 4 Z" fill="#FB7185" stroke="#1F2937" strokeWidth="1.5"/>
          </g>

          {/* Desk */}
          <g transform="translate(370, 320)">
            <rect x="0" y="0" width="180" height="14" rx="3" fill="#FDA4AF" stroke="#1F2937" strokeWidth="2"/>
            <rect x="14" y="14" width="6" height="100" fill="#1F2937"/>
            <rect x="160" y="14" width="6" height="100" fill="#1F2937"/>
          </g>

          {/* Laptop */}
          <g transform="translate(415, 256)">
            {/* Back of laptop screen */}
            <rect x="0" y="0" width="100" height="64" rx="6" fill="#1F2937" stroke="#1F2937" strokeWidth="2"/>
            <rect x="6" y="6" width="88" height="52" rx="3" fill="#0EA5A4"/>
            {/* Video grid on screen */}
            <rect x="10" y="10" width="38" height="22" rx="2" fill="#FDE7E0"/>
            <circle cx="29" cy="20" r="4" fill="#FB7185"/>
            <rect x="52" y="10" width="38" height="22" rx="2" fill="#DBEEF8"/>
            <circle cx="71" cy="20" r="4" fill="#7DD3FC"/>
            <rect x="10" y="36" width="38" height="18" rx="2" fill="#FEF3C7"/>
            <rect x="52" y="36" width="38" height="18" rx="2" fill="#ECE7FB"/>
            {/* Laptop base */}
            <rect x="-6" y="62" width="112" height="6" rx="2" fill="#9CA3AF" stroke="#1F2937" strokeWidth="2"/>
          </g>

          {/* Student figure */}
          <g id="student" transform="translate(370, 200)">
            {/* Body */}
            <path d="M 30 70 L 10 180 L 80 180 L 60 70 Z" fill="#FBBF24" stroke="#1F2937" strokeWidth="2.5"/>
            {/* Arms typing on laptop */}
            <path d="M 25 80 Q 30 110 40 130" stroke="#FDE7E0" strokeWidth="14" fill="none" strokeLinecap="round"/>
            <path d="M 25 80 Q 30 110 40 130" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M 65 80 Q 70 110 60 130" stroke="#FDE7E0" strokeWidth="14" fill="none" strokeLinecap="round"/>
            <path d="M 65 80 Q 70 110 60 130" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Head */}
            <circle cx="45" cy="45" r="32" fill="#FDE7E0" stroke="#1F2937" strokeWidth="2.5"/>
            {/* Hair (short bob) */}
            <path d="M 14 42 Q 14 14 45 14 Q 76 14 76 42 Q 70 32 60 28 Q 50 26 40 28 Q 26 30 18 38 Q 14 38 14 42 Z" fill="#7C2D12"/>
            {/* Eyes */}
            <g id="studentEyes">
              <circle cx="35" cy="47" r="4" fill="white" stroke="#1F2937" strokeWidth="1.5"/>
              <circle cx="55" cy="47" r="4" fill="white" stroke="#1F2937" strokeWidth="1.5"/>
              <circle className="pupil" cx="35" cy="47" r="2" fill="#1F2937"/>
              <circle className="pupil" cx="55" cy="47" r="2" fill="#1F2937"/>
            </g>
            {/* Smile */}
            <path d="M 38 58 Q 45 64 52 58" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
            {/* Cheeks */}
            <circle cx="27" cy="56" r="3" fill="#FB7185" opacity="0.6"/>
            <circle cx="63" cy="56" r="3" fill="#FB7185" opacity="0.6"/>
            {/* Headphones */}
            <path d="M 14 38 Q 14 8 45 8 Q 76 8 76 38" stroke="#7C3AED" strokeWidth="3" fill="none"/>
            <ellipse cx="14" cy="40" rx="5" ry="8" fill="#7C3AED" stroke="#1F2937" strokeWidth="1.5"/>
            <ellipse cx="76" cy="40" rx="5" ry="8" fill="#7C3AED" stroke="#1F2937" strokeWidth="1.5"/>
          </g>

          {/* Floating stars */}
          <g opacity="0.8">
            <path d="M 60 100 l 4 -8 l 4 8 l 8 0 l -6 6 l 2 8 l -8 -4 l -8 4 l 2 -8 l -6 -6 l 8 0 z" fill="#FBBF24" stroke="#1F2937" strokeWidth="1.5"/>
            <path d="M 540 380 l 3 -6 l 3 6 l 6 0 l -4.5 4.5 l 1.5 6 l -6 -3 l -6 3 l 1.5 -6 l -4.5 -4.5 l 6 0 z" fill="#FB7185" stroke="#1F2937" strokeWidth="1.5"/>
            <circle cx="500" cy="120" r="6" fill="#7DD3FC" stroke="#1F2937" strokeWidth="1.5"/>
            <circle cx="45" cy="320" r="4" fill="#C4B5FD" stroke="#1F2937" strokeWidth="1.5"/>
          </g>
        </svg>

      {/* Floating stickers */}
      <div className="sticker s1" data-depth="20">
        <div className="ico" style={{ background: 'var(--mint-bg)' }}>🎥</div>
        <div className="txt">
          <strong>실시간 LIVE</strong>
          <span>{totalViewers}명 수강 중</span>
        </div>
      </div>
      <div className="sticker s2" data-depth="30">
        <div className="ico" style={{ background: 'var(--butter-bg)' }}>⭐</div>
        <div className="txt">
          <strong>평점 4.92</strong>
          <span>이번 달 평균</span>
        </div>
      </div>
      <div className="sticker s3" data-depth="25">
        <div className="ico" style={{ background: 'var(--peach-bg)' }}>✏️</div>
        <div className="txt">
          <strong>같이 풀기!</strong>
          <span>화이트보드 공유</span>
        </div>
      </div>

      {/* 강의실 열기 버튼 — 일러스트(캐릭터/풍선) 하단 중앙. 선생님 로그인 시에만 노출 */}
      <ClassroomLauncher />
    </div>
  )
}
