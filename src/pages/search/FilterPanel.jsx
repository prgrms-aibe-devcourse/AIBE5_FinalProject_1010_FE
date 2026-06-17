import { useState, useEffect } from 'react'
import { API_BASE } from '../../api/config.js'
import { MonitorIcon, LocationPinIcon } from '../../components/icons/SearchIcons.jsx'
import RegionPicker from '../mypage/teacher/RegionPicker.jsx'

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

const MODE_OPTIONS = [
  { value: null,      label: '전체',  icon: null },
  { value: 'ONLINE',  label: '온라인', icon: 'monitor' },
  { value: 'OFFLINE', label: '대면',   icon: 'pin' },
]

const GROUP_PRESETS = [
  { label: '전체',   min: null, max: null },
  { label: '1:1',    min: null, max: 1    },
  { label: '소그룹', min: 2,    max: 6    },
  { label: '대그룹', min: 7,    max: null },
]

// 가격 요약/입력 표기를 위한 천단위 콤마 포맷
const formatWon = (won) => won?.toLocaleString('ko-KR') ?? ''

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

export default function FilterPanel({ filters, onFilterChange, onReset }) {
  const [openSet, setOpenSet] = useState({})        // 섹션별 펼침 상태 (다중 허용)
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [priceMin, setPriceMin] = useState('')      // 가격 입력칸 로컬 상태 (숫자 문자열)
  const [priceMax, setPriceMax] = useState('')
  const [showRegion, setShowRegion] = useState(false)  // 지역 선택 모달 표시 여부

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/subjects`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setSubjects)
      .catch(() => { console.warn('과목 목록 조회 실패') })
  }, [])

  // 외부 filters(초기화 등)와 입력칸 동기화
  useEffect(() => {
    setPriceMin(filters.minPrice != null ? String(filters.minPrice) : '')
    setPriceMax(filters.maxPrice != null ? String(filters.maxPrice) : '')
  }, [filters.minPrice, filters.maxPrice])

  const toggleSection = (id) => setOpenSet((s) => ({ ...s, [id]: !s[id] }))

  const toggleSubject = (id) => {
    const next = filters.subjectIds.includes(id)
      ? filters.subjectIds.filter((s) => s !== id)
      : [...filters.subjectIds, id]
    onFilterChange('subjectIds', next)
  }

  const isGroupActive = (values) => values.some((v) => filters.targetGrades.includes(v))
  const isGradeActive = (value)  => filters.targetGrades.includes(value)

  const toggleGrade = (value) => {
    const next = filters.targetGrades.includes(value)
      ? filters.targetGrades.filter((g) => g !== value)
      : [...filters.targetGrades, value]
    onFilterChange('targetGrades', next)
  }

  const handleGroupClick = (group) => {
    if (!group.subLabels) { toggleGrade(group.values[0]); return }
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

  // 입력칸 → 숫자(또는 null). 콤마·공백 제거 후 파싱
  const parsePrice = (s) => {
    const digits = String(s).replace(/[^0-9]/g, '')
    return digits === '' ? null : Number(digits)
  }
  const minN = parsePrice(priceMin)
  const maxN = parsePrice(priceMax)
  const priceError = minN != null && maxN != null && minN > maxN

  // 입력 중에는 숫자만 남기고 콤마는 표시용으로만 적용
  const handlePriceInput = (setter) => (e) => setter(e.target.value.replace(/[^0-9]/g, ''))

  const applyPrice = () => {
    if (priceError) return
    onFilterChange('minPrice', minN)
    onFilterChange('maxPrice', maxN)
  }

  // 다중 선택 목록에서 항목 제거
  const removeRegion = (region) =>
    onFilterChange('regions', filters.regions.filter((r) => r !== region))

  // ── 섹션별 활성 여부 & 요약 텍스트 ──
  const modeActive    = filters.teachingMode != null
  const regionActive  = filters.regions.length > 0
  const subjectActive = filters.subjectIds.length > 0
  const gradeActive   = filters.targetGrades.length > 0
  const groupActive   = filters.minGroupSize != null || filters.maxGroupSize != null
  const priceActive   = filters.minPrice != null || filters.maxPrice != null

  const modeSummary = filters.teachingMode == null ? '전체'
    : filters.teachingMode === 'ONLINE' ? '온라인' : '대면'
  const regionSummary = regionActive ? `${filters.regions.length}개` : '전체'
  const subjectSummary = filters.subjectIds.length === 0 ? '전체'
    : filters.subjectIds.length === 1
      ? (subjects.find((s) => s.subjectId === filters.subjectIds[0])?.name ?? '1개 선택')
      : `${filters.subjectIds.length}개 선택`
  const gradeSummary = filters.targetGrades.length === 0 ? '전체' : `${filters.targetGrades.length}개 선택`
  const groupSummary = activeGroupIdx >= 0 ? GROUP_PRESETS[activeGroupIdx].label : '전체'
  const priceSummary = !priceActive ? '전체'
    : filters.minPrice != null && filters.maxPrice != null ? `${formatWon(filters.minPrice)}~${formatWon(filters.maxPrice)}원`
    : filters.minPrice != null ? `${formatWon(filters.minPrice)}원 이상`
    : `${formatWon(filters.maxPrice)}원 이하`

  const hasActive = subjectActive || gradeActive || modeActive || regionActive || groupActive || priceActive

  return (
    <div className="filter-side">
      <div className="filter-side__head">
        <h3>필터</h3>
        {hasActive && <button className="filter-side__reset" onClick={onReset}>↺ 초기화</button>}
      </div>

      {/* 수업 방식 */}
      <AccSection id="mode" title="수업 방식" summary={modeSummary} active={modeActive}
        open={!!openSet.mode} onToggle={toggleSection}>
        <div className="filter-chips">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              className={`filter-chip${filters.teachingMode === opt.value ? ' active' : ''}`}
              onClick={() => onFilterChange('teachingMode', opt.value)}
            >
              {opt.icon === 'monitor' && <MonitorIcon size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
              {opt.icon === 'pin'     && <LocationPinIcon size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
              {opt.label}
            </button>
          ))}
        </div>
      </AccSection>

      {/* 지역 (대면 수업) — 다중 선택 */}
      <AccSection id="region" title="지역" summary={regionSummary} active={regionActive}
        open={!!openSet.region} onToggle={toggleSection}>
        <button className="filter-picker-btn" onClick={() => setShowRegion(true)}>
          + 지역 선택{filters.regions.length > 0 && ` (${filters.regions.length})`}
        </button>
        {filters.regions.length > 0 && (
          <div className="filter-chips" style={{ marginTop: 8 }}>
            {filters.regions.map((r) => (
              <button key={r} className="filter-chip active filter-chip--removable" onClick={() => removeRegion(r)}>
                {r} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
        <p className="filter-region-hint">선택한 지역에서 진행되는 대면 수업만 표시돼요</p>
      </AccSection>

      {/* 과목 */}
      {subjects.length > 0 && (
        <AccSection id="subject" title="과목" summary={subjectSummary} active={subjectActive}
          open={!!openSet.subject} onToggle={toggleSection}>
          <div className="filter-chips">
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
        </AccSection>
      )}

      {/* 학년 */}
      <AccSection id="grade" title="학년" summary={gradeSummary} active={gradeActive}
        open={!!openSet.grade} onToggle={toggleSection}>
        <div className="filter-chips">
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
        {expandedGroupData && (
          <div className="filter-chips filter-chips--sub">
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
      </AccSection>

      {/* 인원 */}
      <AccSection id="group" title="인원" summary={groupSummary} active={groupActive}
        open={!!openSet.group} onToggle={toggleSection}>
        <div className="filter-chips">
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
      </AccSection>

      {/* 가격 (회당, 직접 입력) */}
      <AccSection id="price" title="가격" summary={priceSummary} active={priceActive}
        open={!!openSet.price} onToggle={toggleSection}>
        <div className="filter-price">
          <div className="filter-price__row">
            <input
              className="filter-price__input"
              inputMode="numeric"
              placeholder="최소"
              value={priceMin ? Number(priceMin).toLocaleString('ko-KR') : ''}
              onChange={handlePriceInput(setPriceMin)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyPrice() }}
            />
            <span className="filter-price__sep">~</span>
            <input
              className="filter-price__input"
              inputMode="numeric"
              placeholder="최대"
              value={priceMax ? Number(priceMax).toLocaleString('ko-KR') : ''}
              onChange={handlePriceInput(setPriceMax)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyPrice() }}
            />
            <span className="filter-price__unit">원</span>
          </div>
          {priceError && <p className="filter-price__error">최소 금액이 최대 금액보다 커요</p>}
          <button type="button" className="filter-price__apply" onClick={applyPrice} disabled={priceError}>
            적용
          </button>
        </div>
      </AccSection>

      {showRegion && (
        <RegionPicker
          multi
          selected={filters.regions}
          onChange={(v) => onFilterChange('regions', v)}
          onClose={() => setShowRegion(false)}
        />
      )}
    </div>
  )
}
