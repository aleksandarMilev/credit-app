import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminInterestRatePage } from '@/pages/AdminInterestRatePage'
import { apiFetch } from '@/lib/apiClient'
import type * as ApiClientModule from '@/lib/apiClient'
import type { InterestRate } from '@/types/interestRate'

vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>()
  return {
    ...actual,
    apiFetch: vi.fn(),
  }
})

const mockedApiFetch = vi.mocked(apiFetch)

const createInterestRate = (overrides: Partial<InterestRate> = {}): InterestRate => ({
  annualRatePercent: 9.5,
  modifiedOn: '2026-08-01T10:00:00Z',
  modifiedBy: 'approver.dev',
  ...overrides,
})

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminInterestRatePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminInterestRatePage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state while fetching the current rate', () => {
    mockedApiFetch.mockReturnValue(new Promise(() => undefined))

    renderPage()

    expect(screen.getByText('Зареждане на лихвения процент...')).toBeInTheDocument()
  })

  it('shows the backend error detail when the rate fetch fails', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: false,
      error: { status: 500, title: 'Error', detail: 'Възникна грешка. Моля, опитайте отново.' },
    })

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Възникна грешка. Моля, опитайте отново.',
    )
  })

  it('renders the current rate and metadata once fetched', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: createInterestRate({ annualRatePercent: 9.5 }) })

    renderPage()

    expect(await screen.findByText('9.5%')).toBeInTheDocument()
    expect(screen.getByText(/approver\.dev/)).toBeInTheDocument()
  })

  it('disables submit and shows a validation message for an out-of-range value', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: createInterestRate() })

    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByLabelText('Нов лихвен процент (%)')
    const submitButton = screen.getByRole('button', { name: 'Запази' })

    await user.type(input, '0')
    expect(submitButton).toBeDisabled()
    expect(
      screen.getByText('Лихвеният процент трябва да бъде между 0 и 100.'),
    ).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '100')
    expect(submitButton).toBeDisabled()

    await user.clear(input)
    await user.type(input, '-5')
    expect(submitButton).toBeDisabled()
  })

  it('leaves submit disabled and shows no error before the user types anything', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: createInterestRate() })

    renderPage()

    await screen.findByLabelText('Нов лихвен процент (%)')

    expect(screen.getByRole('button', { name: 'Запази' })).toBeDisabled()
    expect(
      screen.queryByText('Лихвеният процент трябва да бъде между 0 и 100.'),
    ).not.toBeInTheDocument()
  })

  it('submits the new rate and updates the displayed value on success', async () => {
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createInterestRate() })

    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByLabelText('Нов лихвен процент (%)')
    await user.type(input, '12.5')

    mockedApiFetch.mockResolvedValueOnce({
      ok: true,
      data: createInterestRate({
        annualRatePercent: 12.5,
        modifiedBy: 'approver.dev',
        modifiedOn: '2026-08-05T12:00:00Z',
      }),
    })

    await user.click(screen.getByRole('button', { name: 'Запази' }))

    expect(await screen.findByText('12.5%')).toBeInTheDocument()
    expect(mockedApiFetch).toHaveBeenLastCalledWith('/interestrate/', {
      method: 'PUT',
      body: { annualRatePercent: 12.5 },
    })
  })

  it('shows the backend error inline when the update request fails', async () => {
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createInterestRate() })

    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByLabelText('Нов лихвен процент (%)')
    await user.type(input, '12.5')

    mockedApiFetch.mockResolvedValueOnce({
      ok: false,
      error: { status: 403, title: 'Forbidden', detail: 'Нямате права за тази операция.' },
    })

    await user.click(screen.getByRole('button', { name: 'Запази' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Нямате права за тази операция.')
  })
})
