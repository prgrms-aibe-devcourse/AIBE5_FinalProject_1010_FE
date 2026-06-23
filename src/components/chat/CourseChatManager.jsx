import { useEffect, useMemo, useState } from 'react'
import Avatar from '../ui/Avatar.jsx'
import {
  createCourseGroupRoom,
  fetchCourseStudents,
  fetchMyTeacherCourses,
  inviteCourseGroupStudents,
  removeCourseGroupStudent,
} from '../../api/chatApi.js'
import { avatarColor, initialOf } from '../../api/chatMappers.js'

export default function CourseChatManager({
  open,
  mode = 'create',
  room = null,
  onClose,
  onCreated,
  onChanged,
}) {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState(room?.courseId || '')
  const [students, setStudents] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const isManage = mode === 'manage'
  const participantIds = useMemo(
    () => new Set((room?.participants || []).filter((p) => p.participantType === 'STUDENT').map((p) => p.userId)),
    [room],
  )

  useEffect(() => {
    if (!open) return undefined
    setError('')
    setStudents([])
    setSelectedIds(new Set())

    if (isManage) {
      setCourseId(room?.courseId || '')
      return undefined
    }

    let cancelled = false
    setLoading(true)
    fetchMyTeacherCourses({ status: 'RECRUITING', size: 100 })
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : data?.content || []
        setCourses(list)
        setCourseId((prev) => prev || list[0]?.id || '')
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '수업 목록을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [open, isManage, room?.courseId])

  useEffect(() => {
    if (!open || !courseId) return undefined
    let cancelled = false
    setLoading(true)
    fetchCourseStudents(courseId)
      .then((list) => {
        if (cancelled) return
        const nextStudents = Array.isArray(list) ? list : []
        setStudents(nextStudents)
        if (!isManage) {
          setSelectedIds(new Set(nextStudents.map((student) => student.userId)))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '수강생 목록을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [open, courseId, isManage])

  if (!open) return null

  const selectedCourse = courses.find((course) => String(course.id) === String(courseId))

  const toggleStudent = (studentId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const handleCreate = async () => {
    if (!courseId) {
      setError('수업을 선택해 주세요.')
      return
    }
    setBusyId('create')
    setError('')
    try {
      const created = await createCourseGroupRoom({
        courseId: Number(courseId),
        studentIds: Array.from(selectedIds),
      })
      onCreated?.(created)
    } catch (err) {
      setError(err?.message || '수업톡을 만들지 못했어요.')
    } finally {
      setBusyId(null)
    }
  }

  const handleInvite = async (studentId) => {
    setBusyId(`invite-${studentId}`)
    setError('')
    try {
      const updated = await inviteCourseGroupStudents(room.id, [studentId])
      onChanged?.(updated)
    } catch (err) {
      setError(err?.message || '학생을 초대하지 못했어요.')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (studentId) => {
    setBusyId(`remove-${studentId}`)
    setError('')
    try {
      const updated = await removeCourseGroupStudent(room.id, studentId)
      onChanged?.(updated)
    } catch (err) {
      setError(err?.message || '학생을 내보내지 못했어요.')
    } finally {
      setBusyId(null)
    }
  }

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

        <div className="cw-course-summary">
          <b>{isManage ? room?.courseTitle || room?.name : selectedCourse?.title || '수업을 선택하세요'}</b>
          <small>{loading ? '불러오는 중...' : `수강생 ${students.length}명`}</small>
        </div>

        {error && <div className="cw-course-error">{error}</div>}

        <div className="cw-course-students">
          {!loading && students.length === 0 && (
            <p className="cw-course-empty">초대할 수강생이 없습니다.</p>
          )}

          {students.map((student) => {
            const inRoom = participantIds.has(student.userId)
            const checked = selectedIds.has(student.userId)
            const busyInvite = busyId === `invite-${student.userId}`
            const busyRemove = busyId === `remove-${student.userId}`

            return (
              <div key={student.userId} className="cw-course-student">
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
                      onClick={() => handleRemove(student.userId)}
                    >
                      {busyRemove ? '처리 중' : '내보내기'}
                    </button>
                  ) : (
                    <button
                      className="cw-course-small-btn"
                      type="button"
                      disabled={busyInvite}
                      onClick={() => handleInvite(student.userId)}
                    >
                      {busyInvite ? '초대 중' : '초대'}
                    </button>
                  )
                ) : (
                  <label className="cw-course-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudent(student.userId)}
                    />
                    <span>초대</span>
                  </label>
                )}
              </div>
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
