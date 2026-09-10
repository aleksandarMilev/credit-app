import { Link } from 'react-router-dom'
import { Landmark, LogOut, Percent } from 'lucide-react'
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
    <header className="border-b border-pine-800 bg-pine-950 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pine-600 text-white shadow-sm">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold whitespace-nowrap text-cream">
            КредитApp<span className="hidden sm:inline"> · Административен панел</span>
          </span>
        </div>
        <nav className="flex items-center gap-2">
          {isApprover && (
            <Link
              to="/admin/interest-rate"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap text-pine-100 transition-colors hover:bg-pine-800 hover:text-sunny-400"
            >
              <Percent className="h-4 w-4" aria-hidden="true" />
              Лихвен процент
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap text-pine-100 transition-colors hover:bg-terracotta-500/10 hover:text-terracotta-400"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Изход
          </button>
        </nav>
      </div>
    </header>
  )
}
