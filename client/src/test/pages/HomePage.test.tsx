import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { HomePage } from '@/pages/HomePage'

describe('HomePage', () => {
  it('renders the heading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument()
  })
})
