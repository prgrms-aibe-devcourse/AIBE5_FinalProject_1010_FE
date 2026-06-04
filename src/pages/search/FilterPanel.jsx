/**
 * @file FilterPanel.jsx
 * @description 강의 검색 필터 사이드바입니다.
 * - 학년·가격 필터는 실제 API 파라미터와 연결됩니다.
 * - 수업방식·기타는 백엔드 미지원으로 UI만 제공합니다.
 */
// 학년 그룹: 체크박스 하나가 여러 TargetGrade 값을 대표합니다.
const GRADE_GROUPS = [
  { label: '초등', values: ['ELEMENTARY_1','ELEMENTARY_2','ELEMENTARY_3','ELEMENTARY_4','ELEMENTARY_5','ELEMENTARY_6'] },
  { label: '중등', values: ['MIDDLE_1','MIDDLE_2','MIDDLE_3'] },
  { label: '고등', values: ['HIGH_1','HIGH_2','HIGH_3'] },
  { label: 'N수생', values: ['N_SU'] },
]

// 가격 프리셋 (단위: 원)
const PRICE_PRESETS = [
  { label: '전체',       min: null, max: null   },
  { label: '5만원 이하', min: 0,    max: 50000  },
  { label: '5~10만원',  min: 50000, max: 100000 },
  { label: '10~20만원', min: 100000,max: 200000 },
  { label: '20만원 이상',min: 200000,max: null  },
]

export default function FilterPanel({ filters, onFilterChange, onReset }) {
  // 학년 그룹 토글: 그룹 내 값이 하나라도 있으면 checked
  const isGroupOn = (values) => values.some((v) => filters.targetGrades.includes(v))

  const toggleGroup = (values) => {
    if (isGroupOn(values)) {
      onFilterChange('targetGrades', filters.targetGrades.filter((g) => !values.includes(g)))
    } else {
      onFilterChange('targetGrades', [...new Set([...filters.targetGrades, ...values])])
    }
  }

  // 현재 선택된 가격 프리셋 인덱스
  const activePriceIdx = PRICE_PRESETS.findIndex(
    (p) => p.min === filters.minPrice && p.max === filters.maxPrice
  )

  const selectPrice = (preset) => {
    onFilterChange('minPrice', preset.min)
    onFilterChange('maxPrice', preset.max)
  }

  return (
    <aside className="filter-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3>필터</h3>
        <button className="reset-link" onClick={onReset}>↺ 초기화</button>
      </div>

      {/* 학년 — 실제 동작 */}
      <div className="filter-group">
        <div className="filter-title">학년</div>
        {GRADE_GROUPS.map((group) => (
          <label key={group.label} className="filter-option">
            <input
              type="checkbox"
              checked={isGroupOn(group.values)}
              onChange={() => toggleGroup(group.values)}
            />
            {group.label}
          </label>
        ))}
      </div>

      {/* 가격 — 실제 동작 */}
      <div className="filter-group">
        <div className="filter-title">가격 (1회)</div>
        {PRICE_PRESETS.map((preset, i) => (
          <label key={preset.label} className="filter-option">
            <input
              type="radio"
              name="price-preset"
              checked={activePriceIdx === i}
              onChange={() => selectPrice(preset)}
            />
            {preset.label}
          </label>
        ))}
      </div>

      {/* 수업 방식 — UI 전용 */}
      <div className="filter-group">
        <div className="filter-title">
          수업 방식
          <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600 }}> 준비 중</span>
        </div>
        {['비대면 화상', '대면 (오프라인)'].map((m) => (
          <label key={m} className="filter-option" style={{ opacity: 0.5 }}>
            <input type="checkbox" disabled /> {m}
          </label>
        ))}
      </div>
    </aside>
  )
}
