import { useId, useState } from 'react'
import { calculateLoan } from '@/lib/loanCalculations'

interface LoanCalculatorProps {
  annualInterestRate: number
  onApply?: (amount: number, termMonths: number) => void
}

const DEFAULT_AMOUNT = '10000'
const DEFAULT_TERM_MONTHS = '36'

export const LoanCalculator = ({ annualInterestRate, onApply }: LoanCalculatorProps) => {
  const [amountInput, setAmountInput] = useState(DEFAULT_AMOUNT)
  const [termInput, setTermInput] = useState(DEFAULT_TERM_MONTHS)

  const amountId = useId()
  const termId = useId()

  const amount = Number(amountInput)
  const termMonths = Number(termInput)
  const hasValidInput =
    Number.isFinite(amount) && Number.isFinite(termMonths) && amount > 0 && termMonths > 0

  const { monthlyPayment, totalRepayment, totalInterest } = hasValidInput
    ? calculateLoan({ amount, termMonths, annualInterestRate })
    : { monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 }

  const handleApply = () => {
    if (!hasValidInput || !onApply) return
    onApply(amount, termMonths)
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-900/5 sm:p-8">
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Loan calculator</h2>
      <p className="mt-1 text-sm text-gray-500">See your estimated monthly payment instantly.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor={amountId} className="block text-sm font-medium text-gray-700">
            Loan amount
          </label>
          <input
            id={amountId}
            type="number"
            inputMode="decimal"
            min="0"
            step="100"
            value={amountInput}
            onChange={(event) => {
              setAmountInput(event.target.value)
            }}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor={termId} className="block text-sm font-medium text-gray-700">
            Term (months)
          </label>
          <input
            id={termId}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={termInput}
            onChange={(event) => {
              setTermInput(event.target.value)
            }}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:text-sm"
          />
        </div>
      </div>

      {/*
        TODO: plain .toFixed(2) for now — swap for Intl.NumberFormat with the
        correct locale/currency once the target currency is confirmed (see
        product-description.md — currency is not yet decided).
      */}
      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Monthly payment
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
            {monthlyPayment.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Total repayment
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
            {totalRepayment.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Total interest
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
            {totalInterest.toFixed(2)}
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
          Apply with these terms
        </button>
      )}
    </div>
  )
}
