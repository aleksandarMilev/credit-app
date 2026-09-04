import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'
import { interestRateQueryKey } from '@/hooks/useInterestRateQuery'
import type { InterestRate } from '@/types/interestRate'

interface UpdateInterestRateInput {
  annualRatePercent: number
}

const updateInterestRate = async (input: UpdateInterestRateInput): Promise<InterestRate> => {
  const result = await apiFetch<InterestRate>('/interestrate/', {
    method: 'PUT',
    body: { annualRatePercent: input.annualRatePercent },
  })

  if (!result.ok) {
    throw new Error(result.error.detail)
  }

  return result.data
}

// Seeds the query's cache with the server's fresh response directly on
// success, rather than refetching — the PUT response already is the exact
// updated InterestRate.
export const useUpdateInterestRateMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateInterestRate,
    onSuccess: (updatedRate) => {
      queryClient.setQueryData(interestRateQueryKey, updatedRate)
    },
  })
}
