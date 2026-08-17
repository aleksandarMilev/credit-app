import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, getStoredAuthToken } from '@/lib/apiClient'

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
    stubFetch(createJsonResponse({}, 401))

    await expect(apiFetch('/applications/')).rejects.toThrow()

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

  it('returns the parsed JSON body on success', async () => {
    stubFetch(createJsonResponse({ token: 'abc' }))

    const result = await apiFetch<{ token: string }>('/identity/login/')

    expect(result).toEqual({ token: 'abc' })
  })

  it('throws for a non-ok response', async () => {
    stubFetch(createJsonResponse({ error: 'nope' }, 400))

    await expect(apiFetch('/applications/')).rejects.toThrow('400')
  })
})
