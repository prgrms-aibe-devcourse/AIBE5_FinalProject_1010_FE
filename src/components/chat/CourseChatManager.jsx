import CourseChatStudentRow from './CourseChatStudentRow.jsx'
import CourseChatSummary from './CourseChatSummary.jsx'
import useCourseChatManager from './useCourseChatManager.js'

export default function CourseChatManager({
  open,
  mode = 'create',
  room = null,
  onClose,
  onCreated,
  onChanged,
}) {
  const {
    busyId,
    courseId,
    courses,
    error,
    handleCreate,
    handleInvite,
    handleRemove,
    isManage,
    loading,
    participantIds,
    selectedCourse,
    selectedIds,
    setCourseId,
    students,
    toggleStudent,
  } = useCourseChatManager({ open, mode, room, onCreated, onChanged })

  if (!open) return null

  return (
    <div className="cw-course-modal" role="dialog" aria-label={isManage ? '수업톡 참여자 관리' : '수업톡 만들기'}>
      <div className="cw-course-card">
        <div className="cw-course-head">
          <div>
            <strong>{isManage ? '수업톡 참여자 관리' : '수업톡 만들기'}</strong>
            <span>{isManage ? room?.name : '담당 수업의 수강생을 단체톡으로 초대합니다.'}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기">×</button>
        </div>

        {!isManage && (
          <label className="cw-course-field">
            <span>수업 선택</span>
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              {courses.length === 0 && <option value="">수업 없음</option>}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <CourseChatSummary
          isManage={isManage}
          loading={loading}
          room={room}
          selectedCourse={selectedCourse}
          studentCount={students.length}
        />

        {error && <div className="cw-course-error">{error}</div>}

        <div className="cw-course-students">
          {!loading && students.length === 0 && (
            <p className="cw-course-empty">초대할 수강생이 없습니다.</p>
          )}

          {students.map((student) => {
            const inRoom = participantIds.has(student.userId)
            return (
              <CourseChatStudentRow
                key={student.userId}
                busyId={busyId}
                checked={selectedIds.has(student.userId)}
                inRoom={inRoom}
                isManage={isManage}
                onInvite={handleInvite}
                onRemove={handleRemove}
                onToggle={toggleStudent}
                student={student}
              />
            )
          })}
        </div>

        {!isManage && (
          <button
            className="cw-course-submit"
            type="button"
            disabled={busyId === 'create' || !courseId}
            onClick={handleCreate}
          >
            {busyId === 'create' ? '만드는 중...' : '수업톡 열기'}
          </button>
        )}
      </div>
    </div>
  )
}
