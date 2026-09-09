import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { FaqPage } from '@/pages/FaqPage'

describe('FaqPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<FaqPage />)

    expect(screen.getByRole('heading', { name: 'Често задавани въпроси' })).toBeInTheDocument()
  })

  it('reveals an answer when its question is toggled', async () => {
    renderWithProviders(<FaqPage />)

    const question = screen.getByRole('button', {
      name: 'Какви документи са необходими за кандидатстване?',
    })
    expect(question).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(question)

    expect(question).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/сканирано изображение или снимка на личната ви карта/),
    ).toBeInTheDocument()
  })
})
