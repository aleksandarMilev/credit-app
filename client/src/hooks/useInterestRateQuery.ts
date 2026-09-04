import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'
import type { InterestRate } from '@/types/interestRate'

// The rate changes rarely (an Approver updates it manually, not per-request),
// so it's worth caching longer than the app-wide 5-minute default in
// queryClient.ts.
const INTEREST_RATE_STALE_TIME_MS = 1_000 * 60 * 30 // 30 minutes

// Same discriminated-result-to-thrown-error bridge as useApplicationsQuery
// — see that file for why.
const fetchInterestRate = async (): Promise<InterestRate> => {
  const result = await apiFetch<InterestRate>('/interestrate/')

  if (!result.ok) {
    throw new Error(result.error.detail)
  }

  return result.data
}

export const interestRateQueryKey = ['interestRate'] as const

export const useInterestRateQuery = () =>
  useQuery({
    queryKey: interestRateQueryKey,
    queryFn: fetchInterestRate,
    staleTime: INTEREST_RATE_STALE_TIME_MS,
  })
