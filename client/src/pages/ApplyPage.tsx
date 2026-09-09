import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  IdCard,
  ImageUp,
  Loader2,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { apiFetch } from '@/lib/apiClient'
import { isValidEgn } from '@/lib/egnValidation'
import { MAX_LOAN_AMOUNT, MAX_TERM_MONTHS } from '@/lib/loanCalculations'

interface ApplyLocationState {
  amount: number
  termMonths: number
}

const isApplyLocationState = (value: unknown): value is ApplyLocationState =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>).amount === 'number' &&
  typeof (value as Record<string, unknown>).termMonths === 'number'

// Matches LoanCalculator's own defaults, used when someone lands here
// directly without going through the calculator first.
const DEFAULT_AMOUNT = '10000'
const DEFAULT_TERM_MONTHS = '36'

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100
const EMAIL_MIN_LENGTH = 5
const EMAIL_MAX_LENGTH = 254
const PHONE_PATTERN = /^(\+[1-9][0-9]{7,14}|0[1-9][0-9]{6,13})$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_ID_CARD_IMAGE_SIZE_BYTES = 10 * 1_024 * 1_024
const MAX_ID_CARD_IMAGE_SIZE_MB = MAX_ID_CARD_IMAGE_SIZE_BYTES / 1_024 / 1_024
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

const EASE = [0.22, 1, 0.36, 1] as const

interface FormErrors {
  firstName?: string
  lastName?: string
  egn?: string
  phone?: string
  email?: string
  requestedAmount?: string
  requestedTermMonths?: string
  idCardImage?: string
}

interface FormValues {
  firstName: string
  lastName: string
  egn: string
  phone: string
  email: string
  amountInput: string
  termInput: string
  idCardImage: File | null
}

// Mirrors IdCardImageValidator.Validate's checks and message text (see
// ApplicationsService.MapValidationError) in the same order, except for
// magic-byte content sniffing — that needs the server to read the file.
const validateIdCardImage = (file: File): string | null => {
  if (file.size === 0) {
    return 'Файлът със снимката на личната карта е празен.'
  }

  if (file.size > MAX_ID_CARD_IMAGE_SIZE_BYTES) {
    return `Файлът със снимката на личната карта трябва да е по-малък от ${String(MAX_ID_CARD_IMAGE_SIZE_MB)} MB.`
  }

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const expectedContentType = EXTENSION_CONTENT_TYPES[extension]

  if (!expectedContentType) {
    return 'Невалиден формат на файла. Позволени формати: JPG, JPEG, PNG.'
  }

  if (file.type !== expectedContentType) {
    return 'Типът на файла не съответства на неговото разширение.'
  }

  return null
}

