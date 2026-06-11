import { useNavigate } from 'react-router-dom'
import { toAbsoluteFileUrl } from '../../../api/fileApi.js'

const AVATAR_BG    = ['var(--peach)', 'var(--sky)', 'var(--yellow)', 'var(--teal-light)', 'var(--lavender)', 'var(--coral)']
const AVATAR_COLOR = ['var(--ink)',   'var(--ink)', 'var(--ink)',    'var(--ink)',         'var(--ink)',       'white']

export default function CourseTeacherBlock({ teacher }) {
  const navigate = useNavigate()
  if (!teacher) return null

  const avatarIdx   = Number(teacher.teacherProfileId ?? 0) % AVATAR_BG.length
  const avatarStyle = { background: AVATAR_BG[avatarIdx], color: AVATAR_COLOR[avatarIdx], fontSize: 26, fontWeight: 900 }

  return (
    <div className="cd-block">
      <h2 className="cd-block__title">선생님 정보</h2>
      <div className="cd-teacher-row">
        <div className="cd-teacher-left">
          {teacher.profileImageUrl ? (
            <img
              src={toAbsoluteFileUrl(teacher.profileImageUrl)}
              alt={teacher.name}
              className="cd-teacher-avatar"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="cd-teacher-avatar" style={avatarStyle}>
              {teacher.name?.[0] ?? '선'}
            </div>
          )}
          <div className="cd-teacher-info">
            <div className="cd-teacher-name">
              {teacher.name ?? '선생님'} 선생님
            </div>
            <div className="cd-teacher-intro">
              {teacher.education
                ? teacher.education + (teacher.career ? ` · ${teacher.career.split('\n')[0]}` : '')
                : '검증된 선생님 · 1:1 맞춤 수업'}
            </div>
            <div className="cd-teacher-stats">
              {teacher.rating != null && <>
                <span><b style={{ color: 'var(--coral)' }}>★ {teacher.rating.toFixed(1)}</b> <em>평점</em></span>
                <span className="cd-stats-div">|</span>
              </>}
              {teacher.studentCount != null && <>
                <span><b>{teacher.studentCount.toLocaleString('ko-KR')}명</b> <em>수강생</em></span>
                <span className="cd-stats-div">|</span>
              </>}
              <span><b style={{ color: 'var(--teal-dark)' }}>
                내공 {teacher.naegongScore != null ? teacher.naegongScore.toLocaleString('ko-KR') : 0}
              </b></span>
            </div>
          </div>
        </div>
        {teacher.teacherProfileId && (
          <button className="cd-link-btn" onClick={() => navigate(`/teachers/${teacher.teacherProfileId}`)}>
            프로필 자세히 →
          </button>
        )}
      </div>
    </div>
  )
}
