const currencyFormatter = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'EUR',
})

export const formatCurrency = (value: number): string => currencyFormatter.format(value)
