import { useEffect, useMemo, useState } from 'react'
import {
  createCourseGroupRoom,
  fetchCourseStudents,
  fetchMyTeacherCourses,
  inviteCourseGroupStudents,
  removeCourseGroupStudent,
} from '../../api/chatApi.js'

export default function useCourseChatManager({
  open,
  mode = 'create',
  room = null,
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

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === String(courseId)),
    [courses, courseId],
  )

  useEffect(() => {
    if (!open) return undefined
    setError('')
    setStudents([])
    setSelectedIds(new Set())

    // 관리 모드는 이미 열린 수업톡의 courseId를 기준으로 참여자만 다시 불러온다.
    if (isManage) {
      setCourseId(room?.courseId || '')
      return undefined
    }

    let cancelled = false
    setLoading(true)
    fetchMyTeacherCourses({ status: 'ACTIVE,RECRUITING', size: 100 })
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

        // 새 수업톡 생성 시에는 기본값으로 전체 수강생을 초대 대상으로 체크한다.
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
    if (!room?.id) return
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
    if (!room?.id) return
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

  return {
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
  }
}
