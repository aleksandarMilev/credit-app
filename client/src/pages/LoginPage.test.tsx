import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/pages/LoginPage'
import { useAuthStore } from '@/store/useAuthStore'
import { apiFetch } from '@/lib/apiClient'
import type * as ApiClientModule from '@/lib/apiClient'
import type { ApiResult } from '@/lib/apiClient'

vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>()
  return {
    ...actual,
    apiFetch: vi.fn(),
  }
})

const mockedApiFetch = vi.mocked(apiFetch)

const renderLoginPage = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<div>Admin queue placeholder</div>} />
      </Routes>
    </MemoryRouter>,
  )

const fillCredentials = async (credentials: string, password: string) => {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Потребителско име или имейл'), credentials)
  await user.type(screen.getByLabelText('Парола'), password)

  return user
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null })
    mockedApiFetch.mockReset()
  })

  afterEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null })
  })

  it('renders the credentials and password fields', () => {
    renderLoginPage()

    expect(screen.getByLabelText('Потребителско име или имейл')).toBeInTheDocument()
    expect(screen.getByLabelText('Парола')).toBeInTheDocument()
  })

  it('sends credentials and password to /identity/login/ on submit', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: { token: 'issued-token' } })

    renderLoginPage()
    const user = await fillCredentials('approver.dev', 'Password123')
    await user.click(screen.getByRole('button', { name: 'Вход' }))

    expect(mockedApiFetch).toHaveBeenCalledWith('/identity/login/', {
      method: 'POST',
      body: { credentials: 'approver.dev', password: 'Password123' },
    })
  })

  it('stores the token and navigates to the admin route on success', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: { token: 'issued-token' } })

    renderLoginPage()
    const user = await fillCredentials('approver.dev', 'Password123')
    await user.click(screen.getByRole('button', { name: 'Вход' }))

    await waitFor(() => {
      expect(screen.getByText('Admin queue placeholder')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().token).toBe('issued-token')
  })

  it('shows the backend error message inline on failure and does not navigate', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: false,
      error: { status: 401, title: 'Unauthorized', detail: 'Невалидни данни за вход.' },
    })

    renderLoginPage()
    const user = await fillCredentials('approver.dev', 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Вход' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Невалидни данни за вход.')
    expect(useAuthStore.getState().token).toBeNull()
    expect(screen.queryByText('Admin queue placeholder')).not.toBeInTheDocument()
  })

  it('disables the submit button and shows a loading label while the request is in flight', async () => {
    let resolveRequest: (value: ApiResult<{ token: string }>) => void = () => undefined
    mockedApiFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    renderLoginPage()
    const user = await fillCredentials('approver.dev', 'Password123')
    await user.click(screen.getByRole('button', { name: 'Вход' }))

    const pendingButton = screen.getByRole('button', { name: 'Влизане...' })
    expect(pendingButton).toBeDisabled()

    resolveRequest({ ok: true, data: { token: 'issued-token' } })
    await waitFor(() => {
      expect(screen.getByText('Admin queue placeholder')).toBeInTheDocument()
    })
  })
})
