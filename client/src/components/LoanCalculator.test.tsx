import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoanCalculator } from '@/components/LoanCalculator'
import { formatCurrency } from '@/lib/formatCurrency'

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

  it('does not render validation messages for the default valid input', () => {
    render(<LoanCalculator annualInterestRate={5} />)

    expect(screen.queryByText('Моля, въведете валидна сума')).not.toBeInTheDocument()
    expect(screen.queryByText('Моля, въведете валиден срок')).not.toBeInTheDocument()
  })

  it('shows a validation message and disables Apply when the amount is invalid', async () => {
    const handleApply = vi.fn()
    render(<LoanCalculator annualInterestRate={5} onApply={handleApply} />)

    await setLoanInputs('0', '12')

    expect(screen.getByText('Моля, въведете валидна сума')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Кандидатствайте с тези условия' })).toBeDisabled()
  })

  it('shows a validation message when the amount exceeds the maximum', async () => {
    render(<LoanCalculator annualInterestRate={5} />)

    await setLoanInputs('1000001', '12')

    expect(screen.getByText('Моля, въведете валидна сума')).toBeInTheDocument()
  })

  it('shows a validation message when the term exceeds the maximum', async () => {
    render(<LoanCalculator annualInterestRate={5} />)

    await setLoanInputs('1000', '361')

    expect(screen.getByText('Моля, въведете валиден срок')).toBeInTheDocument()
  })

  it('associates the amount input with its validation message via aria-describedby', async () => {
    render(<LoanCalculator annualInterestRate={5} />)

    await setLoanInputs('0', '12')

    const amountInput = screen.getByLabelText('Сума на кредита')
    const message = screen.getByText('Моля, въведете валидна сума')

    expect(amountInput).toHaveAttribute('aria-describedby', message.id)
    expect(amountInput).toHaveAttribute('aria-invalid', 'true')
  })

  it('clears the validation message once the input becomes valid again', async () => {
    render(<LoanCalculator annualInterestRate={5} />)
    const user = userEvent.setup()
    const amountInput = screen.getByLabelText('Сума на кредита')

    await user.clear(amountInput)
    await user.type(amountInput, '0')
    expect(screen.getByText('Моля, въведете валидна сума')).toBeInTheDocument()

    await user.clear(amountInput)
    await user.type(amountInput, '1000')
    expect(screen.queryByText('Моля, въведете валидна сума')).not.toBeInTheDocument()
  })
})
