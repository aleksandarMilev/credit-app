import { useNavigate } from 'react-router-dom'
import { LoanCalculator } from '@/components/LoanCalculator'

// TODO: placeholder annual interest rate. The real rate model (a single fixed
// rate vs. one that varies by loan amount/term) hasn't been confirmed with the
// client yet — replace this once that's settled and a real rate source exists.
const PLACEHOLDER_ANNUAL_INTEREST_RATE = 9.5

export const CalculatorPage = () => {
  const navigate = useNavigate()

  const handleApply = (amount: number, termMonths: number) => {
    void navigate('/apply', { state: { amount, termMonths } })
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-50 via-white to-white px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Кредитен калкулатор
        </h1>
        <p className="mt-3 text-base text-gray-600 sm:text-lg">
          Изчислете месечната си вноска за секунди — не се изисква регистрация.
        </p>
      </div>

      <div className="mt-10 flex w-full justify-center sm:mt-12">
        <LoanCalculator
          annualInterestRate={PLACEHOLDER_ANNUAL_INTEREST_RATE}
          onApply={handleApply}
        />
      </div>
    </div>
  )
}
