import { useId, useState } from 'react'
import { Percent, Receipt, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/formatCurrency'
import { calculateLoan, MAX_LOAN_AMOUNT, MAX_TERM_MONTHS } from '@/lib/loanCalculations'

interface LoanCalculatorProps {
  annualInterestRate: number
  onApply?: (amount: number, termMonths: number) => void
}

const DEFAULT_AMOUNT = '10000'
const DEFAULT_TERM_MONTHS = '36'

const inputClassName = (isValid: boolean) =>
  [
    'mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 sm:text-sm',
    isValid
      ? 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30'
      : 'border-red-400 focus:border-red-500 focus:ring-red-500/30',
  ].join(' ')

export const LoanCalculator = ({ annualInterestRate, onApply }: LoanCalculatorProps) => {
  const [amountInput, setAmountInput] = useState(DEFAULT_AMOUNT)
  const [termInput, setTermInput] = useState(DEFAULT_TERM_MONTHS)

  const amountId = useId()
  const termId = useId()
  const amountErrorId = useId()
  const termErrorId = useId()

  const amount = Number(amountInput)
  const termMonths = Number(termInput)

  const amountIsValid = Number.isFinite(amount) && amount > 0 && amount <= MAX_LOAN_AMOUNT
  const termIsValid =
    Number.isFinite(termMonths) && termMonths > 0 && termMonths <= MAX_TERM_MONTHS
  const hasValidInput = amountIsValid && termIsValid

  const { monthlyPayment, totalRepayment, totalInterest } = hasValidInput
    ? calculateLoan({ amount, termMonths, annualInterestRate })
    : { monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 }

  const handleApply = () => {
    if (!hasValidInput || !onApply) return
    onApply(amount, termMonths)
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-900/5 transition-shadow hover:shadow-2xl sm:p-8">
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Кредитен калкулатор</h2>
      <p className="mt-1 text-sm text-gray-500">Вижте прогнозната си месечна вноска веднага.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor={amountId} className="block text-sm font-medium text-gray-700">
            Сума на кредита
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
            aria-invalid={!amountIsValid}
            aria-describedby={amountIsValid ? undefined : amountErrorId}
            className={inputClassName(amountIsValid)}
          />
          {!amountIsValid && (
            <p id={amountErrorId} className="mt-1.5 text-sm text-red-600">
              Моля, въведете валидна сума
            </p>
          )}
        </div>

        <div>
          <label htmlFor={termId} className="block text-sm font-medium text-gray-700">
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
            aria-invalid={!termIsValid}
            aria-describedby={termIsValid ? undefined : termErrorId}
            className={inputClassName(termIsValid)}
          />
          {!termIsValid && (
            <p id={termErrorId} className="mt-1.5 text-sm text-red-600">
              Моля, въведете валиден срок
            </p>
          )}
        </div>
      </div>

      <dl className="mt-6 space-y-3">
        <div className="rounded-xl bg-primary-600 p-4 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Wallet className="h-4 w-4" aria-hidden="true" />
            </span>
            <dt className="text-xs font-medium tracking-wide text-primary-100 uppercase">
              Месечна вноска
            </dt>
          </div>
          <dd className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {formatCurrency(monthlyPayment)}
          </dd>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-primary-50 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <dt className="text-xs font-medium tracking-wide text-primary-700 uppercase">
                Обща сума за връщане
              </dt>
            </div>
            <dd className="mt-1.5 text-lg font-semibold text-gray-900 sm:text-xl">
              {formatCurrency(totalRepayment)}
            </dd>
          </div>

          <div className="rounded-xl bg-accent-50 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                <Percent className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <dt className="text-xs font-medium tracking-wide text-accent-700 uppercase">
                Обща лихва
              </dt>
            </div>
            <dd className="mt-1.5 text-lg font-semibold text-gray-900 sm:text-xl">
              {formatCurrency(totalInterest)}
            </dd>
          </div>
        </div>
      </dl>

      {onApply && (
        <button
          type="button"
          onClick={handleApply}
          disabled={!hasValidInput}
          className="mt-6 w-full rounded-lg bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-sm sm:text-base"
        >
          Кандидатствайте с тези условия
        </button>
      )}
    </div>
  )
}
