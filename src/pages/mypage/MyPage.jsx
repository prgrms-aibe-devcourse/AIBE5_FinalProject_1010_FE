import { Navigate } from 'react-router-dom'
import { getRole } from '../../auth/tokenStore.js'
import TeacherMyPage from './TeacherMyPage.jsx'
import StudentMyPage from './StudentMyPage.jsx'

export default function MyPage() {
  const role = getRole()
  if (!role) return <Navigate to="/login" replace />
  return role === 'TEACHER' ? <TeacherMyPage /> : <StudentMyPage />
}
