import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, apiFetchBlob, getStoredAuthToken, onUnauthorized } from '@/lib/apiClient'

const AUTH_TOKEN_STORAGE_KEY = 'auth_token'
const SERVER_URL = 'http://test-server.local'

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const getRequestInit = (fetchMock: FetchMock): RequestInit => {
  const call = fetchMock.mock.calls.at(0)
  if (!call) {
    throw new Error('Expected fetch to have been called')
  }
  return call[1] ?? {}
}

const getRequestUrl = (fetchMock: FetchMock): string => {
  const call = fetchMock.mock.calls.at(0)
  if (!call) {
    throw new Error('Expected fetch to have been called')
  }

  const [url] = call
  if (typeof url !== 'string') {
    throw new Error('Expected fetch to have been called with a string URL')
  }

  return url
}

const stubFetch = (response: Response): FetchMock => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_REACT_APP_SERVER_URL', SERVER_URL)

    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()

    localStorage.clear()
  })

  it('prefixes the request path with the configured server base URL', async () => {
    const fetchMock = stubFetch(createJsonResponse({}))

    await apiFetch('/identity/login/')

    expect(getRequestUrl(fetchMock)).toBe(`${SERVER_URL}/identity/login/`)
  })

  it('attaches the Authorization header when a token is stored', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stored-token')
    const fetchMock = stubFetch(createJsonResponse({}))

    await apiFetch('/applications/')

    const headers = new Headers(getRequestInit(fetchMock).headers)
    expect(headers.get('Authorization')).toBe('Bearer stored-token')
  })

  it('omits the Authorization header when no token is stored', async () => {
    const fetchMock = stubFetch(createJsonResponse({}))

    await apiFetch('/applications/')

    const headers = new Headers(getRequestInit(fetchMock).headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('clears the stored token when the response status is 401', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stale-token')
    stubFetch(
      createJsonResponse({ status: 401, title: 'Unauthorized', detail: 'Session expired.' }, 401),
    )

    const result = await apiFetch('/applications/')

    expect(result.ok).toBe(false)
    expect(getStoredAuthToken()).toBeNull()
  })

  it('does not clear the stored token for a non-401 response', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'valid-token')
    stubFetch(createJsonResponse({}))

    await apiFetch('/applications/')

    expect(getStoredAuthToken()).toBe('valid-token')
  })

  it('does not set a Content-Type header for FormData bodies', async () => {
    const fetchMock = stubFetch(createJsonResponse({}))

    const formData = new FormData()
    formData.append('FirstName', 'Ivan')

    await apiFetch('/applications/', { method: 'POST', body: formData })

    const requestInit = getRequestInit(fetchMock)
    const headers = new Headers(requestInit.headers)
    expect(headers.has('Content-Type')).toBe(false)
    expect(requestInit.body).toBe(formData)
  })

  it('serializes a plain object body as JSON with a Content-Type header', async () => {
    const fetchMock = stubFetch(createJsonResponse({}))
    const payload = { credentials: 'approver', password: 'secret' }

    await apiFetch('/identity/login/', { method: 'POST', body: payload })

    const requestInit = getRequestInit(fetchMock)
    const headers = new Headers(requestInit.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(requestInit.body).toBe(JSON.stringify(payload))
  })

  it('returns an ok result with the parsed JSON body on success', async () => {
    stubFetch(createJsonResponse({ token: 'abc' }))

    const result = await apiFetch<{ token: string }>('/identity/login/')

    expect(result).toEqual({ ok: true, data: { token: 'abc' } })
  })

  it('returns an ok:false result with the parsed ProblemDetails on a non-ok response', async () => {
    stubFetch(
      createJsonResponse(
        { status: 400, title: 'Bad Request', detail: 'Невалидни данни за вход.' },
        400,
      ),
    )

    const result = await apiFetch('/identity/login/')

    expect(result).toEqual({
      ok: false,
      error: { status: 400, title: 'Bad Request', detail: 'Невалидни данни за вход.' },
    })
  })

  it('falls back to a generic Bulgarian error when a non-ok response body is not valid JSON', async () => {
    stubFetch(new Response('not json', { status: 500 }))

    const result = await apiFetch('/applications/')

    expect(result).toEqual({
      ok: false,
      error: {
        status: 500,
        title: 'Error',
        detail: 'Възникна грешка. Моля, опитайте отново.',
      },
    })
  })

  it('falls back to a generic Bulgarian error when a non-ok response is JSON but not ProblemDetails-shaped', async () => {
    stubFetch(createJsonResponse({ message: 'something broke' }, 500))

    const result = await apiFetch('/applications/')

    expect(result).toEqual({
      ok: false,
      error: {
        status: 500,
        title: 'Error',
        detail: 'Възникна грешка. Моля, опитайте отново.',
      },
    })
  })

  it('extracts a detail message from an ASP.NET Core ValidationProblemDetails response', async () => {
    stubFetch(
      createJsonResponse(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
          title: 'One or more validation errors occurred.',
          status: 400,
          errors: {
            Password: [
              "The field Password must be a string or array type with a minimum length of '6'.",
            ],
          },
          traceId: '00-abc-def-00',
        },
        400,
      ),
    )

    const result = await apiFetch('/identity/login/')

    expect(result).toEqual({
      ok: false,
      error: {
        status: 400,
        title: 'One or more validation errors occurred.',
        detail: "The field Password must be a string or array type with a minimum length of '6'.",
      },
    })
  })

  it('joins error messages from multiple fields in a ValidationProblemDetails response', async () => {
    stubFetch(
      createJsonResponse(
        {
          title: 'One or more validation errors occurred.',
          status: 400,
          errors: {
            Credentials: ['Credentials error message.'],
            Password: ['Password error message.'],
          },
        },
        400,
      ),
    )

    const result = await apiFetch('/identity/login/')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.detail).toContain('Credentials error message.')
      expect(result.error.detail).toContain('Password error message.')
    }
  })

  it('returns a network-error result when fetch itself rejects', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch('/applications/')

    expect(result).toEqual({
      ok: false,
      error: {
        status: 0,
        title: 'Network Error',
        detail: 'Възникна грешка при връзката със сървъра. Моля, опитайте отново.',
      },
    })
  })

  it('calls the registered onUnauthorized listener when the response status is 401', async () => {
    const listener = vi.fn()
    onUnauthorized(listener)
    stubFetch(createJsonResponse({ status: 401, title: 'Unauthorized', detail: 'x' }, 401))

    await apiFetch('/applications/')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('does not call the registered onUnauthorized listener for a non-401 response', async () => {
    const listener = vi.fn()
    onUnauthorized(listener)
    stubFetch(createJsonResponse({}))

    await apiFetch('/applications/')

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('apiFetchBlob', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_REACT_APP_SERVER_URL', SERVER_URL)

    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()

    localStorage.clear()
  })

  it('returns an ok result with the response body as a Blob on success', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    stubFetch(new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/jpeg' } }))

    const result = await apiFetchBlob('/applications/some-id/document/')

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Not toBeInstanceOf(Blob) — running alongside other test files can
      // load a different global Blob constructor (realm mismatch), even
      // though the object is structurally a real Blob either way.
      expect(typeof result.data.arrayBuffer).toBe('function')
      expect(result.data.type).toBe('image/jpeg')
      expect(result.data.size).toBe(bytes.length)
    }
  })

  it('attaches the Authorization header when a token is stored', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stored-token')
    const fetchMock = stubFetch(new Response(new Uint8Array(), { status: 200 }))

    await apiFetchBlob('/applications/some-id/document/')

    const headers = new Headers(getRequestInit(fetchMock).headers)
    expect(headers.get('Authorization')).toBe('Bearer stored-token')
  })

  it('returns the parsed ProblemDetails error on a non-ok response', async () => {
    stubFetch(
      createJsonResponse({ status: 404, title: 'Not Found', detail: 'Кандидатурата не е намерена.' }, 404),
    )

    const result = await apiFetchBlob('/applications/missing-id/document/')

    expect(result).toEqual({
      ok: false,
      error: { status: 404, title: 'Not Found', detail: 'Кандидатурата не е намерена.' },
    })
  })

  it('clears the stored token and calls the onUnauthorized listener on a 401, same as apiFetch', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stale-token')
    const listener = vi.fn()
    onUnauthorized(listener)
    stubFetch(
      createJsonResponse({ status: 401, title: 'Unauthorized', detail: 'Session expired.' }, 401),
    )

    await apiFetchBlob('/applications/some-id/document/')

    expect(getStoredAuthToken()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
