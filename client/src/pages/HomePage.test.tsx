import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { HomePage } from '@/pages/HomePage'

describe('HomePage', () => {
  it('renders the hero CTA linking to the calculator page', () => {
    renderWithProviders(<HomePage />)

    expect(screen.getByRole('link', { name: 'Изчисли вноска' })).toHaveAttribute(
      'href',
      '/calculator',
    )
  })

  it('renders all four "how it works" steps', () => {
    renderWithProviders(<HomePage />)

    expect(screen.getByRole('heading', { name: 'Изчисли' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Кандидатствай' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Преглед' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Отговор' })).toBeInTheDocument()
  })
})
