import Avatar from '../ui/Avatar.jsx'
import { avatarColor, initialOf } from '../../api/chatMappers.js'

export default function CourseChatStudentRow({
  busyId,
  checked,
  inRoom,
  isManage,
  onInvite,
  onRemove,
  onToggle,
  student,
}) {
  const busyInvite = busyId === `invite-${student.userId}`
  const busyRemove = busyId === `remove-${student.userId}`

  return (
    <div className="cw-course-student">
      <Avatar size="sm" color={avatarColor(student.userId)}>{initialOf(student.name)}</Avatar>
      <div className="cw-course-student-main">
        <strong>{student.name}</strong>
        <span>{inRoom ? '참여 중' : '미참여'}</span>
      </div>

      {isManage ? (
        inRoom ? (
          <button
            className="cw-course-small-btn is-danger"
            type="button"
            disabled={busyRemove}
            onClick={() => onRemove(student.userId)}
          >
            {busyRemove ? '처리 중' : '내보내기'}
          </button>
        ) : (
          <button
            className="cw-course-small-btn"
            type="button"
            disabled={busyInvite}
            onClick={() => onInvite(student.userId)}
          >
            {busyInvite ? '초대 중' : '초대'}
          </button>
        )
      ) : (
        <label className="cw-course-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggle(student.userId)}
          />
          <span>초대</span>
        </label>
      )}
    </div>
  )
}
