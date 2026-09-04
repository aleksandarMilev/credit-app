import { useId, useState, type SyntheticEvent } from 'react'
import { CircleAlert, Loader2 } from 'lucide-react'
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

const inputClassName = (isValid: boolean) =>
  [
    'mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 sm:text-sm',
    isValid
      ? 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30'
      : 'border-red-400 focus:border-red-500 focus:ring-red-500/30',
  ].join(' ')

export const AdminInterestRatePage = () => {
  const rateQuery = useInterestRateQuery()
  const mutation = useUpdateInterestRateMutation()

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="flex flex-col items-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" aria-hidden="true" />
          <p className="mt-3 text-sm text-gray-500">Зареждане на лихвения процент...</p>
        </div>
      </div>
    )
  }

  if (rateQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="flex flex-col items-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
          <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {rateQuery.error.message}
          </p>
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
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-bold text-gray-900">Лихвен процент</h1>
        <p className="mt-1 text-sm text-gray-500">
          Задава лихвения процент, използван в публичния калкулатор.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Текущ лихвен процент
              </dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900">{rate.annualRatePercent}%</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Последна промяна
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {rate.modifiedOn ? formatDate(rate.modifiedOn) : '—'} · {rate.modifiedBy ?? '—'}
              </dd>
            </div>
          </dl>

          <form className="mt-6 border-t border-gray-100 pt-6" onSubmit={handleSubmit} noValidate>
            <label htmlFor={rateInputId} className="block text-sm font-medium text-gray-700">
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
              }}
              aria-invalid={!rateIsValid && !isPristine}
              aria-describedby={!rateIsValid && !isPristine ? rateErrorId : undefined}
              className={inputClassName(rateIsValid || isPristine)}
            />
            {!rateIsValid && !isPristine && (
              <p id={rateErrorId} className="mt-1.5 text-sm text-red-600">
                Лихвеният процент трябва да бъде между 0 и 100.
              </p>
            )}

            {mutation.isError && (
              <p id={mutationErrorId} role="alert" className="mt-3 text-sm font-medium text-red-600">
                {mutation.error.message}
              </p>
            )}

            <button
              type="submit"
              disabled={!rateIsValid || mutation.isPending}
              className="mt-4 w-full rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-sm sm:w-auto"
            >
              {mutation.isPending ? 'Запазване...' : 'Запази'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
