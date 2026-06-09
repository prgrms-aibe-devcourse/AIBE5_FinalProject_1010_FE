const GENDER_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: 'MALE',   label: '남자' },
  { value: 'FEMALE', label: '여자' },
]

const AGE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s', label: '50대 이상' },
]

const REGION_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '경기', label: '경기' },
  { value: '인천', label: '인천' },
  { value: '부산', label: '부산' },
  { value: '대구', label: '대구' },
  { value: '대전', label: '대전' },
  { value: '광주', label: '광주' },
  { value: '울산', label: '울산' },
  { value: '강원', label: '강원' },
  { value: '충청', label: '충청' },
  { value: '전라', label: '전라' },
  { value: '경상', label: '경상' },
  { value: '제주', label: '제주' },
]

const SUBJECT_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: '국어',   label: '국어' },
  { value: '영어',   label: '영어' },
  { value: '수학',   label: '수학' },
  { value: '사회탐구', label: '사회탐구' },
  { value: '과학탐구', label: '과학탐구' },
  { value: '직업탐구', label: '직업탐구' },
  { value: '한국사', label: '한국사' },
  { value: '제2외국어', label: '제2외국어' },
]

const UNIVERSITY_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: 'sky',    label: 'SKY' },
  { value: 'top10',  label: '서울 상위 10개' },
  { value: 'seoul',  label: '서울권' },
  { value: 'metro',  label: '수도권' },
  { value: 'other',  label: '기타' },
]

export default function TeacherFilterPanel({ filters, onFilterChange, onReset }) {
  const hasActive = filters.gender !== 'all'
    || filters.age !== 'all'
    || filters.region !== 'all'
    || filters.subject !== 'all'
    || filters.university !== 'all'

  const row = (label, key, options) => (
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

  return (
    <div className="filter-chip-bar">
      <div className="filter-chip-row">
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', background: 'var(--peach-bg)', border: '1px dashed var(--coral)', borderRadius: 6, padding: '2px 8px', opacity: 0.8 }}>
          🚧 아래 필터는 UI 전용입니다 — 아직 서버와 연동되지 않았습니다
        </span>
      </div>
      {row('성별',   'gender',     GENDER_OPTIONS)}
      {row('나이',   'age',        AGE_OPTIONS)}
      {row('지역',   'region',     REGION_OPTIONS)}
      {row('과목',   'subject',    SUBJECT_OPTIONS)}
      {row('대학',   'university', UNIVERSITY_OPTIONS)}

      {hasActive && (
        <div className="filter-chip-row">
          <button className="filter-reset-chip" onClick={onReset}>↺ 필터 초기화</button>
        </div>
      )}
    </div>
  )
}
