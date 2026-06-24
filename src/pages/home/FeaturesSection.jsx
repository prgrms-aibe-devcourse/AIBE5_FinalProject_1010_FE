/**
 * @file FeaturesSection.jsx
 * @description StudyFlow의 핵심 기능/장점을 보여주는 6개 카드 섹션입니다.
 * - features.js 데이터를 사용합니다.
 * - 각 카드는 useMouseTilt 훅으로 마우스 틸트 효과를 가집니다.
 */
import { useRef } from 'react'
import { features } from '../../data/features.js'
import useMouseTilt from '../../hooks/useMouseTilt.js'

/**
 * Why Study Flow — 6개 feature 카드 with 3D mouse tilt.
 */
export default function FeaturesSection() {
  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="eyebrow teal">✨ WHY STUDY FLOW</span>
          <h2 className="section-title">왜 <span className="hand">Study Flow</span>일까요?</h2>
          <p className="section-subtitle">다른 곳에선 어려운 진짜 양방향 수업을 경험해보세요</p>
        </div>
        <div className="features">
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * 기능 카드 1개입니다.
 * ref를 DOM에 연결하고 useMouseTilt가 해당 DOM에 마우스 이벤트를 붙입니다.
 */
function FeatureCard({ feature }) {
  const ref = useRef(null)
  useMouseTilt(ref, { strength: 8 })

  return (
    <div className={`feature-card tilt ${feature.bg}`} ref={ref}>
      <div className="feature-icon">{feature.icon}</div>
      <h3>{feature.title}</h3>
      <p>{feature.desc}</p>
    </div>
  )
}
