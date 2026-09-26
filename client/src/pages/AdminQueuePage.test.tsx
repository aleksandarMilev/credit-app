import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminQueuePage } from '@/pages/AdminQueuePage'
import { apiFetch } from '@/lib/apiClient'
import type * as ApiClientModule from '@/lib/apiClient'
import type { ApiResult } from '@/lib/apiClient'
import type { PagedResult } from '@/types/pagedResult'
import type { ApplicationSummary } from '@/types/application'
import { APPLICATION_STATUS } from '@/types/application'

vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>()
  return {
    ...actual,
    apiFetch: vi.fn(),
  }
})

const mockedApiFetch = vi.mocked(apiFetch)

const createApplication = (overrides: Partial<ApplicationSummary> = {}): ApplicationSummary => ({
  id: 'app-1',
  firstName: 'Иван',
  lastName: 'Иванов',
  requestedAmount: 5000,
  requestedTermMonths: 24,
  status: APPLICATION_STATUS.Pending,
  createdOn: '2026-08-01T10:00:00Z',
  ...overrides,
})

const createPagedResult = (
  items: ApplicationSummary[],
  overrides: Partial<PagedResult<ApplicationSummary>> = {},
): ApiResult<PagedResult<ApplicationSummary>> => ({
  ok: true,
  data: { items, totalCount: items.length, pageIndex: 1, pageSize: 10, ...overrides },
})

const getLastRequestedPath = (): string => {
  const call = mockedApiFetch.mock.calls.at(-1)
  const path = call?.[0] as unknown
  if (typeof path !== 'string') {
    throw new Error('Expected apiFetch to have been called with a string path')
  }
  return path
}

const renderAdminQueuePage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminQueuePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminQueuePage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state while fetching', () => {
    mockedApiFetch.mockReturnValue(new Promise(() => undefined))

    renderAdminQueuePage()

    expect(screen.getByText('Зареждане на кандидатурите...')).toBeInTheDocument()
  })

  it('renders fetched applications', async () => {
    mockedApiFetch.mockResolvedValue(
      createPagedResult(
        [
          createApplication({ id: 'app-1', firstName: 'Иван', lastName: 'Иванов' }),
          createApplication({
            id: 'app-2',
            firstName: 'Мария',
            lastName: 'Петрова',
            status: APPLICATION_STATUS.Approved,
          }),
        ],
        { totalCount: 2 },
      ),
    )

    renderAdminQueuePage()

    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText('Мария Петрова')).toBeInTheDocument()
  })

  it('shows an empty state when there are no applications', async () => {
    mockedApiFetch.mockResolvedValue(createPagedResult([], { totalCount: 0 }))

    renderAdminQueuePage()

    expect(
      await screen.findByText('Няма кандидатури, отговарящи на филтъра.'),
    ).toBeInTheDocument()
  })

  it('shows the backend error detail when the fetch fails', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: false,
      error: { status: 500, title: 'Error', detail: 'Възникна грешка. Моля, опитайте отново.' },
    })

    renderAdminQueuePage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Възникна грешка. Моля, опитайте отново.',
    )
  })

  it('re-fetches with the selected status query param when the filter changes', async () => {
    mockedApiFetch.mockResolvedValue(createPagedResult([createApplication()], { totalCount: 1 }))

    const user = userEvent.setup()
    renderAdminQueuePage()

    await screen.findByText('Иван Иванов')

    await user.click(screen.getByRole('button', { name: 'Одобрени' }))

    await waitFor(() => {
      expect(getLastRequestedPath()).toContain('status=Approved')
    })
  })

  it('omits the status param when the "All" filter is selected', async () => {
    mockedApiFetch.mockResolvedValue(createPagedResult([createApplication()], { totalCount: 1 }))

    const user = userEvent.setup()
    renderAdminQueuePage()

    await screen.findByText('Иван Иванов')
    await user.click(screen.getByRole('button', { name: 'Чакащи' }))
    await waitFor(() => {
      expect(getLastRequestedPath()).toContain('status=Pending')
    })

    await user.click(screen.getByRole('button', { name: 'Всички' }))
    await waitFor(() => {
      expect(getLastRequestedPath()).not.toContain('status=')
    })
  })

  it('paginates to the next page and back to the previous one', async () => {
    mockedApiFetch.mockResolvedValueOnce(
      createPagedResult([createApplication({ firstName: 'Първа' })], {
        totalCount: 15,
        pageIndex: 1,
      }),
    )

    const user = userEvent.setup()
    renderAdminQueuePage()

    await screen.findByText('Първа Иванов')
    expect(screen.getByRole('button', { name: /Предишна/ })).toBeDisabled()

    mockedApiFetch.mockResolvedValueOnce(
      createPagedResult([createApplication({ firstName: 'Втора' })], {
        totalCount: 15,
        pageIndex: 2,
      }),
    )

    await user.click(screen.getByRole('button', { name: /Следваща/ }))

    await screen.findByText('Втора Иванов')
    expect(getLastRequestedPath()).toContain('pageIndex=2')

    mockedApiFetch.mockResolvedValueOnce(
      createPagedResult([createApplication({ firstName: 'Първа' })], {
        totalCount: 15,
        pageIndex: 1,
      }),
    )

    await user.click(screen.getByRole('button', { name: /Предишна/ }))

    await screen.findByText('Първа Иванов')
    expect(getLastRequestedPath()).toContain('pageIndex=1')
  })

  it('links each row to its detail route', async () => {
    mockedApiFetch.mockResolvedValue(
      createPagedResult([createApplication({ id: 'application-42' })], { totalCount: 1 }),
    )

    renderAdminQueuePage()

    const link = await screen.findByRole('link', { name: /Иван Иванов/ })
    expect(link).toHaveAttribute('href', '/admin/applications/application-42')
  })
})
