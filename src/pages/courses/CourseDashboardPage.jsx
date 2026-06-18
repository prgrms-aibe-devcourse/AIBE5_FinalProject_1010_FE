import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchDashboard } from '../../api/dashboardApi.js'
import { getCurrentUserId, waitForTokenLoadingToFinish } from '../../auth/tokenStore.js'
import NoticeTab from './NoticeTab.jsx'
import BoardTab from './BoardTab.jsx'
import StudentsTab from './StudentsTab.jsx'
import HomeworkTab from './HomeworkTab.jsx'
import ProgressTab from './ProgressTab.jsx'
import CourseHero from './components/CourseHero.jsx'
import CourseSidebar from './components/CourseSidebar.jsx'
import { IcMegaphone, IcMessageSquare, IcClipboard, IcUsers, IcBarChart } from './components/DashboardIcons.jsx'

const TABS = [
  { key: 'notice',   label: '공지사항',   ic: <IcMegaphone /> },
  { key: 'board',    label: '자유 게시판', ic: <IcMessageSquare /> },
  { key: 'homework', label: '과제',        ic: <IcClipboard /> },
  { key: 'students', label: '수강생 목록', ic: <IcUsers /> },
  { key: 'progress', label: '수업 진도 현황', ic: <IcBarChart /> },
]

export default function CourseDashboardPage() {
  const { id: courseId } = useParams()
  const navigate = useNavigate()

  const [dashboard, setDashboard]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [activeTab, setActiveTab]     = useState('notice')
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    waitForTokenLoadingToFinish().then(() => {
      setCurrentUserId(getCurrentUserId())
    })
  }, [])

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchDashboard(courseId)
      .then((data) => { if (!cancelled) setDashboard(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId])

  if (loading) {
    return (
      <main className="page">
        <div className="container db-page">
          <div className="db-loading" style={{ paddingTop: 80 }}>수업 정보를 불러오는 중…</div>
        </div>
      </main>
    )
  }

  if (error || !dashboard) {
    return (
      <main className="page">
        <div className="container db-page" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ fontWeight: 700, color: 'var(--ink-soft)', marginTop: 12 }}>
            수업 정보를 불러오지 못했습니다.
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>
            수강 중인 수업이 아니거나 로그인이 필요합니다.
          </p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }} onClick={() => navigate(-1)}>
            ← 돌아가기
          </button>
        </div>
      </main>
    )
  }

  const isTeacher = currentUserId !== null && currentUserId === dashboard.teacherUserId

  return (
    <main className="page">
      <div className="container db-page">

        <CourseHero dashboard={dashboard} courseId={courseId} isTeacher={isTeacher} />

        <div className="db-layout">
          {/* LEFT: 탭 네비게이션 */}
          <nav className="db-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`db-tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="db-tab-btn__ic">{t.ic}</span>
                {t.label}
              </button>
            ))}
          </nav>

          {/* CENTER: 탭 콘텐츠 */}
          <section>
            {activeTab === 'notice' && (
              <NoticeTab courseId={courseId} isTeacher={isTeacher} />
            )}
            {activeTab === 'board' && (
              <BoardTab
                courseId={courseId}
                currentUserId={currentUserId}
                teacherUserId={dashboard.teacherUserId}
              />
            )}
            {activeTab === 'homework' && (
              <HomeworkTab courseId={courseId} isTeacher={isTeacher} />
            )}
            {activeTab === 'students' && (
              <StudentsTab courseId={courseId} />
            )}
            {activeTab === 'progress' && (
              <ProgressTab courseId={courseId} isTeacher={isTeacher} />
            )}
          </section>

          {/* RIGHT: 인포 패널 */}
          <CourseSidebar
            dashboard={dashboard}
            courseId={courseId}
            isTeacher={isTeacher}
            onDashboardUpdate={updated => setDashboard(updated)}
          />
        </div>
      </div>
    </main>
  )
}
