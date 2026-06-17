import { useState } from 'react'
import RegionPicker from '../mypage/teacher/RegionPicker.jsx'
import UniversityPicker from '../mypage/teacher/UniversityPicker.jsx'

const GENDER_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: 'MALE',   label: '남자' },
  { value: 'FEMALE', label: '여자' },
]

// 접이식 섹션 한 칸 — 제목 + 현재 선택 요약 + 펼침 토글
function AccSection({ id, title, summary, active, open, onToggle, children }) {
  return (
    <div className={`facc${open ? ' facc--open' : ''}`}>
      <button type="button" className="facc__head" onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="facc__title">{title}</span>
        <span className={`facc__summary${active ? ' facc__summary--active' : ''}`}>{summary}</span>
        <span className="facc__caret">▾</span>
      </button>
      {open && <div className="facc__body">{children}</div>}
    </div>
  )
}

/**
 * 선생님 찾기 필터 패널 (접이식 사이드바).
 *
 * @param filters        { sort, gender, minAge, maxAge, regions[], universities[], subjectIds[] }
 * @param onFilterChange (key, value) => void
 * @param onReset        필터 초기화
 * @param subjects       과목 목록 [{ subjectId, name }]
 */
export default function TeacherFilterPanel({ filters, onFilterChange, onReset, subjects = [] }) {
  const [openSet, setOpenSet] = useState({})
  const [showRegion, setShowRegion] = useState(false)
  const [showUniv, setShowUniv]     = useState(false)

  const toggleSection = (id) => setOpenSet((s) => ({ ...s, [id]: !s[id] }))

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

  // ── 섹션별 활성 여부 & 요약 텍스트 ──
  const genderActive  = filters.gender !== 'all'
  const ageActive     = filters.minAge !== '' || filters.maxAge !== ''
  const regionActive  = filters.regions.length > 0
  const univActive    = filters.universities.length > 0
  const subjectActive = filters.subjectIds.length > 0

  const genderSummary = filters.gender === 'all' ? '전체' : filters.gender === 'MALE' ? '남자' : '여자'
  const ageSummary = !ageActive ? '전체'
    : (filters.minAge && filters.maxAge) ? `${filters.minAge}~${filters.maxAge}세`
    : filters.minAge ? `${filters.minAge}세 이상`
    : `${filters.maxAge}세 이하`
  const regionSummary = regionActive ? `${filters.regions.length}개` : '전체'
  const univSummary   = univActive ? `${filters.universities.length}개` : '전체'
  const subjectSummary = filters.subjectIds.length === 0 ? '전체'
    : filters.subjectIds.length === 1
      ? (subjects.find(s => s.subjectId === filters.subjectIds[0])?.name ?? '1개 선택')
      : `${filters.subjectIds.length}개 선택`

  const hasActive = genderActive || ageActive || regionActive || univActive || subjectActive

  const ageInvalid = filters.minAge !== '' && filters.maxAge !== ''
    && Number(filters.minAge) > Number(filters.maxAge)

  return (
    <div className="filter-side">
      <div className="filter-side__head">
        <h3>필터</h3>
        {hasActive && <button className="filter-side__reset" onClick={onReset}>↺ 초기화</button>}
      </div>

      {/* 성별 */}
      <AccSection id="gender" title="성별" summary={genderSummary} active={genderActive}
        open={!!openSet.gender} onToggle={toggleSection}>
        <div className="filter-chips">
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
      </AccSection>

      {/* 나이 */}
      <AccSection id="age" title="나이" summary={ageSummary} active={ageActive}
        open={!!openSet.age} onToggle={toggleSection}>
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
        {ageInvalid && (
          <span className="filter-age-error">최솟값이 최댓값보다 클 수 없어요</span>
        )}
      </AccSection>

      {/* 지역 (다중) */}
      <AccSection id="region" title="지역" summary={regionSummary} active={regionActive}
        open={!!openSet.region} onToggle={toggleSection}>
        <button className="filter-picker-btn" onClick={() => setShowRegion(true)}>
          + 지역 선택{filters.regions.length > 0 && ` (${filters.regions.length})`}
        </button>
        {filters.regions.length > 0 && (
          <div className="filter-chips" style={{ marginTop: 8 }}>
            {filters.regions.map(r => (
              <button key={r} className="filter-chip active filter-chip--removable" onClick={() => removeFrom('regions', r)}>
                {r} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
      </AccSection>

      {/* 대학교 (다중) */}
      <AccSection id="univ" title="대학교" summary={univSummary} active={univActive}
        open={!!openSet.univ} onToggle={toggleSection}>
        <button className="filter-picker-btn" onClick={() => setShowUniv(true)}>
          + 대학교 선택{filters.universities.length > 0 && ` (${filters.universities.length})`}
        </button>
        {filters.universities.length > 0 && (
          <div className="filter-chips" style={{ marginTop: 8 }}>
            {filters.universities.map(u => (
              <button key={u} className="filter-chip active filter-chip--removable" onClick={() => removeFrom('universities', u)}>
                {u} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
      </AccSection>

      {/* 과목 (다중) */}
      <AccSection id="subject" title="과목" summary={subjectSummary} active={subjectActive}
        open={!!openSet.subject} onToggle={toggleSection}>
        {subjects.length === 0
          ? <span className="filter-subject-loading">과목 불러오는 중...</span>
          : (
            <div className="filter-chips">
              {subjects.map(s => (
                <button
                  key={s.subjectId}
                  className={`filter-chip${filters.subjectIds.includes(s.subjectId) ? ' active' : ''}`}
                  onClick={() => toggleSubject(s.subjectId)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )
        }
      </AccSection>

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
