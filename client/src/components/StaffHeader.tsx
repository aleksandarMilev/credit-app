import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

// ProtectedRoute already redirects to /login the moment isAuthenticated
// flips to false (the same reactive path already exercised by the 401
// auto-logout flow) — so logout() alone is enough here, no separate
// navigate() call needed.
export const StaffHeader = () => {
  const logout = useAuthStore((state) => state.logout)

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          КредитApp · Административен панел
        </span>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Изход
        </button>
      </div>
    </header>
  )
}
