import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoanCalculator } from '@/components/LoanCalculator'

const setLoanInputs = async (amount: string, termMonths: string) => {
  const user = userEvent.setup()

  const amountInput = screen.getByLabelText(/loan amount/i)
  await user.clear(amountInput)
  await user.type(amountInput, amount)

  const termInput = screen.getByLabelText(/term/i)
  await user.clear(termInput)
  await user.type(termInput, termMonths)

  return user
}

describe('LoanCalculator', () => {
  it('updates the displayed results when the inputs change', async () => {
    render(<LoanCalculator annualInterestRate={0} />)

    await setLoanInputs('1200', '12')

    expect(screen.getByText('100.00')).toBeInTheDocument()
    expect(screen.getByText('1200.00')).toBeInTheDocument()
    expect(screen.getByText('0.00')).toBeInTheDocument()
  })

  it('does not render an apply button when onApply is not provided', () => {
    render(<LoanCalculator annualInterestRate={5} />)

    expect(
      screen.queryByRole('button', { name: /apply with these terms/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onApply with the current amount and term when clicked', async () => {
    const handleApply = vi.fn()
    render(<LoanCalculator annualInterestRate={0} onApply={handleApply} />)

    const user = await setLoanInputs('1200', '12')
    await user.click(screen.getByRole('button', { name: /apply with these terms/i }))

    expect(handleApply).toHaveBeenCalledTimes(1)
    expect(handleApply).toHaveBeenCalledWith(1200, 12)
  })
})
