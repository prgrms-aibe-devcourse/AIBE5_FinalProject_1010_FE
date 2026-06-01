import { useState } from 'react'

const SUBJECT_FILTERS = ['전체', '수학', '영어', '국어', '과학', '사회', '코딩']
const GRADE_FILTERS = ['전체', '초등', '중등', '고등', '성인']
const SORT_OPTIONS = ['추천순', '평점순', '최신순', '가격순']

export default function HorizontalFilterBar({ mode }) {
  const [subject, setSubject] = useState('전체')
  const [grade, setGrade] = useState('전체')
  const [sort, setSort] = useState('추천순')

  return (
    <div className="h-filter-bar">
      <div className="h-filter-row">
        <span className="h-filter-label">과목</span>
        <div className="h-filter-chips">
          {SUBJECT_FILTERS.map((opt) => (
            <button
              key={opt}
              className={`h-chip${subject === opt ? ' active' : ''}`}
              onClick={() => setSubject(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="h-filter-row">
        <span className="h-filter-label">학년</span>
        <div className="h-filter-chips">
          {GRADE_FILTERS.map((opt) => (
            <button
              key={opt}
              className={`h-chip${grade === opt ? ' active' : ''}`}
              onClick={() => setGrade(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="h-filter-row">
        <span className="h-filter-label">정렬</span>
        <div className="h-filter-chips">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`h-chip sort${sort === opt ? ' active' : ''}`}
              onClick={() => setSort(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
