import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore()
  const isLoggedIn = !!user
  const isTeacher = user?.role === 'TEACHER'
  const isStudent = user?.role === 'STUDENT'
  const isAdmin   = user?.role === 'ADMIN'
  return { user, accessToken, isLoggedIn, isTeacher, isStudent, isAdmin, setAuth, clearAuth }
}
