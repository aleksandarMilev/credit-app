// Mirrors the server's ValidEgnAttribute checksum algorithm exactly — for
// fast client-side feedback only, not a security boundary. The server
// re-validates every submission regardless of what this returns.
const WEIGHTS = [2, 4, 8, 5, 10, 9, 7, 3, 6]

export const isValidEgn = (egn: string): boolean => {
  if (!/^\d{10}$/.test(egn)) {
    return false
  }

  let year = Number(egn.slice(0, 2))
  let month = Number(egn.slice(2, 4))
  const day = Number(egn.slice(4, 6))

  if (month >= 21 && month <= 32) {
    year += 1_800
    month -= 20
  } else if (month >= 41 && month <= 52) {
    year += 2_000
    month -= 40
  } else if (month >= 1 && month <= 12) {
    year += 1_900
  } else {
    return false
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) {
    return false
  }

  const sum = WEIGHTS.reduce((total, weight, index) => total + weight * Number(egn[index]), 0)
  const checksum = sum % 11

  return (checksum === 10 ? 0 : checksum) === Number(egn[9])
}
