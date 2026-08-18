import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplyPage } from '@/pages/ApplyPage'
import { apiFetch } from '@/lib/apiClient'
import type * as ApiClientModule from '@/lib/apiClient'
import type { ApiResult } from '@/lib/apiClient'

vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>()
  return {
    ...actual,
    apiFetch: vi.fn(),
  }
})

const mockedApiFetch = vi.mocked(apiFetch)

// jsdom doesn't implement these — ApplyPage calls createObjectURL to build
// the selected image's preview thumbnail.
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')
  URL.revokeObjectURL = vi.fn()
})

// Checksum-correct per ValidEgnAttribute's algorithm — verified against
// egnValidation.test.ts.
const VALID_EGN = '9001011182'

const renderApplyPage = (state?: { amount: number; termMonths: number }) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/apply', state }]}>
      <Routes>
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/" element={<div>Home placeholder</div>} />
      </Routes>
    </MemoryRouter>,
  )

const createValidIdCardFile = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], 'id-card.jpg', {
    type: 'image/jpeg',
  })

const getSubmittedRequest = (): { path: string; body: FormData } => {
  const call = mockedApiFetch.mock.calls.at(0)
  if (!call) {
    throw new Error('Expected apiFetch to have been called')
  }

  const path = call[0] as unknown
  if (typeof path !== 'string') {
    throw new Error('Expected apiFetch to have been called with a string path')
  }

  const options = call[1] as { body?: unknown } | undefined
  if (!(options?.body instanceof FormData)) {
    throw new Error('Expected apiFetch to have been called with a FormData body')
  }

  return { path, body: options.body }
}

const fillValidForm = async () => {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Име'), 'Иван')
  await user.type(screen.getByLabelText('Фамилия'), 'Иванов')
  await user.type(screen.getByLabelText('ЕГН'), VALID_EGN)
  await user.type(screen.getByLabelText('Телефон'), '0888123456')
  await user.type(screen.getByLabelText('Имейл'), 'ivan@example.com')
  await user.upload(screen.getByLabelText('изберете от компютъра'), createValidIdCardFile())

  return user
}

describe('ApplyPage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('pre-fills the loan amount and term from location.state', () => {
    renderApplyPage({ amount: 5000, termMonths: 24 })

    expect(screen.getByLabelText('Желана сума')).toHaveValue(5000)
    expect(screen.getByLabelText('Срок (месеци)')).toHaveValue(24)
  })

  it('falls back to LoanCalculator-matching defaults when location.state is absent', () => {
    renderApplyPage()

    expect(screen.getByLabelText('Желана сума')).toHaveValue(10000)
    expect(screen.getByLabelText('Срок (месеци)')).toHaveValue(36)
  })

  it('blocks submission and shows an inline message for an invalid EGN', async () => {
    const user = userEvent.setup()
    renderApplyPage()

    await user.type(screen.getByLabelText('ЕГН'), '1234567890')
    await user.click(screen.getByRole('button', { name: 'Изпрати кандидатурата' }))

    expect(screen.getByText('Невалидно ЕГН.')).toBeInTheDocument()
    expect(mockedApiFetch).not.toHaveBeenCalled()
  })

  it('blocks submission and shows an inline message for a missing required field', async () => {
    const user = userEvent.setup()
    renderApplyPage()

    // Leave First name empty, submit directly.
    await user.click(screen.getByRole('button', { name: 'Изпрати кандидатурата' }))

    expect(screen.getByText('Името е задължително.')).toBeInTheDocument()
    expect(mockedApiFetch).not.toHaveBeenCalled()
  })

  it('submits a FormData payload and shows the confirmation state on success', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, data: { id: 'application-1' } })

    renderApplyPage()
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: 'Изпрати кандидатурата' }))

    await waitFor(() => {
      expect(screen.getByText('Кандидатурата е изпратена успешно!')).toBeInTheDocument()
    })

    const submitted = getSubmittedRequest()
    expect(submitted.path).toBe('/applications/')
    expect(submitted.body.get('FirstName')).toBe('Иван')
    expect(submitted.body.get('Egn')).toBe(VALID_EGN)
  })

  it('displays the backend error detail inline on a failed submission, not a generic message', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: false,
      error: {
        status: 409,
        title: 'Conflict',
        detail: 'Вече имате чакаща обработка кандидатура. Моля, изчакайте тя да бъде разгледана.',
      },
    })

    renderApplyPage()
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: 'Изпрати кандидатурата' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Вече имате чакаща обработка кандидатура. Моля, изчакайте тя да бъде разгледана.',
    )
    expect(screen.queryByText('Кандидатурата е изпратена успешно!')).not.toBeInTheDocument()
  })

  it('disables the submit button while the request is in flight', async () => {
    let resolveRequest: (value: ApiResult<{ id: string }>) => void = () => undefined
    mockedApiFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    renderApplyPage()
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: 'Изпрати кандидатурата' }))

    expect(screen.getByRole('button', { name: 'Изпращане...' })).toBeDisabled()

    resolveRequest({ ok: true, data: { id: 'application-1' } })
    await waitFor(() => {
      expect(screen.getByText('Кандидатурата е изпратена успешно!')).toBeInTheDocument()
    })
  })
})
