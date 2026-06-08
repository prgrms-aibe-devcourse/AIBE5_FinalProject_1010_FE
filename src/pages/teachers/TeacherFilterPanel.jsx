const NAEGONG_TIERS = [
  { value: 'all',    label: '전체' },
  { value: 'master', label: '마스터 (1000+)' },
  { value: 'expert', label: '고수 (500+)' },
  { value: 'mid',    label: '중수 (100+)' },
]

const GENDER_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: 'MALE',   label: '남자' },
  { value: 'FEMALE', label: '여자' },
]

export default function TeacherFilterPanel({ filters, onFilterChange, onReset }) {
  const hasActive = filters.naegongTier !== 'all' || filters.gender !== 'all'

  return (
    <div className="filter-chip-bar">
      {/* 내공 점수 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">내공</span>
        {NAEGONG_TIERS.map(({ value, label }) => (
          <button
            key={value}
            className={`filter-chip${filters.naegongTier === value ? ' active' : ''}`}
            onClick={() => onFilterChange('naegongTier', value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 성별 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">성별</span>
        {GENDER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={`filter-chip${filters.gender === value ? ' active' : ''}`}
            onClick={() => onFilterChange('gender', value)}
          >
            {label}
          </button>
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
