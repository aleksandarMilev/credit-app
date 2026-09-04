import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalculatorPage } from '@/pages/CalculatorPage'
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

const renderCalculatorPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CalculatorPage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state while fetching the interest rate', () => {
    mockedApiFetch.mockReturnValue(new Promise(() => undefined))

    renderCalculatorPage()

    expect(screen.getByText('Зареждане на лихвения процент...')).toBeInTheDocument()
  })

  it('renders the calculator once the interest rate has loaded', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: createInterestRate() })

    renderCalculatorPage()

    expect(await screen.findByLabelText('Сума на кредита')).toBeInTheDocument()
    expect(screen.getByLabelText('Срок (месеци)')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Кандидатствайте с тези условия' }),
    ).toBeInTheDocument()
  })

  it('shows the backend error detail when the interest rate fetch fails', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: false,
      error: { status: 500, title: 'Error', detail: 'Възникна грешка. Моля, опитайте отново.' },
    })

    renderCalculatorPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Възникна грешка. Моля, опитайте отново.',
    )
  })
})
