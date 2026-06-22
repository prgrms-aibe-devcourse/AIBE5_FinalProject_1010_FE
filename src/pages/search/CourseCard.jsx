import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { GRADE_LABEL, TEACHING_MODE_SHORT } from '../../utils/labels.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { MonitorIcon, LocationPinIcon, ClockIcon, PeopleIcon, CalendarIcon, VerifiedBadgeIcon } from '../../components/icons/SearchIcons.jsx'

const AVATAR_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']




// 모집 마감일 → D-day 정보. urgent(3일 이내)면 빨강 강조, over면 마감 처리
function getDday(deadline) {
  if (!deadline) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  // "2025-06-20" 형태 문자열은 UTC로 파싱되어 한국(UTC+9)에서 날짜가 1일 어긋남.
  // 로컬 시간 기준으로 파싱하기 위해 T00:00:00 접미사 추가.
  const target = new Date(deadline + 'T00:00:00'); target.setHours(0, 0, 0, 0)
  if (Number.isNaN(target.getTime())) return null
  const diff = Math.round((target - today) / 86400000)
  if (diff < 0)  return { label: '모집 마감', over: true }
  if (diff === 0) return { label: '오늘 마감', urgent: true }
  return { label: `D-${diff}`, urgent: diff <= 3 }
}

export default function CourseCard({ course }) {
  const navigate = useNavigate()
  const {
    id, title,
    teacherName, teacherProfileImageUrl, teacherVerified,
    subjectName, targetGrade,
    teachingMode, location,
    durationMinutes, recruitDeadline,
    pricePerSession, maxStudents, currentStudents,
    distanceKm,
  } = course

  const avatarColor = AVATAR_COLORS[(teacherName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
  const gradeLabel  = GRADE_LABEL[targetGrade] ?? targetGrade
  const spotsLeft   = Math.max(0, maxStudents - currentStudents)
  const groupLabel  = maxStudents <= 1 ? '1:1 개인' : maxStudents <= 6 ? '소그룹' : '대그룹'

  // 학년 칩 색상 계열 — 같은 파랑 계열 내에서 학교급별 미세 차이
  const gradeClass = targetGrade?.startsWith('ELEMENTARY') ? 'lc-grade--elem'
    : targetGrade?.startsWith('MIDDLE') ? 'lc-grade--mid'
    : targetGrade?.startsWith('HIGH')   ? 'lc-grade--high'
    : 'lc-grade--nsu'
  // 형태 칩 색상 계열 — 같은 보라 계열 내에서 인원 규모별 미세 차이
  const groupClass = maxStudents <= 1 ? 'lc-group--solo'
    : maxStudents <= 6 ? 'lc-group--small' : 'lc-group--large'
  const isFree      = !pricePerSession
  const isOffline   = teachingMode === 'OFFLINE'
  const dday        = getDday(recruitDeadline)
  const almostFull  = spotsLeft > 0 && spotsLeft <= 2

  // 대면 수업 장소 표기 (전체 주소). 없으면 생략
  const regionText = isOffline ? (location || null) : null

  return (
    <article className="lc-card" onClick={() => navigate(`/courses/${id}`)}>

      {/* 본문 */}
      <div className="lc-body">
        <div className="lc-meta">
          <Badge variant={`lc-grade ${gradeClass}`}>{gradeLabel}</Badge>
          <Badge variant={`lc-group ${groupClass}`}>{groupLabel}</Badge>
          <span className={`lc-mode${isOffline ? ' lc-mode--offline' : ''}`}>
            {isOffline
              ? <><LocationPinIcon size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{TEACHING_MODE_SHORT.OFFLINE}</>
              : <><MonitorIcon size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{TEACHING_MODE_SHORT.ONLINE}</>
            }
          </span>
          {regionText && <span className="lc-region">{regionText}</span>}
          {distanceKm != null && (
            <span className="lc-distance" title="내 위치에서의 거리">
              <LocationPinIcon size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm}km`}
            </span>
          )}
        </div>

        <div className="lc-titlerow">
          {subjectName && <span className="lc-subject">{subjectName}</span>}
          <h3 className="lc-title">{title}</h3>
        </div>

        <div className="lc-teacher">
          <div className="lc-teacher__info">
            {teacherProfileImageUrl
              ? <img src={toAbsoluteFileUrl(teacherProfileImageUrl)} alt={teacherName} className="lc-teacher__avatar" />
              : <Avatar size="sm" color={avatarColor}>{teacherName?.[0]}</Avatar>
            }
            <span className="lc-teacher__name">{teacherName} 선생님</span>
            {teacherVerified && (
              <span className="tc-verified-badge lc-teacher__verified" aria-label="인증 선생님">
                <VerifiedBadgeIcon size={14} />
              </span>
            )}
          </div>

          <div className="lc-subline">
            {dday && (
              <span className={`lc-dday${dday.urgent ? ' lc-dday--urgent' : ''}${dday.over ? ' lc-dday--over' : ''}`}>
                <CalendarIcon size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                {dday.label}
              </span>
            )}
            {durationMinutes > 0 && (
              <span className="lc-subline__item">
                <ClockIcon size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                1회 {durationMinutes}분
              </span>
            )}
            <span className="lc-subline__item">
              <PeopleIcon size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              수강 {currentStudents}/{maxStudents}명
            </span>
          </div>
        </div>
      </div>

      {/* 우측 가격/모집 */}
      <div className="lc-aside">
        <div className={`lc-price${isFree ? ' lc-price--free' : ''}`}>
          {isFree ? '무료' : <>{pricePerSession.toLocaleString()}<small>원/1회</small></>}
        </div>
        <div className={`lc-spots${almostFull ? ' lc-spots--urgent' : ''}`}>
          {spotsLeft > 0 ? `잔여 ${spotsLeft}석` : '모집 마감'}
        </div>
        <span className="lc-aside__cta">자세히 보기 →</span>
      </div>
    </article>
  )
}
