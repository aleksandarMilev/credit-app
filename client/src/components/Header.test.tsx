import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Header } from '@/components/Header'

describe('Header', () => {
  it('renders the site logo', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('link', { name: 'КредитApp' })).toBeInTheDocument()
  })

  it('renders a nav link to the calculator page with the correct href', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('link', { name: 'Калкулатор' })).toHaveAttribute(
      'href',
      '/calculator',
    )
  })
})
