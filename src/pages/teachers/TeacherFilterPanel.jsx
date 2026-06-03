/**
 * @file TeacherFilterPanel.jsx
 * @description 선생님 검색 필터 사이드바입니다.
 * - 내공 점수 필터는 실제 동작합니다.
 * - 과목/수업방식/성별 필터는 백엔드 미지원으로 UI만 제공합니다.
 */

const NAEGONG_TIERS = [
  { value: 'all',    label: '전체' },
  { value: 'master', label: '마스터 (1000+)' },
  { value: 'expert', label: '고수 (500+)' },
  { value: 'mid',    label: '중수 (100+)' },
]

const SUBJECTS = ['수학', '영어', '국어', '과학', '코딩']

function ComingSoon() {
  return <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600 }}> 준비 중</span>
}

function disabledClick(e) {
  e.preventDefault()
}

export default function TeacherFilterPanel({ filters, onFilterChange, onReset }) {
  return (
    <aside className="filter-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3>필터</h3>
        <button className="reset-link" onClick={onReset}>↺ 초기화</button>
      </div>

      {/* 내공 점수 — 실제 동작 */}
      <div className="filter-group">
        <div className="filter-title">내공 점수</div>
        {NAEGONG_TIERS.map((tier) => (
          <label key={tier.value} className="filter-option">
            <input
              type="radio"
              name="naegong"
              checked={filters.naegongTier === tier.value}
              onChange={() => onFilterChange('naegongTier', tier.value)}
            />
            {tier.label}
          </label>
        ))}
      </div>

      {/* 과목 전문 — UI 전용 */}
      <div className="filter-group">
        <div className="filter-title">과목 전문<ComingSoon /></div>
        {SUBJECTS.map((s) => (
          <label key={s} className="filter-option" style={{ opacity: 0.5 }}>
            <input type="checkbox" onClick={disabledClick} readOnly /> {s}
          </label>
        ))}
      </div>

      {/* 수업 방식 — UI 전용 */}
      <div className="filter-group">
        <div className="filter-title">수업 방식<ComingSoon /></div>
        <label className="filter-option" style={{ opacity: 0.5 }}>
          <input type="checkbox" onClick={disabledClick} readOnly /> 비대면 화상
        </label>
        <label className="filter-option" style={{ opacity: 0.5 }}>
          <input type="checkbox" onClick={disabledClick} readOnly /> 대면 (오프라인)
        </label>
      </div>

      {/* 성별 — UI 전용 */}
      <div className="filter-group">
        <div className="filter-title">성별<ComingSoon /></div>
        <label className="filter-option" style={{ opacity: 0.5 }}>
          <input type="radio" name="gender-ui" onClick={disabledClick} readOnly /> 여 선생님
        </label>
        <label className="filter-option" style={{ opacity: 0.5 }}>
          <input type="radio" name="gender-ui" onClick={disabledClick} readOnly /> 남 선생님
        </label>
        <label className="filter-option">
          <input type="radio" name="gender-ui" defaultChecked readOnly /> 무관
        </label>
      </div>
    </aside>
  )
}
