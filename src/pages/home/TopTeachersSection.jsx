/**
 * @file TopTeachersSection.jsx
 * @description 이번 주 HOT 선생님 TOP3 섹션입니다.
 * - 백엔드 /api/v1/teachers/hot로 지난 7일 내공 획득 상위 선생님을 불러옵니다.
 * - 주간 획득자가 3명 미만이면 백엔드가 전체기간 내공순으로 채워 항상 최대 3명을 반환합니다.
 * - 카드를 누르면 해당 선생님 상세 페이지로 이동합니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchHotTeachers } from '../../api/teacherApi.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import Avatar from '../../components/ui/Avatar.jsx'

const RANK_BADGE = { 1: '🥇 1위', 2: '🥈 2위', 3: '🥉 3위' }

export default function TopTeachersSection() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchHotTeachers()
      .then((list) => {
        if (active) setTeachers(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (active) setTeachers([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="section">
      <div className="container">
        <div className="row-header">
          <div>
            <span className="eyebrow yellow">🏆 HOT TEACHERS</span>
            <h2 className="section-title">이번 주 <span className="hand">인기 쌤</span></h2>
          </div>
          <Link to="/teachers" className="btn btn-secondary btn-sm">전체 →</Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', padding: '24px 0' }}>인기 선생님을 불러오는 중…</p>
        ) : teachers.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', padding: '24px 0' }}>
            이번 주 활동 데이터를 모으는 중이에요.
          </p>
        ) : (
          <div className="teachers-grid">
            {teachers.map((t) => {
              const imageUrl = t.profileImageUrl ? toAbsoluteFileUrl(t.profileImageUrl) : null
              return (
                <Link to={`/teachers/${t.teacherProfileId}`} className="teacher-card" key={t.teacherProfileId}>
                  <span className="rank">{RANK_BADGE[t.rank] ?? `${t.rank}위`}</span>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={t.name}
                      className="avatar xl"
                      style={{ margin: '0 auto', objectFit: 'cover' }}
                    />
                  ) : (
                    <Avatar size="xl" color={`c${((t.teacherProfileId ?? 0) % 6) + 1}`} style={{ margin: '0 auto' }}>
                      {(t.name ?? '?').trim().charAt(0)}
                    </Avatar>
                  )}
                  <div className="name">{t.name} 선생님</div>
                  {t.subject && <div className="subject">{t.subject}</div>}
                  <div className="hot-naegong">
                    🔥 이번 주 내공 <strong>+{t.weeklyNaegongGain.toLocaleString('ko-KR')}</strong>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
