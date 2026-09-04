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

  it('returns a zeroed result for a negative interest rate', () => {
    const result = calculateLoan({ amount: 1000, termMonths: 12, annualInterestRate: -5 })

    expect(result).toEqual({ monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 })
  })

  it('returns a zeroed result for an interest rate of 100 or more', () => {
    const result = calculateLoan({ amount: 1000, termMonths: 12, annualInterestRate: 100 })

    expect(result).toEqual({ monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 })
  })

  it('returns a zeroed result for a non-finite interest rate', () => {
    const result = calculateLoan({ amount: 1000, termMonths: 12, annualInterestRate: Infinity })

    expect(result).toEqual({ monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 })
  })

  it('still computes a positive payment for a valid rate just below the upper bound', () => {
    const result = calculateLoan({ amount: 1000, termMonths: 12, annualInterestRate: 99 })

    expect(result.monthlyPayment).toBeGreaterThan(0)
  })
})
