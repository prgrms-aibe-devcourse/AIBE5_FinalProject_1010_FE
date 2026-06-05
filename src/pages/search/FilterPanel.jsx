const GRADE_GROUPS = [
  { label: '초등', values: ['ELEMENTARY_1','ELEMENTARY_2','ELEMENTARY_3','ELEMENTARY_4','ELEMENTARY_5','ELEMENTARY_6'] },
  { label: '중등', values: ['MIDDLE_1','MIDDLE_2','MIDDLE_3'] },
  { label: '고등', values: ['HIGH_1','HIGH_2','HIGH_3'] },
  { label: 'N수생', values: ['N_SU'] },
]

const PRICE_PRESETS = [
  { label: '전체',        min: null,   max: null   },
  { label: '5만원 이하',  min: 0,      max: 50000  },
  { label: '5~10만원',   min: 50000,  max: 100000 },
  { label: '10~20만원',  min: 100000, max: 200000 },
  { label: '20만원 이상', min: 200000, max: null   },
]

export default function FilterPanel({ filters, onFilterChange, onReset }) {
  const isGroupOn = (values) => values.some((v) => filters.targetGrades.includes(v))

  const toggleGroup = (values) => {
    if (isGroupOn(values)) {
      onFilterChange('targetGrades', filters.targetGrades.filter((g) => !values.includes(g)))
    } else {
      onFilterChange('targetGrades', [...new Set([...filters.targetGrades, ...values])])
    }
  }

  const activePriceIdx = PRICE_PRESETS.findIndex(
    (p) => p.min === filters.minPrice && p.max === filters.maxPrice
  )

  const selectPrice = (preset) => {
    onFilterChange('minPrice', preset.min)
    onFilterChange('maxPrice', preset.max)
  }

  const hasActive = filters.targetGrades.length > 0 || filters.minPrice != null || filters.maxPrice != null

  return (
    <div className="filter-chip-bar">
      {/* 학년 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">학년</span>
        {GRADE_GROUPS.map((group) => (
          <button
            key={group.label}
            className={`filter-chip${isGroupOn(group.values) ? ' active' : ''}`}
            onClick={() => toggleGroup(group.values)}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* 가격 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">가격</span>
        {PRICE_PRESETS.map((preset, i) => (
          <button
            key={preset.label}
            className={`filter-chip${activePriceIdx === i ? ' active' : ''}`}
            onClick={() => selectPrice(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 수업 방식 (API 미지원) */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">
          방식
          <span className="filter-chip-soon"> 준비 중</span>
        </span>
        {['비대면 화상', '대면'].map((m) => (
          <button key={m} className="filter-chip" disabled>{m}</button>
        ))}
      </div>

      {/* 초기화 */}
      {hasActive && (
        <div className="filter-chip-row">
          <button className="filter-reset-chip" onClick={onReset}>↺ 필터 초기화</button>
        </div>
      )}
    </div>
  )
}
