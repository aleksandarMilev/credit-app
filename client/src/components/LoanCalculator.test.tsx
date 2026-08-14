import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoanCalculator } from '@/components/LoanCalculator'
import { formatCurrency } from '@/lib/formatCurrency'

// React Testing Library's default text normalizer collapses all whitespace
// (including the non-breaking space Intl.NumberFormat uses) to a plain space
// before matching — normalize our expected currency string the same way.
const normalizeWhitespace = (value: string) => value.replace(/\s/g, ' ')

const setLoanInputs = async (amount: string, termMonths: string) => {
  const user = userEvent.setup()

  const amountInput = screen.getByLabelText('Сума на кредита')
  await user.clear(amountInput)
  await user.type(amountInput, amount)

  const termInput = screen.getByLabelText('Срок (месеци)')
  await user.clear(termInput)
  await user.type(termInput, termMonths)

  return user
}

describe('LoanCalculator', () => {
  it('updates the displayed results when the inputs change', async () => {
    render(<LoanCalculator annualInterestRate={0} />)

    await setLoanInputs('1200', '12')

    expect(screen.getByText(normalizeWhitespace(formatCurrency(100)))).toBeInTheDocument()
    expect(screen.getByText(normalizeWhitespace(formatCurrency(1200)))).toBeInTheDocument()
    expect(screen.getByText(normalizeWhitespace(formatCurrency(0)))).toBeInTheDocument()
  })

  it('does not render an apply button when onApply is not provided', () => {
    render(<LoanCalculator annualInterestRate={5} />)

    expect(
      screen.queryByRole('button', { name: 'Кандидатствайте с тези условия' }),
    ).not.toBeInTheDocument()
  })

  it('calls onApply with the current amount and term when clicked', async () => {
    const handleApply = vi.fn()
    render(<LoanCalculator annualInterestRate={0} onApply={handleApply} />)

    const user = await setLoanInputs('1200', '12')
    await user.click(screen.getByRole('button', { name: 'Кандидатствайте с тези условия' }))

    expect(handleApply).toHaveBeenCalledTimes(1)
    expect(handleApply).toHaveBeenCalledWith(1200, 12)
  })
})
