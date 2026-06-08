import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { GRADE_LABEL } from '../../utils/labels.js'

const BG_CLASSES = ['bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'bg6']
const AVATAR_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']

const STATUS_META = {
  RECRUITING:  { label: '모집 중',  variant: 'mint'   },
  IN_PROGRESS: { label: '수강 중',  variant: 'butter' },
}

export default function CourseCard({ course }) {
  const navigate = useNavigate()
  const {
    id, title,
    teacherName, teacherProfileImageUrl,
    subjectName, targetGrade,
    pricePerSession, maxStudents, currentStudents,
    thumbnailUrl, status,
  } = course

  const bg          = BG_CLASSES[Number(id) % BG_CLASSES.length]
  const avatarColor = AVATAR_COLORS[Number(id) % AVATAR_COLORS.length]
  const gradeLabel  = GRADE_LABEL[targetGrade] ?? targetGrade
  const statusMeta  = STATUS_META[status]
  const spotsLeft = Math.max(0, maxStudents - currentStudents)
  const isFree    = pricePerSession === 0

  return (
    <article className="course-card" onClick={() => navigate(`/courses/${id}`)}>

      {/* 썸네일 */}
      <div className={`course-thumb ${bg}`}>
        {statusMeta && (
          <span className="course-badge-tl">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </span>
        )}
        {thumbnailUrl
          ? <img src={thumbnailUrl} alt={title} className="course-thumb-img" />
          : (
            <div className="course-thumb-display">
              <span className="course-thumb-subject">{subjectName}</span>
              <span className="course-thumb-grade">{gradeLabel}</span>
            </div>
          )
        }
      </div>

      {/* 본문 */}
      <div className="course-body">
        <div className="course-meta">
          <Badge variant="peach">{subjectName}</Badge>
          <Badge variant="sky">{gradeLabel}</Badge>
        </div>

        <p className="course-title">{title}</p>

        <div className="course-teacher">
          {teacherProfileImageUrl
            ? <img src={teacherProfileImageUrl} alt={teacherName} className="course-teacher-avatar" />
            : <Avatar size="sm" color={avatarColor}>{teacherName?.[0]}</Avatar>
          }
          <div>
            <div className="course-teacher-name">{teacherName} 선생님</div>
            <div className="course-teacher-spots">
              잔여 {spotsLeft}석 · 최대 {maxStudents}명
            </div>
          </div>
        </div>

        <div className="course-foot">
          <span className="course-students">수강 {currentStudents}명</span>
          <div className={`course-price${isFree ? ' course-price--free' : ''}`}>
            {isFree ? '무료' : `${pricePerSession.toLocaleString()}원`}
            {!isFree && <small> /1회</small>}
          </div>
        </div>
      </div>
    </article>
  )
}
