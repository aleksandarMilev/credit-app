import { useNavigate } from 'react-router-dom'
import { CircleAlert, Loader2 } from 'lucide-react'
import { LoanCalculator } from '@/components/LoanCalculator'
import { useInterestRateQuery } from '@/hooks/useInterestRateQuery'

export const CalculatorPage = () => {
  const navigate = useNavigate()
  const rateQuery = useInterestRateQuery()

  const handleApply = (amount: number, termMonths: number) => {
    void navigate('/apply', { state: { amount, termMonths } })
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-primary-50 via-white to-white px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Кредитен калкулатор
        </h1>
        <p className="mt-3 text-base text-gray-600 sm:text-lg">
          Изчислете месечната си вноска за секунди — не се изисква регистрация.
        </p>
      </div>

      <div className="mt-10 flex w-full justify-center sm:mt-12">
        {rateQuery.isLoading && (
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-xl ring-1 ring-gray-900/5">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" aria-hidden="true" />
            <p className="mt-3 text-sm text-gray-500">Зареждане на лихвения процент...</p>
          </div>
        )}

        {rateQuery.isError && (
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-xl ring-1 ring-gray-900/5">
            <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
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
