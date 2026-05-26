import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import ProtectedRoute from './ProtectedRoute'

import MainPage           from '@/pages/main/MainPage'
import LoginPage          from '@/pages/auth/LoginPage'
import SignupPage         from '@/pages/auth/SignupPage'
import MyPage             from '@/pages/mypage/MyPage'
import CourseListPage     from '@/pages/courses/CourseListPage'
import CourseDetailPage   from '@/pages/courses/CourseDetailPage'
import TeacherDetailPage  from '@/pages/teachers/TeacherDetailPage'
import CourseDashboardPage from '@/pages/dashboard/CourseDashboardPage'
import ClassroomPage      from '@/pages/classroom/ClassroomPage'
import QnaListPage        from '@/pages/qna/QnaListPage'
import QnaDetailPage      from '@/pages/qna/QnaDetailPage'
import AiHelpPage         from '@/pages/ai/AiHelpPage'
import MessagesPage       from '@/pages/messages/MessagesPage'
import AdminDashboard     from '@/pages/admin/AdminDashboard'

const router = createBrowserRouter([
  { path: ROUTES.HOME,            element: <MainPage /> },
  { path: ROUTES.LOGIN,           element: <LoginPage /> },
  { path: ROUTES.SIGNUP,          element: <SignupPage /> },
  { path: ROUTES.COURSES,         element: <CourseListPage /> },
  { path: ROUTES.COURSE_DETAIL(), element: <CourseDetailPage /> },
  { path: ROUTES.TEACHER_DETAIL(), element: <TeacherDetailPage /> },

  // 로그인 필요
  {
    element: <ProtectedRoute />,
    children: [
      { path: ROUTES.MYPAGE,          element: <MyPage /> },
      { path: ROUTES.DASHBOARD(),     element: <CourseDashboardPage /> },
      { path: ROUTES.CLASSROOM(),     element: <ClassroomPage /> },
      { path: ROUTES.MESSAGES,        element: <MessagesPage /> },
      { path: ROUTES.AI_HELP,         element: <AiHelpPage /> },
    ],
  },

  // QnA (목록은 공개, 작성은 로그인 필요 — 내부에서 처리)
  { path: ROUTES.QNA,           element: <QnaListPage /> },
  { path: ROUTES.QNA_DETAIL(),  element: <QnaDetailPage /> },

  // 관리자 전용
  {
    element: <ProtectedRoute requiredRole="ADMIN" />,
    children: [
      { path: ROUTES.ADMIN, element: <AdminDashboard /> },
    ],
  },
])

export default router
