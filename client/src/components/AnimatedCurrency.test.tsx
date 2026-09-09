import { render, screen } from '@testing-library/react'
import * as framerMotion from 'framer-motion'
import { AnimatedCurrency } from '@/components/AnimatedCurrency'
import { formatCurrency } from '@/lib/formatCurrency'

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof framerMotion>()
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  }
})

const mockedUseReducedMotion = vi.mocked(framerMotion.useReducedMotion)

// bg-BG currency formatting inserts a narrow no-break space before the
// symbol, so comparisons normalize whitespace the same way LoanCalculator's
// tests do rather than matching the raw formatCurrency() output.
const normalizeWhitespace = (value: string) => value.replace(/\s/g, ' ')

describe('AnimatedCurrency', () => {
  afterEach(() => {
    mockedUseReducedMotion.mockReturnValue(false)
  })

  it('renders the initial value immediately', () => {
    render(<AnimatedCurrency value={100} />)

    expect(screen.getByText(normalizeWhitespace(formatCurrency(100)))).toBeInTheDocument()
  })

  it('counts up to the new value when the value prop changes', async () => {
    const { rerender } = render(<AnimatedCurrency value={100} />)

    rerender(<AnimatedCurrency value={250} />)

    expect(
      await screen.findByText(normalizeWhitespace(formatCurrency(250)), {}, { timeout: 2000 }),
    ).toBeInTheDocument()
  })

  it('updates instantly with no count-up animation when the user prefers reduced motion', () => {
    mockedUseReducedMotion.mockReturnValue(true)
    const { rerender } = render(<AnimatedCurrency value={100} />)

    rerender(<AnimatedCurrency value={250} />)

    expect(screen.getByText(normalizeWhitespace(formatCurrency(250)))).toBeInTheDocument()
  })
})
