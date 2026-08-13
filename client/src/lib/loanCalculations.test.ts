import { calculateLoan } from '@/lib/loanCalculations'

describe('calculateLoan', () => {
  it('computes monthly payment, total repayment, and total interest for a standard loan', () => {
    const result = calculateLoan({ amount: 10000, termMonths: 12, annualInterestRate: 6 })

    expect(result.monthlyPayment).toBeCloseTo(860.66, 1)
    expect(result.totalRepayment).toBeCloseTo(10327.97, 1)
    expect(result.totalInterest).toBeCloseTo(327.97, 1)
  })

  it('falls back to simple division when the interest rate is zero', () => {
    const result = calculateLoan({ amount: 1200, termMonths: 12, annualInterestRate: 0 })

    expect(result).toEqual({ monthlyPayment: 100, totalRepayment: 1200, totalInterest: 0 })
  })

  it('handles a one-month term correctly', () => {
    const result = calculateLoan({ amount: 1000, termMonths: 1, annualInterestRate: 12 })

    expect(result).toEqual({ monthlyPayment: 1010, totalRepayment: 1010, totalInterest: 10 })
  })
})
