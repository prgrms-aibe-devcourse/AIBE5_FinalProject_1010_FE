/**
 * @file CourseCard.jsx
 * @description 강의 검색 결과 카드입니다.
 * - 백엔드 CourseCardResponse DTO 필드를 그대로 받아 렌더링합니다.
 */
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'

const BG_CLASSES = ['bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'bg6']
const AVATAR_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']

const GRADE_LABEL = {
  ELEMENTARY_1: '초등 1', ELEMENTARY_2: '초등 2', ELEMENTARY_3: '초등 3',
  ELEMENTARY_4: '초등 4', ELEMENTARY_5: '초등 5', ELEMENTARY_6: '초등 6',
  MIDDLE_1: '중등 1', MIDDLE_2: '중등 2', MIDDLE_3: '중등 3',
  HIGH_1: '고등 1', HIGH_2: '고등 2', HIGH_3: '고등 3',
  N_SU: 'N수생',
}

const STATUS_META = {
  RECRUITING:  { label: '모집 중',  variant: 'mint'   },
  IN_PROGRESS: { label: '수강 중',  variant: 'butter' },
}

export default function CourseCard({ course }) {
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
  const spotsLeft   = maxStudents - currentStudents

  return (
    <article className="course-card">
      {/* 썸네일 */}
      <div className={`course-thumb ${bg}`}>
        {statusMeta && (
          <Badge variant={statusMeta.variant} style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
            {statusMeta.label}
          </Badge>
        )}
        {thumbnailUrl
          ? <img src={thumbnailUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div className="display">
              {subjectName}
              <span className="hand">{gradeLabel}</span>
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

        <div className="course-title">{title}</div>

        <div className="course-teacher">
          {teacherProfileImageUrl
            ? <img src={teacherProfileImageUrl} alt={teacherName}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #1F2937' }} />
            : <Avatar size="sm" color={avatarColor}>{teacherName?.[0]}</Avatar>
          }
          <div className="course-teacher-info">
            <div className="name">{teacherName} 선생님</div>
            <div className="school">
              잔여 {spotsLeft < 0 ? 0 : spotsLeft}석 · 최대 {maxStudents}명
            </div>
          </div>
        </div>

        <div className="course-stats">
          <div className="rating">
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
              수강 {currentStudents}명
            </span>
          </div>
          <div className="price">
            <span>{pricePerSession.toLocaleString()}원</span>
            <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 500 }}> /1회</span>
          </div>
        </div>
      </div>
    </article>
  )
}
