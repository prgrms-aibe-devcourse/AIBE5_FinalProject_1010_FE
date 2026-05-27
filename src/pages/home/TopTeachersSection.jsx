/**
 * @file TopTeachersSection.jsx
 * @description 이번 주 인기 선생님 TOP 카드 섹션입니다.
 * - topTeachers 데이터를 사용하여 선생님 프로필과 통계를 보여줍니다.
 */
import { Link } from 'react-router-dom'
import { topTeachers } from '../../data/teachers.js'
import Avatar from '../../components/ui/Avatar.jsx'

/**
 * 이번 주 인기 선생님 TOP 4.
 */
export default function TopTeachersSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="row-header">
          <div>
            <span className="eyebrow yellow">🏆 TOP RATED</span>
            <h2 className="section-title">이번 주 <span className="hand">인기 쌤</span></h2>
          </div>
          <Link to="/search" className="btn btn-secondary btn-sm">전체 →</Link>
        </div>
        <div className="teachers-grid">
          {/* topTeachers.js의 랭킹 데이터를 카드로 반복 출력합니다. */}
          {topTeachers.map((t) => (
            <div className="teacher-card" key={t.id}>
              <span className="rank">{t.rank}</span>
              <Avatar size="xl" color={t.avatar} style={{ margin: '0 auto' }}>{t.initial}</Avatar>
              <div className="name">{t.name}</div>
              <div className="subject">{t.subject}</div>
              <div className="school">{t.school}</div>
              <div className="stats">
                <div><strong>{t.rating}</strong>평점</div>
                <div><strong>{t.students.toLocaleString()}</strong>수강생</div>
                <div><strong>{t.years}년</strong>경력</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
