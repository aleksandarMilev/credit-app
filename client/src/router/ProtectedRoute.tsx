import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectIsAuthenticated, selectRoles, useAuthStore } from '@/store/useAuthStore'

interface ProtectedRouteProps {
  requiredRole?: string
}

const INSUFFICIENT_ROLE_REDIRECT = '/admin'

export const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const location = useLocation()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const roles = useAuthStore(selectRoles)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to={INSUFFICIENT_ROLE_REDIRECT} replace />
  }

  return <Outlet />
}
