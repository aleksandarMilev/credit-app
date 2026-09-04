import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'
import type { ApplicationDetail } from '@/types/application'

// Same discriminated-result-to-thrown-error bridge as useApplicationsQuery
// — see that file for why.
const fetchApplicationDetail = async (id: string): Promise<ApplicationDetail> => {
  const result = await apiFetch<ApplicationDetail>(`/applications/${id}/`)

  if (!result.ok) {
    throw new Error(result.error.detail)
  }

  return result.data
}

export const applicationDetailQueryKey = (id: string) => ['applications', id] as const

export const useApplicationDetailQuery = (id: string) =>
  useQuery({
    queryKey: applicationDetailQueryKey(id),
    queryFn: () => fetchApplicationDetail(id),
  })
