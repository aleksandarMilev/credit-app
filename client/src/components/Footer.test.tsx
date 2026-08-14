import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Footer } from '@/components/Footer'

describe('Footer', () => {
  it('renders placeholder contact info and the copyright line', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByText('info@creditapp.bg · +359 000 000 000')).toBeInTheDocument()
    expect(screen.getByText(/Всички права запазени/)).toBeInTheDocument()
  })

  it('renders a nav link to the calculator page with the correct href', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByRole('link', { name: 'Калкулатор' })).toHaveAttribute(
      'href',
      '/calculator',
    )
  })
})
