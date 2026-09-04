import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StaffHeader } from '@/components/StaffHeader'
import { useAuthStore } from '@/store/useAuthStore'

const renderStaffHeader = () =>
  render(
    <MemoryRouter>
      <StaffHeader />
    </MemoryRouter>,
  )

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
    renderStaffHeader()

    expect(screen.getByRole('button', { name: 'Изход' })).toBeInTheDocument()
  })

  it('calls the store logout() when clicked', async () => {
    const user = userEvent.setup()
    renderStaffHeader()

    await user.click(screen.getByRole('button', { name: 'Изход' }))

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().roles).toEqual([])
  })

  it('clears the stored token from localStorage on logout', async () => {
    const user = userEvent.setup()
    renderStaffHeader()

    await user.click(screen.getByRole('button', { name: 'Изход' }))

    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('hides the interest-rate link for a Viewer', () => {
    renderStaffHeader()

    expect(screen.queryByRole('link', { name: /Лихвен процент/ })).not.toBeInTheDocument()
  })

  it('shows a link to the interest-rate page for an Approver', () => {
    useAuthStore.setState({ roles: ['Approver'] })

    renderStaffHeader()

    expect(screen.getByRole('link', { name: /Лихвен процент/ })).toHaveAttribute(
      'href',
      '/admin/interest-rate',
    )
  })
})
