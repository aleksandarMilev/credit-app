import { Link } from 'react-router-dom'
import { LogOut, Percent } from 'lucide-react'
import { selectRoles, useAuthStore } from '@/store/useAuthStore'

const APPROVER_ROLE_NAME = 'Approver'

// ProtectedRoute already redirects to /login the moment isAuthenticated
// flips to false (the same reactive path already exercised by the 401
// auto-logout flow) — so logout() alone is enough here, no separate
// navigate() call needed.
export const StaffHeader = () => {
  const logout = useAuthStore((state) => state.logout)
  const roles = useAuthStore(selectRoles)
  const isApprover = roles.includes(APPROVER_ROLE_NAME)

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          КредитApp · Административен панел
        </span>
        <nav className="flex items-center gap-2">
          {isApprover && (
            <Link
              to="/admin/interest-rate"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <Percent className="h-4 w-4" aria-hidden="true" />
              Лихвен процент
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Изход
          </button>
        </nav>
      </div>
    </header>
  )
}
