import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Percent, Receipt, Wallet } from 'lucide-react'
import { AnimatedCurrency } from '@/components/AnimatedCurrency'
import { calculateLoan, MAX_LOAN_AMOUNT, MAX_TERM_MONTHS } from '@/lib/loanCalculations'

interface LoanCalculatorProps {
  annualInterestRate: number
  onApply?: (amount: number, termMonths: number) => void
}

const DEFAULT_AMOUNT = '10000'
const DEFAULT_TERM_MONTHS = '36'

const EASE = [0.22, 1, 0.36, 1] as const

const inputClassName = (isValid: boolean) =>
  [
    'mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-stone-900 shadow-sm outline-none transition-colors focus:ring-2 sm:text-sm',
    isValid
      ? 'border-stone-200 focus:border-pine-500 focus:ring-pine-500/30'
      : 'border-terracotta-400 focus:border-terracotta-500 focus:ring-terracotta-500/30',
  ].join(' ')

export const LoanCalculator = ({ annualInterestRate, onApply }: LoanCalculatorProps) => {
  const shouldReduceMotion = useReducedMotion()

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
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-900/5 transition-shadow duration-200 hover:shadow-xl sm:p-8"
    >
      <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">Кредитен калкулатор</h2>
      <p className="mt-1 text-sm text-stone-500">Вижте прогнозната си месечна вноска веднага.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor={amountId} className="block text-sm font-medium text-stone-700">
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
            <p id={amountErrorId} className="mt-1.5 text-sm text-terracotta-600">
              Моля, въведете валидна сума
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
            aria-invalid={!termIsValid}
            aria-describedby={termIsValid ? undefined : termErrorId}
            className={inputClassName(termIsValid)}
          />
          {!termIsValid && (
            <p id={termErrorId} className="mt-1.5 text-sm text-terracotta-600">
              Моля, въведете валиден срок
            </p>
          )}
        </div>
      </div>

      <dl className="mt-6 space-y-3">
        <div className="rounded-2xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 p-5 text-white shadow-md sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Wallet className="h-4 w-4" aria-hidden="true" />
            </span>
            <dt className="text-xs font-semibold tracking-wide text-terracotta-50 uppercase">
              Месечна вноска
            </dt>
          </div>
          <dd className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            <AnimatedCurrency value={monthlyPayment} />
          </dd>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-pine-50 p-4 ring-1 ring-pine-100">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine-100 text-pine-700">
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <dt className="text-xs font-medium tracking-wide text-pine-700 uppercase">
                Обща сума за връщане
              </dt>
            </div>
            <dd className="mt-1.5 text-lg font-semibold text-stone-900 sm:text-xl">
              <AnimatedCurrency value={totalRepayment} />
            </dd>
          </div>

          <div className="rounded-xl bg-sunny-50 p-4 ring-1 ring-sunny-100">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunny-100 text-sunny-700">
                <Percent className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <dt className="text-xs font-medium tracking-wide text-sunny-700 uppercase">
                Обща лихва
              </dt>
            </div>
            <dd className="mt-1.5 text-lg font-semibold text-stone-900 sm:text-xl">
              <AnimatedCurrency value={totalInterest} />
            </dd>
          </div>
        </div>
      </dl>

      {onApply && (
        <motion.button
          whileHover={shouldReduceMotion || !hasValidInput ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion || !hasValidInput ? undefined : { scale: 0.98 }}
          type="button"
          onClick={handleApply}
          disabled={!hasValidInput}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_0_var(--color-terracotta-700)] transition-colors duration-200 hover:bg-terracotta-600 focus:outline-none focus:ring-4 focus:ring-terracotta-200 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none sm:text-base"
        >
          Кандидатствайте с тези условия
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </motion.button>
      )}
    </motion.div>
  )
}
