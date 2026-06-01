import { useState } from 'react'
import { courses } from '../../data/courses.js'
import HorizontalFilterBar from './HorizontalFilterBar.jsx'
import CourseCard from './CourseCard.jsx'
import TeacherResults from './TeacherResults.jsx'

const HERO = {
  course: { h1: '나에게 맞는 수업을', p: '원하는 분야와 조건을 선택하면 딱 맞는 강의를 추천해드려요' },
  teacher: { h1: '나에게 맞는 선생님을', p: '학습 스타일과 목표에 맞는 최고의 선생님을 만나보세요' },
}

const BANNER = {
  course: { title: '맞춤 강의', desc: '학습 이력과 관심 분야를 분석해 가장 잘 맞는 강의를 찾아드려요' },
  teacher: { title: '맞춤 선생님', desc: '학습 스타일과 목표에 맞는 최적의 선생님을 AI가 분석해 추천해드려요' },
}

const RESULT = {
  course: { count: '1,284개', label: '의 강의를 찾았어요' },
  teacher: { count: '328명', label: '의 선생님을 찾았어요' },
}

const SORT_OPTIONS = {
  course: ['인기순', '최신순', '평점 높은순', '수강생 많은순', '가격 낮은순'],
  teacher: ['추천순', '평점 높은순', '수강생 많은순', '경력 많은순'],
}

export default function SearchPage() {
  const [mode, setMode] = useState('course')

  return (
    <>
      <section className="search-hero">
        <div className="search-hero-inner">
          <span className="eyebrow coral">🔎 검색 & 추천</span>
          <h1>{HERO[mode].h1} <span className="hand">찾아봐요</span></h1>
          <p>{HERO[mode].p}</p>

          <div className="search-box">
            <div className="mode-toggle">
              <button className={mode === 'course' ? 'active' : ''} onClick={() => setMode('course')}>강의 찾기</button>
              <button className={mode === 'teacher' ? 'active' : ''} onClick={() => setMode('teacher')}>선생님 찾기</button>
            </div>
            <input type="text" placeholder="과목, 학년, 학교 등을 입력하세요" />
            <button className="search-btn" aria-label="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>

          <div className="chips">
            <span>인기 검색:</span>
            {['수능 미적분', '중등 영문법', '코딩테스트', '토익 800+', '내신 화학'].map((p) => (
              <button key={p} className="chip"># {p}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="search-main">
        <HorizontalFilterBar mode={mode} />

        <main>
          <div className="ai-banner">
            <div className="ai-icon">✨</div>
            <div>
              <h3>AI가 추천하는 <span className="hand">{BANNER[mode].title}</span></h3>
              <p>{BANNER[mode].desc}</p>
            </div>
            <button>AI 추천 받기 →</button>
          </div>

          <div className="result-header">
            <div className="result-count">총 <strong>{RESULT[mode].count}</strong>{RESULT[mode].label}</div>
            <select className="sort-select">
              {SORT_OPTIONS[mode].map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          {mode === 'course' && (
            <>
              <div className="results-grid">
                {courses.map((c) => <CourseCard key={c.id} data={c} />)}
              </div>
              <div className="pagination">
                <div className="page-num">‹</div>
                <div className="page-num active">1</div>
                <div className="page-num">2</div>
                <div className="page-num">3</div>
                <div className="page-num">4</div>
                <div className="page-num">5</div>
                <div className="page-num">›</div>
              </div>
            </>
          )}

          {mode === 'teacher' && <TeacherResults />}
        </main>
      </div>
    </>
  )
}
