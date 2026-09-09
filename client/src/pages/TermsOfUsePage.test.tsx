import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { TermsOfUsePage } from '@/pages/TermsOfUsePage'

describe('TermsOfUsePage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<TermsOfUsePage />)

    expect(screen.getByRole('heading', { name: 'Общи условия' })).toBeInTheDocument()
  })

  it('mentions the governing law section', () => {
    renderWithProviders(<TermsOfUsePage />)

    expect(screen.getByRole('heading', { name: 'Приложимо право' })).toBeInTheDocument()
  })
})
