import { useState, useEffect } from 'react'
import { API_BASE } from '../../api/config.js'

const GRADE_GROUPS = [
  {
    label: '초등',
    values: ['ELEMENTARY_1','ELEMENTARY_2','ELEMENTARY_3','ELEMENTARY_4','ELEMENTARY_5','ELEMENTARY_6'],
    subLabels: ['초1','초2','초3','초4','초5','초6'],
  },
  {
    label: '중등',
    values: ['MIDDLE_1','MIDDLE_2','MIDDLE_3'],
    subLabels: ['중1','중2','중3'],
  },
  {
    label: '고등',
    values: ['HIGH_1','HIGH_2','HIGH_3'],
    subLabels: ['고1','고2','고3'],
  },
  {
    label: 'N수생',
    values: ['N_SU'],
    subLabels: null,
  },
]

const SORT_OPTIONS = [
  { value: 'LATEST',     label: '최신순' },
  { value: 'PRICE_ASC',  label: '가격 낮은순' },
  { value: 'PRICE_DESC', label: '가격 높은순' },
]

const GROUP_PRESETS = [
  { label: '전체',   min: null, max: null },
  { label: '개인',   min: null, max: 1    },
  { label: '소그룹', min: 2,    max: 6    },
  { label: '대그룹', min: 7,    max: null },
]

const PRICE_PRESETS = [
  { label: '전체',        min: null,   max: null   },
  { label: '5만원 이하',  min: 0,      max: 50000  },
  { label: '5~10만원',   min: 50000,  max: 100000 },
  { label: '10~20만원',  min: 100000, max: 200000 },
  { label: '20만원 이상', min: 200000, max: null   },
]

export default function FilterPanel({ filters, onFilterChange, onReset }) {
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/subjects`)
      .then((r) => r.json())
      .then(setSubjects)
      .catch(() => {})
  }, [])

  const toggleSubject = (id) => {
    const next = filters.subjectIds.includes(id)
      ? filters.subjectIds.filter((s) => s !== id)
      : [...filters.subjectIds, id]
    onFilterChange('subjectIds', next)
  }

  const isGroupActive  = (values) => values.some((v) => filters.targetGrades.includes(v))
  const isGradeActive  = (value)  => filters.targetGrades.includes(value)

  const toggleGrade = (value) => {
    const next = filters.targetGrades.includes(value)
      ? filters.targetGrades.filter((g) => g !== value)
      : [...filters.targetGrades, value]
    onFilterChange('targetGrades', next)
  }

  const handleGroupClick = (group) => {
    if (!group.subLabels) {
      // N수생: 세부 행 없으므로 직접 토글
      toggleGrade(group.values[0])
      return
    }
    setExpandedGroup((prev) => (prev === group.label ? null : group.label))
  }

  const clearGrades = () => {
    onFilterChange('targetGrades', [])
    setExpandedGroup(null)
  }

  const expandedGroupData = GRADE_GROUPS.find((g) => g.label === expandedGroup)

  const activeGroupIdx = GROUP_PRESETS.findIndex(
    (p) => p.min === filters.minGroupSize && p.max === filters.maxGroupSize
  )

  const selectGroup = (preset) => {
    onFilterChange('minGroupSize', preset.min)
    onFilterChange('maxGroupSize', preset.max)
  }

  const activePriceIdx = PRICE_PRESETS.findIndex(
    (p) => p.min === filters.minPrice && p.max === filters.maxPrice
  )

  const selectPrice = (preset) => {
    onFilterChange('minPrice', preset.min)
    onFilterChange('maxPrice', preset.max)
  }

  const hasActive = filters.subjectIds.length > 0
    || filters.targetGrades.length > 0
    || filters.minPrice != null || filters.maxPrice != null
    || filters.curriculumType != null
    || filters.minGroupSize != null || filters.maxGroupSize != null

  return (
    <div className="filter-chip-bar">

      {/* 과목 */}
      {subjects.length > 0 && (
        <div className="filter-chip-row">
          <span className="filter-chip-label">과목</span>
          <button
            className={`filter-chip${filters.subjectIds.length === 0 ? ' active' : ''}`}
            onClick={() => onFilterChange('subjectIds', [])}
          >
            전체
          </button>
          {subjects.map((s) => (
            <button
              key={s.subjectId}
              className={`filter-chip${filters.subjectIds.includes(s.subjectId) ? ' active' : ''}`}
              onClick={() => toggleSubject(s.subjectId)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* 학년 — 그룹 행 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">학년</span>
        <button
          className={`filter-chip${filters.targetGrades.length === 0 ? ' active' : ''}`}
          onClick={clearGrades}
        >
          전체
        </button>
        {GRADE_GROUPS.map((group) => {
          const active   = isGroupActive(group.values)
          const expanded = expandedGroup === group.label
          return (
            <button
              key={group.label}
              className={`filter-chip${active ? ' active' : ''}`}
              onClick={() => handleGroupClick(group)}
            >
              {group.label}
              {group.subLabels && (
                <span className="filter-chip-caret">{expanded ? '▴' : '▾'}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 학년 — 세부 행 (확장 시) */}
      {expandedGroupData && (
        <div className="filter-chip-row filter-chip-row--sub">
          {expandedGroupData.subLabels.map((subLabel, i) => {
            const value = expandedGroupData.values[i]
            return (
              <button
                key={value}
                className={`filter-chip filter-chip--sm${isGradeActive(value) ? ' active' : ''}`}
                onClick={() => toggleGrade(value)}
              >
                {subLabel}
              </button>
            )
          })}
        </div>
      )}

      {/* 인원 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">인원</span>
        {GROUP_PRESETS.map((preset, i) => (
          <button
            key={preset.label}
            className={`filter-chip${activeGroupIdx === i ? ' active' : ''}`}
            onClick={() => selectGroup(preset)}
          >
            {preset.label}
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

      {/* 수업 방식 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">방식</span>
        {[
          { value: null,     label: '전체' },
          { value: 'CUSTOM', label: '맞춤형' },
          { value: 'FIXED',  label: '정해진 커리큘럼' },
        ].map((opt) => (
          <button
            key={opt.value ?? 'all'}
            className={`filter-chip${filters.curriculumType === opt.value ? ' active' : ''}`}
            onClick={() => onFilterChange('curriculumType', opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 정렬 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">정렬</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`filter-chip${filters.sort === opt.value ? ' active' : ''}`}
            onClick={() => onFilterChange('sort', opt.value)}
          >
            {opt.label}
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
