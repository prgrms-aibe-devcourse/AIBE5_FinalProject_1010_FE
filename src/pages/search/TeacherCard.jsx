/**
 * @file TeacherCard.jsx
 * @description 선생님 목록에 표시되는 강사 카드 하나를 담당합니다.
 * - teachers.js의 단일 선생님 객체를 data prop으로 받아 화면에 뿌립니다.
 * - 기존 CourseCard의 스타일 구조를 최대한 재사용하여 디자인 일관성을 높였습니다.
 */
import { useRef } from 'react'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import useMouseTilt from '../../hooks/useMouseTilt.js'

/**
 * 검색 결과 선생님 카드 1개.
 * data: teachers.js 의 단일 객체
 */
export default function TeacherCard({ data: t }) {
  const cardRef = useRef(null)

  // 마우스 3D 틸트 효과를 카드에 부여
  useMouseTilt(cardRef, { strength: 10 })

  // 배경 클래스를 id에 맞춰 분기 (bg1 ~ bg6)
  const bgClass = `bg${(t.id % 6) || 6}`

  return (
    <article
      ref={cardRef}
      className="course-card teacher-card"
      style={{ minHeight: '380px' }}
    >
      <div className={`course-thumb ${bgClass}`}>
        {/* 내공 포인트와 평점을 상단 배지로 노출 */}
        <span className="badge live tl">내공 {t.rank.toLocaleString()}</span>
        <span className="badge butter tr">★ {t.rating}</span>

        <div className="display">
          {t.subject}
          <span className="hand">{t.detailSubject}</span>
        </div>
      </div>

      <div className="course-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="course-meta">
          <Badge variant="peach">{t.subject} 강사</Badge>
          <Badge variant="mint">{t.years}년 경력</Badge>
          {t.tags && t.tags.slice(0, 1).map(tag => (
            <Badge key={tag} variant="sky">{tag}</Badge>
          ))}
        </div>

        <div className="course-title" style={{ fontSize: '18px', fontWeight: '900', marginBottom: '4px', height: 'auto' }}>
          {t.name} 선생님
        </div>
        
        <div className="teacher-school-detail" style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: '700', marginBottom: '8px' }}>
          {t.school}
        </div>

        <p className="teacher-intro" style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: '1.45', margin: '0 0 16px 0', height: '38px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {t.intro}
        </p>

        <div className="course-stats" style={{ marginTop: 'auto', borderTop: '1px dashed rgba(31, 41, 55, 0.1)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="rating" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink-soft)' }}>
            <span style={{ marginRight: '4px' }}>👤</span>누적 {t.students.toLocaleString()}명
          </div>

          <div className="price" style={{ fontSize: '13px', fontWeight: '800', color: 'var(--teal-dark)' }}>
            체험 수업 가능
          </div>
        </div>
      </div>
    </article>
  )
}
