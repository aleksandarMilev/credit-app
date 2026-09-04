import { render, screen, within } from '@testing-library/react'
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

  it('updates the displayed status in place after a successful approval', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    const approveButton = await screen.findByRole('button', { name: 'Одобри' })

    mockedApiFetch.mockResolvedValueOnce({
      ok: true,
      data: createApplicationDetail({
        status: APPLICATION_STATUS.Approved,
        reviewedBy: 'approver.dev',
        reviewedOn: '2026-08-02T09:00:00Z',
      }),
    })

    const user = userEvent.setup()
    await user.click(approveButton)

    expect(await screen.findByText('Одобрена')).toBeInTheDocument()
    expect(screen.getByText('approver.dev')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Одобри' })).not.toBeInTheDocument()
  })

  it('shows the backend error inline when the approve/reject request fails', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    renderDetailPage()

    const rejectButton = await screen.findByRole('button', { name: 'Отхвърли' })

    mockedApiFetch.mockResolvedValueOnce({
      ok: false,
      error: {
        status: 409,
        title: 'Conflict',
        detail: 'Тази кандидатура вече е разгледана и решението не може да бъде променено.',
      },
    })

    const user = userEvent.setup()
    await user.click(rejectButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Тази кандидатура вече е разгледана и решението не може да бъде променено.',
    )
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

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
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
    const dialog = await screen.findByRole('dialog')

    await user.click(within(dialog).getByRole('button', { name: 'Отказ' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      '/applications/app-1/',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('confirming the dialog deletes the application and navigates to the queue', async () => {
    useAuthStore.setState({ roles: ['Approver'] })
    mockedApiFetch.mockResolvedValueOnce({ ok: true, data: createApplicationDetail() })

    const user = userEvent.setup()
    renderDetailPage()

    await user.click(await screen.findByRole('button', { name: 'Изтрий' }))
    const dialog = await screen.findByRole('dialog')

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
    const dialog = await screen.findByRole('dialog')

    mockedApiFetch.mockResolvedValueOnce({
      ok: false,
      error: { status: 404, title: 'Not Found', detail: 'Кандидатурата вече е изтрита.' },
    })

    await user.click(within(dialog).getByRole('button', { name: 'Да, изтрий' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Кандидатурата вече е изтрита.',
    )
    // Failure keeps the dialog open rather than navigating away.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
