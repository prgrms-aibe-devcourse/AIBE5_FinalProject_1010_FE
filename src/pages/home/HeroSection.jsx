/**
 * @file HeroSection.jsx
 * @description 메인 페이지 첫 화면 Hero 섹션입니다.
 * - 서비스 한 줄 소개, CTA 버튼, 지표, HeroIllustration을 보여줍니다.
 * - 첫인상을 담당하므로 문구/CTA 수정이 자주 일어나는 파일입니다.
 */
import { Link } from 'react-router-dom'
import HeroIllustration from '../../components/illustrations/HeroIllustration.jsx'

/**
 * 메인 페이지 Hero 섹션 (좌측: 카피 + CTA + 통계 / 우측: 3D 일러스트)
 */
export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-left">
          <span className="eyebrow coral">🌱 실시간 양방향 수업 플랫폼</span>
          <h1>
            진짜 <span className="underline">함께 만드는</span><br />
            <span className="pen">우리들의 교실,</span><br />
            Study Flow
          </h1>
          <p className="lead">
            선생님과 학생이 화이트보드 하나에 같이 그리는 진짜 양방향 수업.<br />
            어디서든, 누구나, 함께 배워요.
          </p>
          <div className="hero-cta">
            <Link to="/search" className="btn btn-primary btn-lg">✨ 수업 찾으러 가기</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">선생님으로 시작하기</Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="num">10,248<span className="check">✓</span></div>
              <div className="label">활동 선생님</div>
            </div>
            <div className="stat">
              <div className="num">52,930</div>
              <div className="label">개설 강의</div>
            </div>
            <div className="stat">
              <div className="num">4.92<span className="check">★</span></div>
              <div className="label">평균 만족도</div>
            </div>
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  )
}
