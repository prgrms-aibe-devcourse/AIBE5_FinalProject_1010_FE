import { getRole } from '../../auth/tokenStore.js'
import TeacherMyPage from './TeacherMyPage.jsx'
import StudentMyPage from './StudentMyPage.jsx'

export default function MyPage() {
  const role = getRole()
  return role === 'TEACHER' ? <TeacherMyPage /> : <StudentMyPage />
}
