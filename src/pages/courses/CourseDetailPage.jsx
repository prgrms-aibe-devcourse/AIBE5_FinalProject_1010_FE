import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseDetail } from '../../api/courseApi.js'
import { createDirectRoom } from '../../api/chatApi.js'
import { getCurrentUserId, getCurrentUserRole } from '../../auth/currentUser.js'
import { GRADE_LABEL } from '../../utils/labels.js'
import CourseHero         from './components/CourseHero.jsx'
import CourseTeacherBlock from './components/CourseTeacherBlock.jsx'
import CourseInfoBlock    from './components/CourseInfoBlock.jsx'
import CourseCtaSidebar   from './components/CourseCtaSidebar.jsx'
import CourseApplyModal   from './components/CourseApplyModal.jsx'

export default function CourseDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [course, setCourse]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchCourseDetail(id)
      .then(data => { if (!cancelled) setCourse(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div className="cd-page"><div className="teacher-loading">수업 정보를 불러오는 중...</div></div>

  if (error || !course) {
    return (
      <div className="cd-page">
        <button className="teacher-detail__back" onClick={() => navigate(-1)}>← 돌아가기</button>
        <div className="teacher-empty">
          <p>수업 정보를 불러올 수 없어요</p>
        </div>
      </div>
    )
  }

  const { title, subjectName, targetGrade, durationMinutes, status, currentStudents, maxStudents,
          description, textbook, curriculumType, curriculumDetail,
          availableSchedule, startDate, endDate, teacher } = course

  const gradeLabel = GRADE_LABEL[targetGrade] ?? targetGrade
  const spotsLeft  = (maxStudents ?? 0) - (currentStudents ?? 0)
  const canApply   = status === 'RECRUITING' && spotsLeft > 0

  async function handleChat() {
    const myId   = getCurrentUserId()
    const myRole = getCurrentUserRole()
    if (!myId)                { alert('로그인이 필요합니다.'); return }
    if (myRole !== 'STUDENT') { alert('학생 계정으로만 문의할 수 있습니다.'); return }
    if (!teacher?.userId)     { alert('선생님 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return }
    try {
      const room = await createDirectRoom({ teacherId: teacher.userId, studentId: myId })
      window.dispatchEvent(new CustomEvent('chat:openRoom', { detail: { roomId: room.roomId } }))
    } catch (e) {
      alert(e.message || '채팅방을 열 수 없습니다.')
    }
  }

  return (
    <div className="cd-page">
      <nav className="cd-crumb">
        <button onClick={() => navigate('/courses')}>수업 찾기</button>
        <span>›</span>
        {subjectName && <><span>{subjectName}</span><span>›</span></>}
        <span>{title}</span>
      </nav>

      <div className="cd-layout">
        <div>
          <CourseHero
            title={title} subjectName={subjectName} gradeLabel={gradeLabel}
            durationMinutes={durationMinutes}
          />
          <CourseTeacherBlock teacher={teacher} />
          <CourseInfoBlock
            description={description} textbook={textbook}
            curriculumType={curriculumType} curriculumDetail={curriculumDetail}
            availableSchedule={availableSchedule} startDate={startDate}
            endDate={endDate} durationMinutes={durationMinutes}
            currentStudents={currentStudents} maxStudents={maxStudents}
          />
        </div>

        <CourseCtaSidebar
          course={course}
          canApply={canApply}
          onApply={() => setShowForm(true)}
          onChat={handleChat}
        />
      </div>

      {showForm && (
        <CourseApplyModal courseId={id} teacherName={teacher?.name} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
