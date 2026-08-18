export interface LoanCalculationInput {
  amount: number
  termMonths: number
  annualInterestRate: number
}

export interface LoanCalculationResult {
  monthlyPayment: number
  totalRepayment: number
  totalInterest: number
}

export const MAX_LOAN_AMOUNT = 1_000_000
export const MAX_TERM_MONTHS = 360

const MIN_ANNUAL_INTEREST_RATE = 0
const MAX_ANNUAL_INTEREST_RATE = 100

const roundToTwoDecimals = (value: number): number => Math.round(value * 100) / 100

const isValidAnnualInterestRate = (annualInterestRate: number): boolean =>
  Number.isFinite(annualInterestRate) &&
  annualInterestRate >= MIN_ANNUAL_INTEREST_RATE &&
  annualInterestRate < MAX_ANNUAL_INTEREST_RATE

const calculateAmortizedMonthlyPayment = (
  amount: number,
  termMonths: number,
  annualInterestRate: number,
): number => {
  const monthlyInterestRate = annualInterestRate / 100 / 12
  const growthFactor = Math.pow(1 + monthlyInterestRate, termMonths)

  return (amount * monthlyInterestRate * growthFactor) / (growthFactor - 1)
}

export const calculateLoan = ({
  amount,
  termMonths,
  annualInterestRate,
}: LoanCalculationInput): LoanCalculationResult => {
  if (amount <= 0 || termMonths <= 0 || !isValidAnnualInterestRate(annualInterestRate)) {
    return { monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 }
  }

  const monthlyPayment =
    annualInterestRate === 0
      ? amount / termMonths
      : calculateAmortizedMonthlyPayment(amount, termMonths, annualInterestRate)

  const totalRepayment = monthlyPayment * termMonths
  const totalInterest = totalRepayment - amount

  return {
    monthlyPayment: roundToTwoDecimals(monthlyPayment),
    totalRepayment: roundToTwoDecimals(totalRepayment),
    totalInterest: roundToTwoDecimals(totalInterest),
  }
}
