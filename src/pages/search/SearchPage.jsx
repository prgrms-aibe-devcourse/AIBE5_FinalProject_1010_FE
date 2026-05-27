/**
 * @file SearchPage.jsx
 * @description 수업/선생님/학생 찾기 검색 페이지입니다.
 * - 상단 검색창과 모드 토글, 좌측 필터, 우측 결과 리스트를 조합합니다.
 * - 현재는 더미 강의 데이터를 그대로 렌더링합니다.
 */
import { useState } from 'react'
import { courses } from '../../data/courses.js'
import FilterPanel from './FilterPanel.jsx'
import CourseCard from './CourseCard.jsx'

/**
 * 수업 검색 / 추천 페이지.
 * - 상단 모드 토글 (강의/선생님/학생 찾기) + 검색창 + 인기 검색 칩
 * - 좌측 필터 패널
 * - 우측 AI 추천 배너 + 결과 카드 그리드 + 페이지네이션
 */
export default function SearchPage() {
  // 검색 모드 상태입니다. 현재는 active 스타일만 바꾸며,
  // 추후 mode 값에 따라 API endpoint나 검색 파라미터를 달리 보내면 됩니다.
  const [mode, setMode] = useState('course')

  return (
    <>
      <section className="search-hero">
        <div className="search-hero-inner">
          <span className="eyebrow coral">🔎 검색 & 추천</span>
          <h1>나에게 맞는 수업을 <span className="hand">찾아봐요</span></h1>
          <p>원하는 분야와 조건을 선택하면 딱 맞는 선생님을 추천해드려요</p>

          <div className="search-box">
            <div className="mode-toggle">
              <button className={mode === 'course' ? 'active' : ''} onClick={() => setMode('course')}>강의 찾기</button>
              <button className={mode === 'teacher' ? 'active' : ''} onClick={() => setMode('teacher')}>선생님 찾기</button>
              <button className={mode === 'student' ? 'active' : ''} onClick={() => setMode('student')}>학생 찾기</button>
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
        <FilterPanel />

        <main>
          <div className="ai-banner">
            <div className="ai-icon">✨</div>
            <div>
              <h3>AI가 추천하는 <span className="hand">맞춤 강의</span></h3>
              <p>학습 이력과 관심 분야를 분석해 가장 잘 맞는 선생님을 찾아드려요</p>
            </div>
            <button>AI 추천 받기 →</button>
          </div>

          <div className="result-header">
            <div className="result-count">총 <strong>1,284개</strong>의 강의를 찾았어요</div>
            <select className="sort-select">
              <option>인기순</option><option>최신순</option><option>평점 높은순</option>
              <option>수강생 많은순</option><option>가격 낮은순</option>
            </select>
          </div>

          <div className="results-grid">
            {/* courses.js의 더미 데이터를 카드 컴포넌트로 반복 렌더링합니다. */}
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
        </main>
      </div>
    </>
  )
}
