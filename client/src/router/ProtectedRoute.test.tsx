import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { useAuthStore } from '@/store/useAuthStore'

const ROLE_CLAIM_TYPE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

const encodeBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const createToken = (role: string) => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64Url(JSON.stringify({ [ROLE_CLAIM_TYPE]: role }))
  return `${header}.${payload}.signature`
}

const renderProtected = (requiredRole?: string) =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute requiredRole={requiredRole} />}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/admin" element={<div>Admin landing</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null })
  })

  afterEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null })
  })

  it('redirects unauthenticated users to /login', () => {
    renderProtected()

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content for an authenticated user when no role is required', () => {
    useAuthStore.getState().login(createToken('Viewer'))

    renderProtected()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders the protected content when the user has the required role', () => {
    useAuthStore.getState().login(createToken('Approver'))

    renderProtected('Approver')

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects to /admin when authenticated but missing the required role', () => {
    useAuthStore.getState().login(createToken('Viewer'))

    renderProtected('Approver')

    expect(screen.getByText('Admin landing')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
