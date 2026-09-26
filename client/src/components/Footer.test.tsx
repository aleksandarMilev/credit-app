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

  it('renders links to the legal info pages with the correct hrefs', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByRole('link', { name: 'Общи условия' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Политика за поверителност' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(screen.getByRole('link', { name: 'ЧЗВ' })).toHaveAttribute('href', '/faq')
  })
})
