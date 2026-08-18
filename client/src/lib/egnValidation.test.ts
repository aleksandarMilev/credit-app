import { describe, expect, it } from 'vitest'
import { isValidEgn } from '@/lib/egnValidation'

const WEIGHTS = [2, 4, 8, 5, 10, 9, 7, 3, 6]

// Builds a checksum-correct EGN from a birth date + sequence, mirroring the
// same algorithm isValidEgn itself implements — used only to produce a
// guaranteed-valid fixture, not to test the algorithm against itself
// (that's what the hand-picked cases below are for).
const buildValidEgn = (year: number, month: number, day: number, sequence: string): string => {
  const digits = `${String(year % 100).padStart(2, '0')}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${sequence}`

  const sum = WEIGHTS.reduce((total, weight, index) => total + weight * Number(digits[index]), 0)
  const checksum = sum % 11

  return `${digits}${String(checksum === 10 ? 0 : checksum)}`
}

describe('isValidEgn', () => {
  it('accepts a valid EGN for a person born in the 1900s', () => {
    expect(isValidEgn(buildValidEgn(1990, 1, 1, '118'))).toBe(true)
  })

  it('accepts a valid EGN for a person born in the 1800s (encoded month + 20)', () => {
    // Month is passed already-encoded (1 + 20 = 21 for January) — this is
    // how the EGN itself represents an 1800s birth year.
    expect(isValidEgn(buildValidEgn(1890, 21, 15, '118'))).toBe(true)
  })

  it('accepts a valid EGN for a person born in the 2000s (month + 40)', () => {
    expect(isValidEgn(buildValidEgn(2005, 45, 10, '234'))).toBe(true)
  })

  it('rejects a string that is not 10 digits', () => {
    expect(isValidEgn('12345')).toBe(false)
  })

  it('rejects a string containing non-digit characters', () => {
    expect(isValidEgn('900101118a')).toBe(false)
  })

  it('rejects an EGN with an invalid month', () => {
    expect(isValidEgn('9099011182')).toBe(false)
  })

  it('rejects an EGN with an invalid day for the given month', () => {
    const invalidFebruary30th = buildValidEgn(1990, 2, 30, '118')
    expect(isValidEgn(invalidFebruary30th)).toBe(false)
  })

  it('rejects an EGN with a correct format but wrong checksum digit', () => {
    const valid = buildValidEgn(1990, 1, 1, '118')
    const lastDigit = Number(valid[9])
    const corrupted = valid.slice(0, 9) + String((lastDigit + 1) % 10)

    expect(isValidEgn(corrupted)).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidEgn('')).toBe(false)
  })
})
