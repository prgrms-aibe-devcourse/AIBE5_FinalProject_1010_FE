/**
 * @file LiveNowSection.jsx
 * @description 지금 진행 중인 라이브 수업을 보여주는 메인 페이지 섹션입니다.
 * - 백엔드 /api/v1/live-classrooms로 현재 OPEN 상태인 강의실을 불러옵니다.
 * - 카드를 누르면 비수강생도 30~60초 영상 미리보기(LivePreviewModal)에 진입합니다.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchLiveClassrooms } from '../../api/classroomApi.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { hasAccessToken } from '../../auth/tokenStore.js'
import Avatar from '../../components/ui/Avatar.jsx'
import LivePreviewModal from './LivePreviewModal.jsx'

export default function LiveNowSection() {
  const navigate = useNavigate()
  const [lives, setLives] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewSession, setPreviewSession] = useState(null)

  const handleCardClick = (session) => {
    if (!hasAccessToken()) {
      navigate('/login')
      return
    }
    setPreviewSession(session)
  }

  useEffect(() => {
    let active = true
    fetchLiveClassrooms()
      .then((list) => {
        if (active) setLives(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (active) setLives([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

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

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', padding: '24px 0' }}>진행 중인 수업을 불러오는 중…</p>
        ) : lives.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', padding: '24px 0' }}>
            지금 진행 중인 라이브 수업이 없어요. 잠시 후 다시 확인해 주세요!
          </p>
        ) : (
          <div className="live-grid">
            {lives.map((c, i) => {
              const imageUrl = c.teacherImageUrl ? toAbsoluteFileUrl(c.teacherImageUrl) : null
              return (
                <button
                  type="button"
                  className="live-card"
                  key={c.sessionId}
                  onClick={() => handleCardClick(c)}
                  title="클릭하면 미리보기"
                >
                  <div className="live-card__top">
                    <span className="live-badge-pill">● LIVE</span>
                    {c.subjectName && <span className="live-card__subject">{c.subjectName}</span>}
                  </div>
                  <div className="live-card__title">{c.courseTitle}</div>
                  <div className="live-card__footer">
                    <div className="live-card__teacher">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={c.teacherName}
                          className="avatar sm"
                          style={{ objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <Avatar size="sm" color={`c${((c.teacherProfileId ?? 0) % 6) + 1}`}>
                          {(c.teacherName ?? '?').trim().charAt(0)}
                        </Avatar>
                      )}
                      <span>{c.teacherName} 선생님</span>
                    </div>
                    <div className="live-card__viewers">
                      <span className="live-card__viewers-val">👥 {c.participantCount}</span>
                      <span className="live-card__viewers-lbl">참여중</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {previewSession && (
        <LivePreviewModal session={previewSession} onClose={() => setPreviewSession(null)} />
      )}
    </section>
  )
}
