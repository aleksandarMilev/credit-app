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

const roundToTwoDecimals = (value: number): number => Math.round(value * 100) / 100

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
  if (amount <= 0 || termMonths <= 0) {
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
