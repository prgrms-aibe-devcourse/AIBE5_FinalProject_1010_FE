import { useState } from 'react'
import RegionPicker from '../mypage/teacher/RegionPicker.jsx'
import UniversityPicker from '../mypage/teacher/UniversityPicker.jsx'

const SORT_OPTIONS = [
  { value: 'LATEST', label: '최신순' },
  { value: 'OLDEST', label: '오래된순' },
]

const GENDER_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: 'MALE',   label: '남자' },
  { value: 'FEMALE', label: '여자' },
]

/**
 * 선생님 찾기 필터 패널.
 *
 * @param filters        { sort, gender, minAge, maxAge, regions[], universities[], subjectIds[] }
 * @param onFilterChange (key, value) => void
 * @param onReset        필터 초기화
 * @param subjects       과목 목록 [{ subjectId, name }]
 */
export default function TeacherFilterPanel({ filters, onFilterChange, onReset, subjects = [] }) {
  const [showRegion, setShowRegion] = useState(false)
  const [showUniv, setShowUniv]     = useState(false)

  const hasActive =
    filters.sort !== 'LATEST' ||
    filters.gender !== 'all' ||
    filters.minAge !== '' ||
    filters.maxAge !== '' ||
    filters.regions.length > 0 ||
    filters.universities.length > 0 ||
    filters.subjectIds.length > 0

  // 단일 선택 칩 행 (성별·정렬)
  const chipRow = (label, key, options) => (
    <div className="filter-chip-row">
      <span className="filter-chip-label">{label}</span>
      {options.map(({ value, label: optLabel }) => (
        <button
          key={value}
          className={`filter-chip${filters[key] === value ? ' active' : ''}`}
          onClick={() => onFilterChange(key, value)}
        >
          {optLabel}
        </button>
      ))}
    </div>
  )

  // 다중 선택 목록에서 항목 제거
  const removeFrom = (key, item) =>
    onFilterChange(key, filters[key].filter(v => v !== item))

  const toggleSubject = (id) =>
    onFilterChange(
      'subjectIds',
      filters.subjectIds.includes(id)
        ? filters.subjectIds.filter(s => s !== id)
        : [...filters.subjectIds, id]
    )

  const onlyDigits = (v) => v.replace(/[^0-9]/g, '').slice(0, 3)
  const clampAge = (v) => (v && Number(v) > 100) ? '100' : v

  return (
    <div className="filter-chip-bar">
      {/* 성별 */}
      {chipRow('성별', 'gender', GENDER_OPTIONS)}

      {/* 나이 */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">나이</span>
        <div className="filter-age">
          <input
            type="text" inputMode="numeric" className="filter-age-input"
            value={filters.minAge} placeholder="최소"
            onChange={e => onFilterChange('minAge', clampAge(onlyDigits(e.target.value)))}
          />
          <span className="filter-age-sep">~</span>
          <input
            type="text" inputMode="numeric" className="filter-age-input"
            value={filters.maxAge} placeholder="최대"
            onChange={e => onFilterChange('maxAge', clampAge(onlyDigits(e.target.value)))}
          />
          <span className="filter-age-unit">세</span>
        </div>
      </div>

      {/* 지역 (다중) */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">지역</span>
        <button className="filter-picker-btn" onClick={() => setShowRegion(true)}>
          + 지역 선택{filters.regions.length > 0 && ` (${filters.regions.length})`}
        </button>
        {filters.regions.map(r => (
          <button key={r} className="filter-chip active filter-chip--removable" onClick={() => removeFrom('regions', r)}>
            {r} <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>

      {/* 대학교 (다중) */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">대학교</span>
        <button className="filter-picker-btn" onClick={() => setShowUniv(true)}>
          + 대학교 선택{filters.universities.length > 0 && ` (${filters.universities.length})`}
        </button>
        {filters.universities.map(u => (
          <button key={u} className="filter-chip active filter-chip--removable" onClick={() => removeFrom('universities', u)}>
            {u} <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>

      {/* 과목 (다중) */}
      <div className="filter-chip-row">
        <span className="filter-chip-label">과목</span>
        {subjects.map(s => (
          <button
            key={s.subjectId}
            className={`filter-chip${filters.subjectIds.includes(s.subjectId) ? ' active' : ''}`}
            onClick={() => toggleSubject(s.subjectId)}
          >
            {s.name}
          </button>
        ))}
        {subjects.length === 0 && <span className="filter-subject-loading">과목 불러오는 중...</span>}
      </div>

      {/* 정렬 */}
      {chipRow('정렬', 'sort', SORT_OPTIONS)}

      {hasActive && (
        <div className="filter-chip-row">
          <button className="filter-reset-chip" onClick={onReset}>↺ 필터 초기화</button>
        </div>
      )}

      {showRegion && (
        <RegionPicker
          multi
          selected={filters.regions}
          onChange={v => onFilterChange('regions', v)}
          onClose={() => setShowRegion(false)}
        />
      )}
      {showUniv && (
        <UniversityPicker
          multi
          selected={filters.universities}
          onChange={v => onFilterChange('universities', v)}
          onClose={() => setShowUniv(false)}
        />
      )}
    </div>
  )
}
