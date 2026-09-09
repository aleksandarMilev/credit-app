import { useId, useState, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CircleAlert, Loader2, LogIn } from 'lucide-react'
import { apiFetch } from '@/lib/apiClient'
import { useAuthStore } from '@/store/useAuthStore'

interface LoginResponse {
  token: string
}

const ADMIN_ROUTE = '/admin'

const CREDENTIALS_MIN_LENGTH = 3
const CREDENTIALS_MAX_LENGTH = 254
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 128

const EASE = [0.22, 1, 0.36, 1] as const

interface FormErrors {
  credentials?: string
  password?: string
}

// Mirrors LoginWebModel's [Required]/[StringLength] bounds — for fast
// feedback only, the server re-validates everything regardless of what
// this returns.
const validateForm = (credentials: string, password: string): FormErrors => {
  const errors: FormErrors = {}

  if (!credentials.trim()) {
    errors.credentials = 'Потребителското име или имейлът е задължителен.'
  } else if (
    credentials.trim().length < CREDENTIALS_MIN_LENGTH ||
    credentials.trim().length > CREDENTIALS_MAX_LENGTH
  ) {
    errors.credentials = `Потребителското име или имейлът трябва да е между ${String(CREDENTIALS_MIN_LENGTH)} и ${String(CREDENTIALS_MAX_LENGTH)} символа.`
  }

  if (!password) {
    errors.password = 'Паролата е задължителна.'
  } else if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Паролата трябва да е между ${String(PASSWORD_MIN_LENGTH)} и ${String(PASSWORD_MAX_LENGTH)} символа.`
  }

  return errors
}

const inputClassName = (hasError: boolean) =>
  [
    'mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-stone-900 shadow-sm outline-none transition-colors focus:ring-2 sm:text-sm',
    hasError
      ? 'border-terracotta-400 focus:border-terracotta-500 focus:ring-terracotta-500/30'
      : 'border-stone-200 focus:border-pine-500 focus:ring-pine-500/30',
  ].join(' ')

export const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const shouldReduceMotion = useReducedMotion()

  const credentialsId = useId()
  const passwordId = useId()
  const credentialsErrorId = useId()
  const passwordErrorId = useId()

  const [credentials, setCredentials] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validateForm(credentials, password)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    const result = await apiFetch<LoginResponse>('/identity/login/', {
      method: 'POST',
      body: { credentials: credentials.trim(), password },
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-pine-950 px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-pine-950 via-pine-900 to-pine-950"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-[55%_45%_40%_60%/40%_60%_45%_55%] bg-pine-800/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-[45%_55%_60%_40%/55%_45%_60%_40%] bg-pine-800/40 blur-3xl"
        aria-hidden="true"
      />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/5 sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-pine-600 text-white shadow-sm">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-stone-900">Вход за служители</h1>
          <p className="mt-1 text-sm text-stone-500">Достъп само за оторизиран персонал.</p>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
          noValidate
        >
          <div>
            <label htmlFor={credentialsId} className="block text-sm font-medium text-stone-700">
              Потребителско име или имейл
            </label>
            <input
              id={credentialsId}
              type="text"
              autoComplete="username"
              value={credentials}
              onChange={(event) => {
                setCredentials(event.target.value)
              }}
              aria-invalid={Boolean(errors.credentials)}
              aria-describedby={errors.credentials ? credentialsErrorId : undefined}
              className={inputClassName(Boolean(errors.credentials))}
            />
            {errors.credentials && (
              <p id={credentialsErrorId} className="mt-1.5 text-sm text-terracotta-600">
                {errors.credentials}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-stone-700">
              Парола
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? passwordErrorId : undefined}
              className={inputClassName(Boolean(errors.password))}
            />
            {errors.password && (
              <p id={passwordErrorId} className="mt-1.5 text-sm text-terracotta-600">
                {errors.password}
              </p>
            )}
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl bg-terracotta-50 p-4 ring-1 ring-terracotta-200"
            >
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-terracotta-600"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-terracotta-700">{errorMessage}</p>
            </div>
          )}

          <motion.button
            whileHover={shouldReduceMotion || isSubmitting ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion || isSubmitting ? undefined : { scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta-500 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_0_var(--color-terracotta-700)] transition-colors duration-200 hover:bg-terracotta-600 focus:outline-none focus:ring-4 focus:ring-terracotta-200 disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Влизане...' : 'Вход'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
