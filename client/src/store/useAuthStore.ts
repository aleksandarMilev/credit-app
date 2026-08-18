import { create } from 'zustand'
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  onUnauthorized,
  setStoredAuthToken,
} from '@/lib/apiClient'
import { getRolesFromToken } from '@/lib/jwt'

interface AuthState {
  token: string | null
  roles: string[]
  login: (token: string) => void
  logout: () => void
}

const initialToken = getStoredAuthToken()

export const useAuthStore = create<AuthState>()((set) => ({
  token: initialToken,
  // Computed once per login/logout (never per-render) so the array
  // reference stays stable between renders when the token hasn't
  // changed. A selector that rebuilt this array on every call caused an
  // infinite re-render loop: Zustand's default equality check is
  // reference equality, so a fresh array every call looks like "state
  // changed" forever to any component subscribed via useAuthStore(selectRoles).
  roles: initialToken ? getRolesFromToken(initialToken) : [],
  login: (token) => {
    setStoredAuthToken(token)
    set({ token, roles: getRolesFromToken(token) })
  },
  logout: () => {
    clearStoredAuthToken()
    set({ token: null, roles: [] })
  },
}))

// apiClient.ts stays framework-agnostic — it exposes onUnauthorized as a
// generic hook, and this store registers itself here rather than apiClient
// importing Zustand directly. This closes the gap where a 401 elsewhere in
// the app cleared localStorage but left this store's in-memory token stale.
onUnauthorized(() => {
  useAuthStore.getState().logout()
})

export const selectIsAuthenticated = (state: AuthState): boolean => state.token !== null

export const selectRoles = (state: AuthState): string[] => state.roles
