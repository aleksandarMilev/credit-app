import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StaffHeader } from '@/components/StaffHeader'
import { useAuthStore } from '@/store/useAuthStore'

describe('StaffHeader', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: 'test-token', roles: ['Viewer'] })
  })

  afterEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, roles: [] })
  })

  it('renders a logout button', () => {
    render(<StaffHeader />)

    expect(screen.getByRole('button', { name: 'Изход' })).toBeInTheDocument()
  })

  it('calls the store logout() when clicked', async () => {
    const user = userEvent.setup()
    render(<StaffHeader />)

    await user.click(screen.getByRole('button', { name: 'Изход' }))

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().roles).toEqual([])
  })

  it('clears the stored token from localStorage on logout', async () => {
    const user = userEvent.setup()
    render(<StaffHeader />)

    await user.click(screen.getByRole('button', { name: 'Изход' }))

    expect(localStorage.getItem('auth_token')).toBeNull()
  })
})
