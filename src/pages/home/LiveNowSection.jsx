/**
 * @file LiveNowSection.jsx
 * @description 현재 진행 중인 라이브 수업을 보여주는 메인 페이지 섹션입니다.
 * - liveClasses.js 데이터를 카드로 렌더링합니다.
 * - 실제 서비스에서는 실시간 강의 API 또는 WebSocket 상태와 연결할 수 있습니다.
 */
import { Link } from 'react-router-dom'
import { liveClasses } from '../../data/liveClasses.js'
import Avatar from '../../components/ui/Avatar.jsx'

/**
 * 지금 진행중인 LIVE 수업 4개 카드.
 */
export default function LiveNowSection() {
  return (
    <section className="live-section">
      <div className="container">
        <div className="row-header">
          <div>
            <span className="eyebrow coral">🔴 LIVE NOW</span>
            <h2 className="section-title">지금 <span className="hand">진행중</span>인 수업</h2>
          </div>
          <Link to="/courses" className="btn btn-secondary btn-sm">전체 →</Link>
        </div>
        <div className="live-grid">
          {/* liveClasses.js의 진행 중 수업 더미 데이터를 카드로 반복 출력합니다. */}
          {liveClasses.map((c) => (
            <div className="live-card" key={c.id}>
              <div className={`live-thumb ${c.bg}`}>
                <span className="badge live label">LIVE</span>
                <span className="viewers">👥 {c.viewers}</span>
                <div className="subject">
                  {c.subject}
                  <span className="hand">{c.hand}</span>
                </div>
              </div>
              <div className="live-body">
                <div className="live-title">{c.title}</div>
                <div className="live-teacher">
                  <Avatar size="sm" color={c.avatar}>{c.initial}</Avatar>
                  <span>{c.teacher} · {c.school}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
