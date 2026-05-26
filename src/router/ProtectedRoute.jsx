import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'

function ProtectedRoute({ requiredRole }) {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
