import { formatCurrency } from '@/lib/formatCurrency'

describe('formatCurrency', () => {
  it('formats a whole number', () => {
    expect(formatCurrency(100)).toBe('100,00 €')
  })

  it('formats a value with cents', () => {
    expect(formatCurrency(1234.5)).toBe('1234,50 €')
  })

  it('renders using Bulgarian locale formatting: a comma decimal separator and a euro sign', () => {
    const result = formatCurrency(42.5)

    expect(result).toContain(',')
    expect(result).not.toContain('.')
    expect(result).toContain('€')
  })
})
