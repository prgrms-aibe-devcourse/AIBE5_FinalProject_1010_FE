/**
 * @file TeacherResults.jsx
 * @description 선생님 찾기 탭에서 렌더링할 강사 그리드 컴포넌트입니다.
 * - IntersectionObserver를 이용한 부드러운 무한스크롤을 구현했습니다.
 * - 6개 단위 페이징 처리 및 지연(800ms) 가상 로더 효과를 제공합니다.
 */
import { useState, useEffect, useRef } from 'react'
import { teachers } from '../../data/teachers.js'
import TeacherCard from './TeacherCard.jsx'

export default function TeacherResults() {
  const [visibleTeachers, setVisibleTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  
  const observerTarget = useRef(null)
  const ITEMS_PER_PAGE = 6

  // 1. 초기 데이터 로드 (최초 6명)
  useEffect(() => {
    setVisibleTeachers(teachers.slice(0, ITEMS_PER_PAGE))
    if (teachers.length <= ITEMS_PER_PAGE) {
      setHasMore(false)
    }
  }, [])

  // 2. 가상 지연 로더를 수반한 데이터 연장 로드
  const loadMoreTeachers = () => {
    if (loading || !hasMore) return

    setLoading(true)

    // 0.8초 가상 API 응답 지연을 추가해 미려한 UX 로더 작동
    setTimeout(() => {
      const nextPage = page + 1
      const startIdx = page * ITEMS_PER_PAGE
      const endIdx = nextPage * ITEMS_PER_PAGE
      const nextBatch = teachers.slice(startIdx, endIdx)

      if (nextBatch.length > 0) {
        setVisibleTeachers((prev) => [...prev, ...nextBatch])
        setPage(nextPage)
      }

      if (endIdx >= teachers.length) {
        setHasMore(false)
      }

      setLoading(false)
    }, 800)
  }

  // 3. IntersectionObserver 감시 등록 및 교차 제어
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !loading) {
          loadMoreTeachers()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, page])

  return (
    <>
      <div className="results-grid">
        {visibleTeachers.map((t) => (
          <TeacherCard key={t.id} data={t} />
        ))}
      </div>

      {/* 무한스크롤 상태 정보 영역 */}
      <div className="infinite-scroll-status" style={{ textAlign: 'center', padding: '32px 24px', margin: '20px 0' }}>
        {loading && (
          <div className="infinite-loader" style={{ fontSize: '15px', fontStyle: 'normal', fontWeight: '800', color: 'var(--teal-dark)' }}>
            선생님을 불러오는 중...
          </div>
        )}
        {!hasMore && (
          <div className="infinite-done" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink-soft)' }}>
            🎉 모든 선생님을 확인했어요
          </div>
        )}
        {/* IntersectionObserver의 관찰 타겟 요소 */}
        {hasMore && <div ref={observerTarget} style={{ height: '10px', margin: '5px 0' }} />}
      </div>
    </>
  )
}
