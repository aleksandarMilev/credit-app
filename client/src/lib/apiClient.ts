// Key under which the staff JWT is stored in localStorage once the auth store
// (a later step) is built. Kept here since apiFetch is what reads/clears it.
const AUTH_TOKEN_STORAGE_KEY = 'auth_token'

type ApiFetchBody = FormData | Record<string, unknown>

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: ApiFetchBody
}

export const getStoredAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

export const clearStoredAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
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

  const response = await fetch(`${import.meta.env.VITE_REACT_APP_SERVER_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    clearStoredAuthToken()
  }

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status.toString()}`)
  }

  return (await response.json()) as T
}
