import { useState, useEffect, useRef } from 'react'
import { teachers } from '../../data/teachers.js'
import TeacherCard from './TeacherCard.jsx'

const PAGE_SIZE = 6

export default function TeacherResults() {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinelRef = useRef(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visible < teachers.length) {
          setVisible((prev) => Math.min(prev + PAGE_SIZE, teachers.length))
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  const isDone = visible >= teachers.length

  return (
    <>
      <div className="results-grid">
        {teachers.slice(0, visible).map((t) => (
          <TeacherCard key={t.id} data={t} />
        ))}
      </div>

      <div ref={sentinelRef} className="scroll-sentinel">
        {isDone ? (
          <div className="scroll-end">모든 선생님을 확인했어요 ✓</div>
        ) : (
          <div className="scroll-loading">불러오는 중...</div>
        )}
      </div>
    </>
  )
}
