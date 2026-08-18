import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { selectIsAuthenticated, selectRoles, useAuthStore } from '@/store/useAuthStore'
import { apiFetch } from '@/lib/apiClient'

const AUTH_TOKEN_STORAGE_KEY = 'auth_token'
const SERVER_URL = 'http://test-server.local'
const ROLE_CLAIM_TYPE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

const encodeBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const createToken = (role: string) => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64Url(JSON.stringify({ [ROLE_CLAIM_TYPE]: role }))
  return `${header}.${payload}.signature`
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null })
  })

  afterEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null })
  })

  it('stores the token in localStorage and updates state on login', () => {
    useAuthStore.getState().login('new-token')

    expect(useAuthStore.getState().token).toBe('new-token')
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('new-token')
  })

  it('clears the token from localStorage and state on logout', () => {
    useAuthStore.getState().login('some-token')

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('derives isAuthenticated as false when there is no token', () => {
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false)
  })

  it('derives isAuthenticated as true once logged in', () => {
    useAuthStore.getState().login('some-token')

    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true)
  })

  it('derives isAuthenticated as false again after logout', () => {
    useAuthStore.getState().login('some-token')
    useAuthStore.getState().logout()

    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false)
  })

  it('derives an empty roles array when there is no token', () => {
    expect(selectRoles(useAuthStore.getState())).toEqual([])
  })

  it('derives the role decoded from the token after login', () => {
    useAuthStore.getState().login(createToken('Approver'))

    expect(selectRoles(useAuthStore.getState())).toEqual(['Approver'])
  })

  it('derives an empty roles array again after logout', () => {
    useAuthStore.getState().login(createToken('Approver'))
    useAuthStore.getState().logout()

    expect(selectRoles(useAuthStore.getState())).toEqual([])
  })
})

describe('useAuthStore syncing with apiFetch 401 handling', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_REACT_APP_SERVER_URL', SERVER_URL)
    localStorage.clear()
    useAuthStore.setState({ token: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    localStorage.clear()
    useAuthStore.setState({ token: null })
  })

  it('logs out the store when any apiFetch call gets a 401, not just via explicit logout()', async () => {
    useAuthStore.getState().login(createToken('Viewer'))
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true)

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: 401, title: 'Unauthorized', detail: 'x' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/applications/')

    expect(useAuthStore.getState().token).toBeNull()
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false)
  })
})

describe('useAuthStore initialization', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('initializes with the token already in localStorage', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'persisted-token')
    vi.resetModules()

    const freshModule = await import('@/store/useAuthStore')

    expect(freshModule.useAuthStore.getState().token).toBe('persisted-token')
  })

  it('initializes with a null token when localStorage is empty', async () => {
    localStorage.clear()
    vi.resetModules()

    const freshModule = await import('@/store/useAuthStore')

    expect(freshModule.useAuthStore.getState().token).toBeNull()
  })
})
