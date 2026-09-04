import { getStatusBadgeClassName, getStatusLabel } from '@/lib/applicationStatus'
import type { ApplicationStatusValue } from '@/types/application'

interface StatusBadgeProps {
  status: ApplicationStatusValue
}

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span
    className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(status)}`}
  >
    {getStatusLabel(status)}
  </span>
)
