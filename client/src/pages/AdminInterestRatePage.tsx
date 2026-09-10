import { useId, useState, type SyntheticEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'
import { useInterestRateQuery } from '@/hooks/useInterestRateQuery'
import { useUpdateInterestRateMutation } from '@/hooks/useUpdateInterestRateMutation'
import { formatDate } from '@/lib/formatDate'

// Exclusive both ends — mirrors InterestRateValidator.IsValid (server:
// Modules/InterestRate/Shared/InterestRateValidator.cs), which is stricter
// than the WebModel's inclusive [Range(0,100)] DataAnnotation. Not the same
// bound as loanCalculations.ts's MIN/MAX_ANNUAL_INTEREST_RATE constants —
// those bound what the amortization formula can safely compute (0% is a
// valid calculator input), a different concern from what rate an Approver
// may set as the site's actual rate.
const MIN_ANNUAL_RATE_PERCENT = 0
const MAX_ANNUAL_RATE_PERCENT = 100

const EASE = [0.22, 1, 0.36, 1] as const

const statusCardClassName =
  'flex flex-col items-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-900/5'

const inputClassName = (isValid: boolean) =>
  [
    'mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-stone-900 shadow-sm outline-none transition-colors focus:ring-2 sm:text-sm',
    isValid
      ? 'border-stone-200 focus:border-pine-500 focus:ring-pine-500/30'
      : 'border-terracotta-400 focus:border-terracotta-500 focus:ring-terracotta-500/30',
  ].join(' ')

export const AdminInterestRatePage = () => {
  const rateQuery = useInterestRateQuery()
  const mutation = useUpdateInterestRateMutation()
  const shouldReduceMotion = useReducedMotion()

  const rateInputId = useId()
  const rateErrorId = useId()
  const mutationErrorId = useId()

  const [rateInput, setRateInput] = useState('')

  const rateValue = Number(rateInput)
  const isPristine = rateInput.trim() === ''
  const rateIsValid =
    !isPristine &&
    Number.isFinite(rateValue) &&
    rateValue > MIN_ANNUAL_RATE_PERCENT &&
    rateValue < MAX_ANNUAL_RATE_PERCENT

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rateIsValid) return
    mutation.mutate({ annualRatePercent: rateValue })
  }

  if (rateQuery.isLoading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <div className={statusCardClassName}>
            <Loader2 className="h-8 w-8 animate-spin text-pine-500" aria-hidden="true" />
            <p className="mt-3 text-sm text-stone-500">Зареждане на лихвения процент...</p>
          </div>
        </div>
      </div>
    )
  }

  if (rateQuery.isError) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <div className={statusCardClassName}>
            <CircleAlert className="h-8 w-8 text-terracotta-500" aria-hidden="true" />
            <p role="alert" className="mt-3 text-sm font-medium text-terracotta-600">
              {rateQuery.error.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!rateQuery.data) {
    return null
  }

  const rate = rateQuery.data

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="mx-auto max-w-xl"
      >
        <h1 className="text-2xl font-bold text-stone-900">Лихвен процент</h1>
        <p className="mt-1 text-sm text-stone-500">
          Задава лихвения процент, използван в публичния калкулатор.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-8">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                Текущ лихвен процент
              </dt>
              <dd className="mt-1 text-2xl font-bold text-stone-900">{rate.annualRatePercent}%</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                Последна промяна
              </dt>
              <dd className="mt-1 text-sm text-stone-900">
                {rate.modifiedOn ? formatDate(rate.modifiedOn) : '—'} · {rate.modifiedBy ?? '—'}
              </dd>
            </div>
          </dl>

          <form className="mt-6 border-t border-stone-100 pt-6" onSubmit={handleSubmit} noValidate>
            <label htmlFor={rateInputId} className="block text-sm font-medium text-stone-700">
              Нов лихвен процент (%)
            </label>
            <input
              id={rateInputId}
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={rateInput}
              onChange={(event) => {
                setRateInput(event.target.value)
                if (mutation.isSuccess) {
                  mutation.reset()
                }
              }}
              aria-invalid={!rateIsValid && !isPristine}
              aria-describedby={!rateIsValid && !isPristine ? rateErrorId : undefined}
              className={inputClassName(rateIsValid || isPristine)}
            />
            {!rateIsValid && !isPristine && (
              <p id={rateErrorId} className="mt-1.5 text-sm text-terracotta-600">
                Лихвеният процент трябва да бъде между 0 и 100.
              </p>
            )}

            {mutation.isError && (
              <p
                id={mutationErrorId}
                role="alert"
                className="mt-3 text-sm font-medium text-terracotta-600"
              >
                {mutation.error.message}
              </p>
            )}

            {mutation.isSuccess && (
              <p role="status" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-pine-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Лихвеният процент е успешно обновен.
              </p>
            )}

            <button
              type="submit"
              disabled={!rateIsValid || mutation.isPending}
              className="mt-4 w-full rounded-lg bg-pine-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pine-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {mutation.isPending ? 'Запазване...' : 'Запази'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
