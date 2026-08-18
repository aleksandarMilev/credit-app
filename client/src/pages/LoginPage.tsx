import { useId, useState, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { apiFetch } from '@/lib/apiClient'
import { useAuthStore } from '@/store/useAuthStore'

interface LoginResponse {
  token: string
}

const ADMIN_ROUTE = '/admin'

export const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const credentialsId = useId()
  const passwordId = useId()

  const [credentials, setCredentials] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    setErrorMessage(null)
    setIsSubmitting(true)

    const result = await apiFetch<LoginResponse>('/identity/login/', {
      method: 'POST',
      body: { credentials, password },
    })

    setIsSubmitting(false)

    if (!result.ok) {
      setErrorMessage(result.error.detail)
      return
    }

    login(result.data.token)
    void navigate(ADMIN_ROUTE)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Вход за служители</h1>
          <p className="mt-1 text-sm text-gray-500">Достъп само за оторизиран персонал.</p>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <div>
            <label htmlFor={credentialsId} className="block text-sm font-medium text-gray-700">
              Потребителско име или имейл
            </label>
            <input
              id={credentialsId}
              type="text"
              autoComplete="username"
              required
              value={credentials}
              onChange={(event) => {
                setCredentials(event.target.value)
              }}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700">
              Парола
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 sm:text-sm"
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-sm"
          >
            {isSubmitting ? 'Влизане...' : 'Вход'}
          </button>
        </form>
      </div>
    </div>
  )
}
