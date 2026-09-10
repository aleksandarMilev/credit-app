import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/StatusBadge'
import { APPLICATION_STATUS } from '@/types/application'

describe('StatusBadge', () => {
  it('renders the Pending label with sunny/amber styling', () => {
    render(<StatusBadge status={APPLICATION_STATUS.Pending} />)

    const badge = screen.getByText('Чакаща')
    expect(badge.className).toContain('bg-sunny-100')
  })

  it('renders the Approved label with pine styling', () => {
    render(<StatusBadge status={APPLICATION_STATUS.Approved} />)

    const badge = screen.getByText('Одобрена')
    expect(badge.className).toContain('bg-pine-100')
  })

  it('renders the Rejected label with terracotta styling', () => {
    render(<StatusBadge status={APPLICATION_STATUS.Rejected} />)

    const badge = screen.getByText('Отхвърлена')
    expect(badge.className).toContain('bg-terracotta-100')
  })
})
