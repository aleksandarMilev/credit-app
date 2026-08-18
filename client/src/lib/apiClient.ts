// Key under which the staff JWT is stored in localStorage. Kept private to
// this file — apiFetch reads/clears it directly, and useAuthStore writes/
// clears it through the exported functions below rather than duplicating
// the key name.
const AUTH_TOKEN_STORAGE_KEY = 'auth_token'

const GENERIC_ERROR_DETAIL = 'Възникна грешка. Моля, опитайте отново.'
const NETWORK_ERROR_DETAIL = 'Възникна грешка при връзката със сървъра. Моля, опитайте отново.'

type ApiFetchBody = FormData | Record<string, unknown>

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: ApiFetchBody
}

export interface ApiErrorDetails {
  status: number
  title: string
  detail: string
}

export interface ApiSuccess<T> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: ApiErrorDetails
}

export type ApiResult<T> = ApiSuccess<T> | ApiError

export const getStoredAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

export const setStoredAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export const clearStoredAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

type UnauthorizedListener = () => void

let unauthorizedListener: UnauthorizedListener | null = null

// Lets a consumer (the auth store) react to a 401 without this file
// depending on it directly — apiClient.ts stays framework-agnostic; the
// store calls this to register itself instead of apiClient importing
// Zustand. apiFetch calls the registered listener on every 401, so the
// store's in-memory token state can never go stale relative to
// localStorage, not even mid-session (not just on an explicit logout()).
export const onUnauthorized = (listener: UnauthorizedListener): void => {
  unauthorizedListener = listener
}

const isProblemDetails = (value: unknown): value is ApiErrorDetails => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.status === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.detail === 'string'
  )
}

const networkError = (): ApiErrorDetails => ({
  status: 0,
  title: 'Network Error',
  detail: NETWORK_ERROR_DETAIL,
})

// Matches the ProblemDetails shape produced by the backend's CreateProblem
// helper in ResultProfile.cs (status/title/detail). Falls back to a generic
// Bulgarian message if the body isn't that shape for some reason.
const parseErrorResponse = async (response: Response): Promise<ApiErrorDetails> => {
  try {
    const body: unknown = await response.json()

    if (isProblemDetails(body)) {
      return body
    }
  } catch {
    // response body wasn't valid JSON — fall through to the generic error below
  }

  return {
    status: response.status,
    title: response.statusText || 'Error',
    detail: GENERIC_ERROR_DETAIL,
  }
}

const buildFetchInit = (options: ApiFetchOptions): RequestInit => {
  const { body, headers, ...rest } = options
  const isFormData = body instanceof FormData

  const requestHeaders = new Headers(headers)

  const token = getStoredAuthToken()
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  // FormData needs the browser to set its own multipart boundary in
  // Content-Type — setting it manually breaks the upload.
  if (!isFormData && body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  return {
    ...rest,
    headers: requestHeaders,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  }
}

// Shared by apiFetch and apiFetchBlob: builds the request, attaches the
// auth header, and handles 401/network/non-ok responses identically.
// Callers only differ in how they parse a successful response body.
const sendRequest = async (
  path: string,
  options: ApiFetchOptions,
): Promise<Response | ApiErrorDetails> => {
  let response: Response

  try {
    response = await fetch(
      `${import.meta.env.VITE_REACT_APP_SERVER_URL}${path}`,
      buildFetchInit(options),
    )
  } catch {
    return networkError()
  }

  if (response.status === 401) {
    clearStoredAuthToken()
    unauthorizedListener?.()
  }

  if (!response.ok) {
    return await parseErrorResponse(response)
  }

  return response
}

const isErrorDetails = (value: Response | ApiErrorDetails): value is ApiErrorDetails =>
  !(value instanceof Response)

export const apiFetch = async <T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<T>> => {
  const result = await sendRequest(path, options)

  if (isErrorDetails(result)) {
    return { ok: false, error: result }
  }

  try {
    const data = (await result.json()) as T
    return { ok: true, data }
  } catch {
    return { ok: false, error: networkError() }
  }
}

// For endpoints that return binary content (e.g. the ID card image at
// GET /applications/{id}/document/) rather than JSON — apiFetch<T> can't be
// pointed at these since it unconditionally calls .json() on success.
export const apiFetchBlob = async (
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<Blob>> => {
  const result = await sendRequest(path, options)

  if (isErrorDetails(result)) {
    return { ok: false, error: result }
  }

  try {
    const data = await result.blob()
    return { ok: true, data }
  } catch {
    return { ok: false, error: networkError() }
  }
}
