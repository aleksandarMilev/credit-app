const dateFormatter = new Intl.DateTimeFormat('bg-BG', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const formatDate = (isoDate: string): string => dateFormatter.format(new Date(isoDate))
