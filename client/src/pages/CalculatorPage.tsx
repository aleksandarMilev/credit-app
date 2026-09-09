import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CircleAlert, Loader2 } from 'lucide-react'
import { LoanCalculator } from '@/components/LoanCalculator'
import { useInterestRateQuery } from '@/hooks/useInterestRateQuery'

const EASE = [0.22, 1, 0.36, 1] as const

export const CalculatorPage = () => {
  const navigate = useNavigate()
  const rateQuery = useInterestRateQuery()
  const shouldReduceMotion = useReducedMotion()

  const handleApply = (amount: number, termMonths: number) => {
    void navigate('/apply', { state: { amount, termMonths } })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-cream px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-terracotta-50 via-cream to-cream"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-80 w-80 rounded-[55%_45%_40%_60%/40%_60%_45%_55%] bg-pine-100/60 blur-3xl"
        aria-hidden="true"
      />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="max-w-2xl text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Кредитен калкулатор
        </h1>
        <p className="mt-3 text-base text-stone-600 sm:text-lg">
          Изчислете месечната си вноска за секунди — не се изисква регистрация.
        </p>
      </motion.div>

      <div className="mt-10 flex w-full justify-center sm:mt-12">
        {rateQuery.isLoading && (
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-lg ring-1 ring-stone-900/5">
            <Loader2 className="h-8 w-8 animate-spin text-pine-600" aria-hidden="true" />
            <p className="mt-3 text-sm text-stone-500">Зареждане на лихвения процент...</p>
          </div>
        )}

        {rateQuery.isError && (
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-lg ring-1 ring-stone-900/5">
            <CircleAlert className="h-8 w-8 text-terracotta-500" aria-hidden="true" />
            <p role="alert" className="mt-3 text-sm font-medium text-terracotta-600">
              {rateQuery.error.message}
            </p>
          </div>
        )}

        {rateQuery.data && (
          <LoanCalculator
            annualInterestRate={rateQuery.data.annualRatePercent}
            onApply={handleApply}
          />
        )}
      </div>
    </div>
  )
}