// Mirrors SubmitApplicationWebModel's validation attributes and their exact
// Bulgarian ErrorMessage text — for fast feedback only, the server
// re-validates everything regardless of what this returns.
const validateForm = (values: FormValues): FormErrors => {
  const errors: FormErrors = {}

  if (!values.firstName.trim()) {
    errors.firstName = 'Името е задължително.'
  } else if (
    values.firstName.trim().length < NAME_MIN_LENGTH ||
    values.firstName.trim().length > NAME_MAX_LENGTH
  ) {
    errors.firstName = `Името трябва да е между ${String(NAME_MIN_LENGTH)} и ${String(NAME_MAX_LENGTH)} символа.`
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Фамилията е задължителна.'
  } else if (
    values.lastName.trim().length < NAME_MIN_LENGTH ||
    values.lastName.trim().length > NAME_MAX_LENGTH
  ) {
    errors.lastName = `Фамилията трябва да е между ${String(NAME_MIN_LENGTH)} и ${String(NAME_MAX_LENGTH)} символа.`
  }

  if (!values.egn.trim()) {
    errors.egn = 'ЕГН е задължително.'
  } else if (!isValidEgn(values.egn.trim())) {
    errors.egn = 'Невалидно ЕГН.'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Телефонният номер е задължителен.'
  } else if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = 'Невалиден телефонен номер.'
  }

  if (!values.email.trim()) {
    errors.email = 'Имейлът е задължителен.'
  } else if (
    !EMAIL_PATTERN.test(values.email.trim()) ||
    values.email.trim().length < EMAIL_MIN_LENGTH ||
    values.email.trim().length > EMAIL_MAX_LENGTH
  ) {
    errors.email = 'Невалиден имейл адрес.'
  }

  const amount = Number(values.amountInput)
  if (!values.amountInput.trim()) {
    errors.requestedAmount = 'Желаната сума е задължителна.'
  } else if (!Number.isFinite(amount) || amount < 1 || amount > MAX_LOAN_AMOUNT) {
    errors.requestedAmount = `Желаната сума трябва да е между 1 и ${String(MAX_LOAN_AMOUNT)} лв.`
  }

  const term = Number(values.termInput)
  if (!values.termInput.trim()) {
    errors.requestedTermMonths = 'Срокът на кредита е задължителен.'
  } else if (!Number.isInteger(term) || term < 1 || term > MAX_TERM_MONTHS) {
    errors.requestedTermMonths = `Срокът на кредита трябва да е между 1 и ${String(MAX_TERM_MONTHS)} месеца.`
  }

  if (!values.idCardImage) {
    errors.idCardImage = 'Снимката на личната карта е задължителна.'
  } else {
    const imageError = validateIdCardImage(values.idCardImage)
    if (imageError) {
      errors.idCardImage = imageError
    }
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

interface ApplicationSubmittedResponse {
  id: string
}

export const ApplyPage = () => {
  const location = useLocation()
  const prefill = isApplyLocationState(location.state) ? location.state : null
  const shouldReduceMotion = useReducedMotion()

  const firstNameId = useId()
  const lastNameId = useId()
  const egnId = useId()
  const phoneId = useId()
  const emailId = useId()
  const amountId = useId()
  const termId = useId()
  const idCardImageId = useId()

  const firstNameErrorId = useId()
  const lastNameErrorId = useId()
  const egnErrorId = useId()
  const phoneErrorId = useId()
  const emailErrorId = useId()
  const requestedAmountErrorId = useId()
  const requestedTermMonthsErrorId = useId()
  const idCardImageErrorId = useId()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [egn, setEgn] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [amountInput, setAmountInput] = useState(
    prefill ? String(prefill.amount) : DEFAULT_AMOUNT,
  )
  const [termInput, setTermInput] = useState(
    prefill ? String(prefill.termMonths) : DEFAULT_TERM_MONTHS,
  )
  const [idCardImage, setIdCardImage] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Created here (not in an effect) so the value is available for the very
  // render that needs it; the effect below only handles revoking it, which
  // has to happen on cleanup rather than during render.
  const previewUrl = useMemo(
    () => (idCardImage ? URL.createObjectURL(idCardImage) : null),
    [idCardImage],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const fadeUp: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }

  const staggerContainer: Variants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }

  const handleFileSelected = (file: File) => {
    setIdCardImage(file)
    setErrors((previous) => ({ ...previous, idCardImage: undefined }))
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files.item(0)
    if (file) {
      handleFileSelected(file)
    }
  }

  const handleRemoveFile = () => {
    setIdCardImage(null)
  }

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const values: FormValues = {
      firstName,
      lastName,
      egn,
      phone,
      email,
      amountInput,
      termInput,
      idCardImage,
    }

    const validationErrors = validateForm(values)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('FirstName', firstName.trim())
    formData.append('LastName', lastName.trim())
    formData.append('Egn', egn.trim())
    formData.append('Phone', phone.trim())
    formData.append('Email', email.trim())
    formData.append('RequestedAmount', amountInput)
    formData.append('RequestedTermMonths', termInput)
    if (idCardImage) {
      formData.append('IdCardImage', idCardImage)
    }

    const result = await apiFetch<ApplicationSubmittedResponse>('/applications/', {
      method: 'POST',
      body: formData,
    })

    setIsSubmitting(false)

    if (!result.ok) {
      setSubmitError(result.error.detail)
      return
    }

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-12 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-pine-100 via-cream to-sunny-100"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-[-15%] right-[-10%] -z-10 h-80 w-80 rounded-[55%_45%_40%_60%/40%_60%_45%_55%] bg-terracotta-100/60 blur-3xl"
          aria-hidden="true"
        />

        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24, scale: 0.96 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-stone-900/5 sm:p-10"
        >
          <motion.span
            initial={shouldReduceMotion ? undefined : { scale: 0.6, rotate: -8 }}
            animate={shouldReduceMotion ? undefined : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pine-600 text-white shadow-md"
          >
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </motion.span>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            Кандидатурата е изпратена успешно!
          </h1>
          <p className="mt-3 text-base text-stone-600">
            Изпратихме потвърждение на посочения от вас имейл адрес. Нашият екип ще прегледа
            заявлението ви и ще се свърже с вас с решение.
          </p>
          <motion.span
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            className="mt-8 inline-block"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pine-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_4px_0_0_var(--color-pine-800)] transition-colors duration-200 hover:bg-pine-700 focus:outline-none focus:ring-4 focus:ring-pine-200"
            >
              Обратно към началната страница
            </Link>
          </motion.span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-cream px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-pine-50 via-cream to-cream"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[-10%] left-[-10%] -z-10 h-80 w-80 rounded-[55%_45%_40%_60%/40%_60%_45%_55%] bg-terracotta-100/60 blur-3xl"
        aria-hidden="true"
      />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="max-w-2xl text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Кандидатствай за кредит
        </h1>
        <p className="mt-3 text-base text-stone-600 sm:text-lg">
          Попълни данните си и качи снимка на личната карта — целият процес отнема само няколко
          минути.
        </p>
      </motion.div>

      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-10 w-full max-w-2xl space-y-6"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
        noValidate
      >
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-900/5 sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700 ring-1 ring-pine-100">
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold text-stone-900">Лични данни</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={firstNameId} className="block text-sm font-medium text-stone-700">
                Име
              </label>
              <input
                id={firstNameId}
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value)
                }}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? firstNameErrorId : undefined}
                className={inputClassName(Boolean(errors.firstName))}
              />
              {errors.firstName && (
                <p id={firstNameErrorId} className="mt-1.5 text-sm text-terracotta-600">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={lastNameId} className="block text-sm font-medium text-stone-700">
                Фамилия
              </label>
              <input
                id={lastNameId}
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value)
                }}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? lastNameErrorId : undefined}
                className={inputClassName(Boolean(errors.lastName))}
              />
              {errors.lastName && (
                <p id={lastNameErrorId} className="mt-1.5 text-sm text-terracotta-600">
                  {errors.lastName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={egnId} className="block text-sm font-medium text-stone-700">
                ЕГН
              </label>
              <input
                id={egnId}
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={egn}
                onChange={(event) => {
                  setEgn(event.target.value)
                }}
                aria-invalid={Boolean(errors.egn)}
                aria-describedby={errors.egn ? egnErrorId : undefined}
                className={inputClassName(Boolean(errors.egn))}
              />
              {errors.egn && (
                <p id={egnErrorId} className="mt-1.5 text-sm text-terracotta-600">
                  {errors.egn}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={phoneId} className="block text-sm font-medium text-stone-700">
                Телефон
              </label>
              <input
                id={phoneId}
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                }}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? phoneErrorId : undefined}
                className={inputClassName(Boolean(errors.phone))}
              />
              {errors.phone && (
                <p id={phoneErrorId} className="mt-1.5 text-sm text-terracotta-600">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={emailId} className="block text-sm font-medium text-stone-700">
                Имейл
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? emailErrorId : undefined}
                className={inputClassName(Boolean(errors.email))}
              />
              {errors.email && (
                <p id={emailErrorId} className="mt-1.5 text-sm text-terracotta-600">
                  {errors.email}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-900/5 sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-100">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold text-stone-900">Параметри на кредита</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={amountId} className="block text-sm font-medium text-stone-700">
                Желана сума
              </label>
              <input
                id={amountId}
                type="number"
                inputMode="decimal"
                min="0"
                max={MAX_LOAN_AMOUNT}
                step="100"
                value={amountInput}
                onChange={(event) => {
                  setAmountInput(event.target.value)
                }}
                aria-invalid={Boolean(errors.requestedAmount)}
                aria-describedby={errors.requestedAmount ? requestedAmountErrorId : undefined}
                className={inputClassName(Boolean(errors.requestedAmount))}
              />
              {errors.requestedAmount && (
                <p id={requestedAmountErrorId} className="mt-1.5 text-sm text-terracotta-600">
                  {errors.requestedAmount}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={termId} className="block text-sm font-medium text-stone-700">
                Срок (месеци)
              </label>
              <input
                id={termId}
                type="number"
                inputMode="numeric"
                min="1"
                max={MAX_TERM_MONTHS}
                step="1"
                value={termInput}
                onChange={(event) => {
                  setTermInput(event.target.value)
                }}
                aria-invalid={Boolean(errors.requestedTermMonths)}
                aria-describedby={
                  errors.requestedTermMonths ? requestedTermMonthsErrorId : undefined
                }
                className={inputClassName(Boolean(errors.requestedTermMonths))}
              />
              {errors.requestedTermMonths && (
                <p id={requestedTermMonthsErrorId} className="mt-1.5 text-sm text-terracotta-600">
                  {errors.requestedTermMonths}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-900/5 sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunny-50 text-sunny-700 ring-1 ring-sunny-100">
              <IdCard className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold text-stone-900">Снимка на личната карта</h2>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Качете ясна снимка на личната си карта (JPG или PNG, до 10 MB).
          </p>

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => {
              setIsDragging(false)
            }}
            onDrop={handleDrop}
            className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging ? 'border-sunny-500 bg-sunny-100/60' : 'border-sunny-200 bg-sunny-50/40'
            }`}
          >
            {idCardImage ? (
              <div className="flex flex-col items-center gap-3">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Преглед на качената снимка на личната карта"
                    className="h-32 w-auto rounded-xl object-cover shadow-sm ring-1 ring-stone-900/10"
                  />
                )}
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <span>{idCardImage.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    aria-label="Премахни файла"
                    className="text-stone-400 transition-colors hover:text-terracotta-600"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ImageUp className="h-8 w-8 text-sunny-600" aria-hidden="true" />
                <p className="mt-2 text-sm text-stone-600">
                  Плъзнете файл тук или{' '}
                  <label
                    htmlFor={idCardImageId}
                    className="cursor-pointer font-semibold text-terracotta-600 underline decoration-terracotta-300 decoration-2 underline-offset-2 transition-colors hover:text-terracotta-700"
                  >
                    изберете от компютъра
                  </label>
                </p>
              </>
            )}
            <input
              id={idCardImageId}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileInputChange}
              aria-invalid={Boolean(errors.idCardImage)}
              aria-describedby={errors.idCardImage ? idCardImageErrorId : undefined}
              className="sr-only"
            />
          </div>

          {errors.idCardImage && (
            <p id={idCardImageErrorId} className="mt-2 text-sm text-terracotta-600">
              {errors.idCardImage}
            </p>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-4">
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl bg-terracotta-50 p-4 ring-1 ring-terracotta-200"
            >
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-terracotta-600"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-terracotta-700">{submitError}</p>
            </div>
          )}

          <motion.button
            whileHover={shouldReduceMotion || isSubmitting ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion || isSubmitting ? undefined : { scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_0_var(--color-terracotta-700)] transition-colors duration-200 hover:bg-terracotta-600 focus:outline-none focus:ring-4 focus:ring-terracotta-200 disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none sm:text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Изпращане...
              </>
            ) : (
              <>
                Изпрати кандидатурата
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </div>
  )
}
