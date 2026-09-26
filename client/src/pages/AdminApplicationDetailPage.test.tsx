import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApplicationDetailPage } from '@/pages/AdminApplicationDetailPage'
import { useAuthStore } from '@/store/useAuthStore'
import { apiFetch, apiFetchBlob } from '@/lib/apiClient'
import type * as ApiClientModule from '@/lib/apiClient'
import type { ApplicationDetail } from '@/types/application'
import { APPLICATION_STATUS } from '@/types/application'

vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>()
  return {
    ...actual,
    apiFetch: vi.fn(),
    apiFetchBlob: vi.fn(),
  }
})

const mockedApiFetch = vi.mocked(apiFetch)
const mockedApiFetchBlob = vi.mocked(apiFetchBlob)

// jsdom doesn't implement these — useApplicationDocument builds a preview
// URL from the fetched blob.
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')
  URL.revokeObjectURL = vi.fn()
})

const createApplicationDetail = (
  overrides: Partial<ApplicationDetail> = {},
): ApplicationDetail => ({
  id: 'app-1',
  firstName: 'Иван',
  lastName: 'Иванов',
  egn: '9001011182',
  phone: '0888123456',
  email: 'ivan@example.com',
  requestedAmount: 5000,
  requestedTermMonths: 24,
  status: APPLICATION_STATUS.Pending,
  reviewNote: null,
  reviewedBy: null,
  reviewedOn: null,
  createdOn: '2026-08-01T10:00:00Z',
  ...overrides,
})

const renderDetailPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/applications/app-1']}>
        <Routes>
          <Route path="/admin/applications/:id" element={<AdminApplicationDetailPage />} />
          <Route path="/admin" element={<div>Admin queue placeholder</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminApplicationDetailPage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
    mockedApiFetchBlob.mockReset()
    // Sane default so tests that don't care about the document specifically
    // don't hit an unmocked call — useApplicationDocument fetches
    // unconditionally on every render, loading state or not.
    mockedApiFetchBlob.mockResolvedValue({
      ok: true,
      data: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' }),
    })
    useAuthStore.setState({ token: 'test-token', roles: ['Viewer'] })
  })

  afterEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: null, roles: [] })
  })

  it('shows a loading state while fetching the application', () => {
    mockedApiFetch.mockReturnValue(new Promise(() => undefined))

    renderDetailPage()

    expect(screen.getByText('Зареждане на кандидатурата...')).toBeInTheDocument()
  })

  it('renders all application fields once fetched', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    expect(await screen.findByRole('heading', { name: 'Иван Иванов' })).toBeInTheDocument()
    expect(screen.getByText('9001011182')).toBeInTheDocument()
    expect(screen.getByText('0888123456')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('24 месеца')).toBeInTheDocument()
  })

  it('loads and renders the document image via apiFetchBlob', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    const image = await screen.findByAltText('Снимка на личната карта на кандидата')
    expect(image).toHaveAttribute('src', 'blob:mock-preview-url')
    expect(mockedApiFetchBlob).toHaveBeenCalledWith('/applications/app-1/document/')
  })

  it('shows a document error state when the blob fetch fails', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })
    mockedApiFetchBlob.mockResolvedValue({
      ok: false,
      error: { status: 404, title: 'Not Found', detail: 'Файлът не е намерен.' },
    })

    renderDetailPage()

    expect(await screen.findByText('Файлът не е намерен.')).toBeInTheDocument()
  })

  it('shows approve/reject controls for an Approver on a pending application', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    expect(await screen.findByRole('button', { name: 'Одобри' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Отхвърли' })).toBeInTheDocument()
  })

  it('hides approve/reject controls entirely for a Viewer', async () => {
    useAuthStore.setState({ roles: ['Viewer'] })
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    await screen.findByRole('heading', { name: 'Иван Иванов' })
    expect(screen.queryByRole('button', { name: 'Одобри' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Отхвърли' })).not.toBeInTheDocument()
  })

  it('updates the displayed status in place after a confirmed approval', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Одобри' }))
    const dialog = await screen.findByRole('alertdialog')

    mockedApiFetch.mockResolvedValueOnce({
      ok: true,
      data: createApplicationDetail({
        status: APPLICATION_STATUS.Approved,
        reviewedBy: 'approver.dev',
        reviewedOn: '2026-08-02T09:00:00Z',
      }),
    })

    await user.click(within(dialog).getByRole('button', { name: 'Да, одобри' }))

    expect(await screen.findByText('Одобрена')).toBeInTheDocument()
    expect(screen.getByText('approver.dev')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Одобри' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('shows the backend error inline when a confirmed approve/reject request fails', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Отхвърли' }))
    const dialog = await screen.findByRole('alertdialog')

    mockedApiFetch.mockResolvedValueOnce({
      ok: false,
      error: {
        status: 409,
        title: 'Conflict',
        detail: 'Тази кандидатура вече е разгледана и решението не може да бъде променено.',
      },
    })

    await user.click(within(dialog).getByRole('button', { name: 'Да, отхвърли' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Тази кандидатура вече е разгледана и решението не може да бъде променено.',
    )
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  describe.each([
    { trigger: 'Одобри', confirm: 'Да, одобри', verb: 'одобрите', decision: 0 },
    { trigger: 'Отхвърли', confirm: 'Да, отхвърли', verb: 'отхвърлите', decision: 1 },
  ])('the "$trigger" confirmation dialog', ({ trigger, confirm, verb, decision }) => {
    const countStatusRequests = () =>
      mockedApiFetch.mock.calls.filter(([path]) => path === '/applications/app-1/status/').length

    const openDecisionDialog = async () => {
      useAuthStore.setState({ roles: ['Approver'] })
      mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

      const user = userEvent.setup()
      renderDetailPage()

      await user.click(await screen.findByRole('button', { name: trigger }))
      const dialog = await screen.findByRole('alertdialog')

      return { user, dialog }
    }

    it('opens without sending the decision and states its consequences', async () => {
      const { dialog } = await openDecisionDialog()

      expect(dialog).toHaveTextContent(`Сигурни ли сте, че искате да ${verb} кандидатурата`)
      expect(dialog).toHaveTextContent('Решението е окончателно')
      expect(dialog).toHaveTextContent('Кандидатът ще бъде уведомен по имейл.')
      expect(countStatusRequests()).toBe(0)
    })

    it('closes on Отказ without sending the decision', async () => {
      const { user, dialog } = await openDecisionDialog()

      await user.click(within(dialog).getByRole('button', { name: 'Отказ' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
      expect(countStatusRequests()).toBe(0)
    })

    it('closes on Escape without sending the decision', async () => {
      const { user } = await openDecisionDialog()

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
      expect(countStatusRequests()).toBe(0)
    })

    it('sends the decision exactly once when confirmed', async () => {
      const { user, dialog } = await openDecisionDialog()
      mockedApiFetch.mockReturnValue(new Promise(() => undefined))

      await user.click(within(dialog).getByRole('button', { name: confirm }))
      await user.click(within(dialog).getByRole('button', { name: /\.\.\.$/ }))

      expect(countStatusRequests()).toBe(1)
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/applications/app-1/status/',
        expect.objectContaining({ method: 'PUT', body: { decision, note: null } }),
      )
      expect(within(dialog).getByRole('button', { name: /\.\.\.$/ })).toBeDisabled()
    })

    // Two clicks in the same tick — before React Query's isPending update
    // reaches the button — must still send a single request.
    it('sends the decision only once on a rapid double click', async () => {
      const { dialog } = await openDecisionDialog()
      mockedApiFetch.mockReturnValue(new Promise(() => undefined))

      const confirmButton = within(dialog).getByRole('button', { name: confirm })
      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)

      await within(dialog).findByRole('button', { name: /\.\.\.$/ })
      expect(countStatusRequests()).toBe(1)
    })
  })

  it('shows a read-only decision summary and no action controls for a terminal-status application', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValue({
      ok: true,
      data: createApplicationDetail({
        status: APPLICATION_STATUS.Rejected,
        reviewedBy: 'approver.dev',
        reviewedOn: '2026-08-02T09:00:00Z',
        reviewNote: 'Непълни данни.',
      }),
    })

    renderDetailPage()

    expect(await screen.findByText('Отхвърлена')).toBeInTheDocument()
    expect(screen.getByText('approver.dev')).toBeInTheDocument()
    expect(screen.getByText('Непълни данни.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Одобри' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Отхвърли' })).not.toBeInTheDocument()
  })

  it('shows an error state with a back link when the application fetch fails', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: false,
      error: { status: 404, title: 'Not Found', detail: 'Кандидатурата не е намерена.' },
    })

    renderDetailPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Кандидатурата не е намерена.')
    expect(screen.getByRole('link', { name: /Обратно към опашката/ })).toBeInTheDocument()
  })

  it('shows a delete button for an Approver', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    expect(await screen.findByRole('button', { name: 'Изтрий' })).toBeInTheDocument()
  })

  it('hides the delete button for a Viewer', async () => {
    useAuthStore.setState({ roles: ['Viewer'] })
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    await screen.findByRole('heading', { name: 'Иван Иванов' })
    expect(screen.queryByRole('button', { name: 'Изтрий' })).not.toBeInTheDocument()
  })

  it('opens a confirmation dialog on click without firing the delete request', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      '/applications/app-1/',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('cancelling the confirmation dialog closes it without deleting', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))
    const dialog = await screen.findByRole('alertdialog')

    await user.click(within(dialog).getByRole('button', { name: 'Отказ' }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      '/applications/app-1/',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('pressing Escape closes the confirmation dialog without deleting', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValue({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))
    await screen.findByRole('alertdialog')

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      '/applications/app-1/',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('sends the delete request only once on a rapid double click', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))
    const dialog = await screen.findByRole('alertdialog')

    mockedApiFetch.mockReturnValue(new Promise(() => undefined))

    const confirmButton = within(dialog).getByRole('button', { name: 'Да, изтрий' })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    await within(dialog).findByRole('button', { name: 'Изтриване...' })
    expect(
      mockedApiFetch.mock.calls.filter(
        ([path, options]) => path === '/applications/app-1/' && options?.method === 'DELETE',
      ),
    ).toHaveLength(1)
  })

  it('sends the delete request only once while it is in flight', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))
    const dialog = await screen.findByRole('alertdialog')

    mockedApiFetch.mockReturnValue(new Promise(() => undefined))

    await user.click(within(dialog).getByRole('button', { name: 'Да, изтрий' }))
    const pendingButton = within(dialog).getByRole('button', { name: 'Изтриване...' })
    await user.click(pendingButton)

    expect(pendingButton).toBeDisabled()
    expect(
      mockedApiFetch.mock.calls.filter(
        ([path, options]) => path === '/applications/app-1/' && options?.method === 'DELETE',
      ),
    ).toHaveLength(1)
  })

  it('confirming the dialog deletes the application and navigates to the queue', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))
    const dialog = await screen.findByRole('alertdialog')

    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: undefined })

    await user.click(within(dialog).getByRole('button', { name: 'Да, изтрий' }))

    expect(await screen.findByText('Admin queue placeholder')).toBeInTheDocument()
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/applications/app-1/',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('shows the backend error inline in the dialog when deletion fails', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))
    const dialog = await screen.findByRole('alertdialog')

    mockedApiFetch.mockResolvedValueOnce({
      ok: false,
      error: { status: 404, title: 'Not Found', detail: 'Кандидатурата вече е изтрита.' },
    })

    await user.click(within(dialog).getByRole('button', { name: 'Да, изтрий' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Кандидатурата вече е изтрита.',
    )
    // Failure keeps the dialog open rather than navigating away.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
