import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL, REQUEST_STATUS_LABEL } from '../../../utils/labels.js'
import { avatarBg } from '../../../utils/avatarColor.js'


export default function StudentDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state ?? {}

  const student           = state.student           ?? {}
  const courseTitle       = state.courseTitle       ?? null
  const requestId         = state.requestId         ?? null
  const message           = state.message           ?? null
  const preferredSchedule = state.preferredSchedule ?? null
  const createdAt         = state.createdAt         ?? null

  const [status, setStatus] = useState(state.status ?? null)

  const name  = student.name  ?? '학생'
  const grade = student.grade ? (GRADE_LABEL[student.grade] ?? student.grade) : null
  const region = student.region ?? null

  const introduction = student.introduction ?? null

  // 확장 가능한 학생 정보 rows — API 연동 후 실제 필드 채워질 예정
  const INFO_ROWS = [
    { label: '학년',         value: grade },
    { label: '지역',         value: region },
    { label: '학습 목표',    value: student.goal             ?? null },
    { label: '관심 과목',    value: student.interestedSubjects ?? null },
    { label: '목표 대학',    value: student.targetUniversity  ?? null },
    { label: '학습 스타일',  value: student.learningStyle     ?? null },
  ].filter(r => r.value)

  const accept = async () => {
    if (!requestId) return
    try {
      const res = await authFetch(`${API_BASE}/api/v1/enrollment-requests/${requestId}/accept`, { method: 'PATCH' })
      if (!res.ok) throw new Error(res.status)
      setStatus('ACCEPTED')
    } catch {
      alert('수락에 실패했어요. 다시 시도해주세요.')
    }
  }

  const reject = async () => {
    if (!requestId) return
    if (!window.confirm('이 신청을 거절할까요?')) return
    try {
      const res = await authFetch(`${API_BASE}/api/v1/enrollment-requests/${requestId}/reject`, { method: 'PATCH' })
      if (!res.ok) throw new Error(res.status)
      setStatus('REJECTED')
    } catch {
      alert('거절에 실패했어요. 다시 시도해주세요.')
    }
  }

  return (
    <div className="mp-std-page">

      <nav className="mp-std-crumb">
        <button onClick={() => navigate('/mypage')}>마이페이지</button>
        <span className="mp-std-crumb__sep">›</span>
        <button onClick={() => navigate(-1)}>수강 신청 목록</button>
        <span className="mp-std-crumb__sep">›</span>
        <span>{name} 학생</span>
      </nav>

      {/* 프로필 카드 — 이름 · 상태 · 신청 수업 · 신청일 */}
      <div className="mp-block">
        <div className="mp-std-profile-head">
          <div className="mp-std-profile">
            <div className="mp-req-avatar mp-std-avatar" style={{ background: avatarBg(name) }}>
              {name[0]}
            </div>
            <div className="mp-std-profile-info">
              <h1 className="mp-std-name">{name} 학생</h1>
              <p className="mp-std-sub">
                {[grade, region].filter(Boolean).join(' · ') || '정보 없음'}
              </p>
            </div>
          </div>
          {status && (
            <span className={`mp-req-status ${status}`}>
              {REQUEST_STATUS_LABEL[status] ?? status}
            </span>
          )}
        </div>

        {(courseTitle || createdAt) && (
          <div className="mp-std-meta-row">
            {courseTitle && (
              <div className="mp-std-meta-badge">
                <span className="mp-std-meta-label">신청 수업</span>
                <span className="mp-std-meta-value">{courseTitle}</span>
              </div>
            )}
            {createdAt && (
              <div className="mp-std-meta-badge">
                <span className="mp-std-meta-label">신청일</span>
                <span className="mp-std-meta-value">
                  {new Date(createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 학생 정보 — 학년/지역/목표 + 향후 확장 필드 */}
      <div className="mp-block">
        <h2 className="mp-block-title">학생 정보</h2>
        {INFO_ROWS.length > 0 ? (
          <dl className="mp-detail-kv">
            {INFO_ROWS.map(({ label, value }) => (
              <div className="mp-detail-kv__row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mp-detail-empty-text">등록된 학생 정보가 없습니다.</p>
        )}
      </div>

      {/* 자기소개 */}
      <div className="mp-block">
        <h2 className="mp-block-title">자기소개</h2>
        {introduction
          ? <p className="mp-req-msg mp-std-intro">{introduction}</p>
          : <p className="mp-detail-empty-text">등록된 자기소개가 없습니다.</p>
        }
      </div>

      {/* 신청 정보 + 수락/거절 버튼 */}
      <div className="mp-block">
        <h2 className="mp-block-title">신청 정보</h2>

        {preferredSchedule && (
          <dl className="mp-detail-kv">
            <div className="mp-detail-kv__row">
              <dt>희망 수업 시간</dt>
              <dd>{preferredSchedule}</dd>
            </div>
          </dl>
        )}

        {message && (
          <div className="mp-std-message-block">
            <p className="mp-std-message-label">신청 메시지</p>
            <p className="mp-req-msg">{message}</p>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="mp-std-actions">
            <button className="btn btn-secondary" onClick={reject}>거절</button>
            <button className="btn btn-primary"   onClick={accept}>수락</button>
          </div>
        )}
      </div>

    </div>
  )
}
