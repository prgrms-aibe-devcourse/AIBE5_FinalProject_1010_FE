/**
 * @file HomePage.jsx
 * @description 메인 페이지를 구성하는 섹션들을 순서대로 합치는 조립 파일입니다.
 * - 각 섹션의 세부 UI는 같은 폴더의 개별 컴포넌트에 분리되어 있습니다.
 * - 섹션 순서를 바꾸거나 삭제하고 싶다면 이 파일의 JSX 순서를 수정하세요.
 */
import Footer from '../../components/layout/Footer.jsx'
import HeroSection from './HeroSection.jsx'
import CategoriesSection from './CategoriesSection.jsx'
import LiveNowSection from './LiveNowSection.jsx'
import TopTeachersSection from './TopTeachersSection.jsx'
import StatsBannerSection from './StatsBannerSection.jsx'
import QnaBoardSection from './QnaBoardSection.jsx'
import FeaturesSection from './FeaturesSection.jsx'
import CTASection from './CTASection.jsx'

/**
 * 메인 페이지 — 모든 섹션을 순서대로 조합.
 * 각 섹션은 독립 컴포넌트로 분리되어 개발/유지보수가 쉽게 되어 있음.
 */
export default function HomePage() {
  return (
    <>
      {/* 첫 화면: 서비스 핵심 카피와 CTA */}
      <HeroSection />

      {/* 분야별 탐색 → 라이브 수업 → 선생님 신뢰 → 서비스 증거 순서로 설득 흐름을 구성합니다. */}
      <CategoriesSection />
      <LiveNowSection />
      <TopTeachersSection />
      <StatsBannerSection />
      {/* 질문게시판 미리보기로 QnA 기능을 보여준 뒤, 핵심 기능 카드를 이어서 노출합니다. */}
      <QnaBoardSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </>
  )
}
