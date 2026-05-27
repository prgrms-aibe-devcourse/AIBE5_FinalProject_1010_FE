/**
 * @file StatsBannerSection.jsx
 * @description 메인 페이지 중간의 서비스 지표 배너입니다.
 * - 검증 선생님, 누적 수업, 평균 평점 같은 신뢰 지표를 강조합니다.
 */
/**
 * 합격 소식 — 다크 배너 with 합격 통계 4개
 */
export default function StatsBannerSection() {
  return (
    <section style={{ padding: '40px 0' }}>
      <div className="stats-banner">
        <h2>올해 우리 학생들의 <span className="hand">합격 소식 🎓</span></h2>
        <p>Study Flow와 함께 꿈을 이룬 학생들이에요</p>
        <div className="stats-grid">
          <StatBlock num="412" unit="명" label="서울대학교" />
          <StatBlock num="528" unit="명" label="연세대학교" />
          <StatBlock num="601" unit="명" label="고려대학교" />
          <StatBlock num="2,348" unit="명" label="SKY 외 상위권" />
        </div>
      </div>
    </section>
  )
}

/**
 * 통계 배너 안에서 반복되는 숫자 블록입니다.
 * num/unit/label을 분리해 숫자 강조 스타일을 재사용합니다.
 */
function StatBlock({ num, unit, label }) {
  return (
    <div className="stat-block">
      <div className="num">{num}<span className="unit">{unit}</span></div>
      <div className="lbl">{label}</div>
    </div>
  )
}
