import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../../api/config.js'
import { createDirectRoom } from '../../api/chatApi.js'
import { getCurrentUserId, getCurrentUserRole } from '../../auth/currentUser.js'
import TeacherHero         from './components/TeacherHero.jsx'
import TeacherIntroBlock   from './components/TeacherIntroBlock.jsx'
import TeacherCoursesBlock from './components/TeacherCoursesBlock.jsx'
import TeacherSidebar      from './components/TeacherSidebar.jsx'

export default function TeacherDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [teacher, setTeacher]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [isScrapped, setIsScrapped] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(false)
    fetch(`${API_BASE}/api/v1/teachers/${id}`)
      .then(res => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then(data => { if (!cancelled) setTeacher(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div className="td-page"><div className="teacher-loading">선생님 정보를 불러오는 중...</div></div>

  if (error || !teacher) {
    return (
      <div className="td-page">
        <button className="teacher-detail__back" onClick={() => navigate(-1)}>← 돌아가기</button>
        <div className="teacher-empty">
          <p>선생님 정보를 불러올 수 없어요</p>
        </div>
      </div>
    )
  }

  const courses = teacher.courses ?? []

  async function handleInquiry() {
    const myId   = getCurrentUserId()
    const myRole = getCurrentUserRole()
    if (!myId)              { alert('로그인이 필요합니다.'); return }
    if (myRole !== 'STUDENT') { alert('학생 계정으로만 문의할 수 있습니다.'); return }
    if (!teacher.userId)    { alert('선생님 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return }
    try {
      const room = await createDirectRoom({ teacherId: teacher.userId, studentId: myId })
      window.dispatchEvent(new CustomEvent('chat:openRoom', { detail: { roomId: room.roomId } }))
    } catch (e) {
      alert(e.message || '채팅방을 열 수 없습니다.')
    }
  }

  return (
    <div className="td-page">
      <nav className="td-crumb">
        <button onClick={() => navigate('/teachers')}>선생님 찾기</button>
        <span>›</span>
        <span>{teacher.name} 선생님</span>
      </nav>

      <TeacherHero
        teacher={teacher}
        id={id}
        isScrapped={isScrapped}
        onScrap={() => setIsScrapped(prev => !prev)}
        onInquiry={handleInquiry}
      />

      <div className="td-detail">
        <div>
          <TeacherIntroBlock teacher={teacher} />
          <TeacherCoursesBlock courses={courses} />
        </div>
        <TeacherSidebar teacher={teacher} courseCount={courses.length} />
      </div>
    </div>
  )
}
