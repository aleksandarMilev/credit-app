import { useId, useState } from 'react'
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
      ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/30'
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
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-900/5 sm:p-8">
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

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Месечна вноска
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
            {formatCurrency(monthlyPayment)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Обща сума за връщане
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
            {formatCurrency(totalRepayment)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Обща лихва
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
            {formatCurrency(totalInterest)}
          </dd>
        </div>
      </dl>

      {onApply && (
        <button
          type="button"
          onClick={handleApply}
          disabled={!hasValidInput}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        >
          Кандидатствайте с тези условия
        </button>
      )}
    </div>
  )
}
