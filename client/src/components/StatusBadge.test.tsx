import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/StatusBadge'
import { APPLICATION_STATUS } from '@/types/application'

describe('StatusBadge', () => {
  it('renders the Pending label with amber/accent styling', () => {
    render(<StatusBadge status={APPLICATION_STATUS.Pending} />)

    const badge = screen.getByText('Чакаща')
    expect(badge.className).toContain('bg-accent-100')
  })

  it('renders the Approved label with green styling', () => {
    render(<StatusBadge status={APPLICATION_STATUS.Approved} />)

    const badge = screen.getByText('Одобрена')
    expect(badge.className).toContain('bg-green-100')
  })

  it('renders the Rejected label with red styling', () => {
    render(<StatusBadge status={APPLICATION_STATUS.Rejected} />)

    const badge = screen.getByText('Отхвърлена')
    expect(badge.className).toContain('bg-red-100')
  })
})
