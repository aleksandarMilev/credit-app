import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter } from 'react-router-dom'
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

  it('closes the mobile menu when the route changes via navigation outside the menu', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
        <Link to="/elsewhere">Изход извън менюто</Link>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Отвори менюто' }))
    expect(screen.getByRole('button', { name: 'Затвори менюто' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Изход извън менюто' }))

    expect(screen.getByRole('button', { name: 'Отвори менюто' })).toBeInTheDocument()
  })
})
