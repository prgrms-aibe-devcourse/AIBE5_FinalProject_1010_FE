/**
 * @file CTASection.jsx
 * @description 메인 페이지 최하단 가입 유도 CTA 섹션입니다.
 * - 학생/선생님 시작 버튼을 통해 로그인/회원가입 화면으로 이동합니다.
 */
import { Link } from 'react-router-dom'

/**
 * 메인 페이지 하단 CTA. 학생/선생님 회원가입 유도.
 */
export default function CTASection() {
  return (
    <section className="cta-section">
      <span className="eyebrow coral">🎁 첫 수업 30% 할인</span>
      <h2>
        지금 바로 시작해볼까요?
        <span className="hand">우리 함께해요 🤝</span>
      </h2>
      <p>회원가입 후 첫 수업 30% 할인 쿠폰을 드려요</p>
      <div className="cta-buttons">
        <Link to="/login" className="btn btn-primary btn-lg">🎒 학생으로 시작하기</Link>
        <Link to="/login" className="btn btn-coral btn-lg">👨‍🏫 선생님으로 시작하기</Link>
      </div>
    </section>
  )
}
