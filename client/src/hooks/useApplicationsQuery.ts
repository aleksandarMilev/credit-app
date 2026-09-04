import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'
import { STATUS_QUERY_PARAM_NAMES } from '@/lib/applicationStatus'
import type { ApplicationStatusValue, ApplicationSummary } from '@/types/application'
import type { PagedResult } from '@/types/pagedResult'

export interface ApplicationsQueryParams {
  pageIndex: number
  pageSize: number
  status: ApplicationStatusValue | null
}

// apiFetch never throws — it returns a discriminated ApiResult so one-shot
// form submissions (LoginPage, ApplyPage) can handle failure inline without
// a try/catch. For a cacheable, refetchable list like this one, React
// Query's own isError/error state is the more idiomatic fit, so the bridge
// happens right here: unwrap on success, throw the backend's own detail
// message on failure so query.error.message still carries it through.
const fetchApplications = async (
  params: ApplicationsQueryParams,
): Promise<PagedResult<ApplicationSummary>> => {
  const query = new URLSearchParams({
    pageIndex: String(params.pageIndex),
    pageSize: String(params.pageSize),
  })

  if (params.status !== null) {
    query.set('status', STATUS_QUERY_PARAM_NAMES[params.status])
  }

  const result = await apiFetch<PagedResult<ApplicationSummary>>(
    `/applications/?${query.toString()}`,
  )

  if (!result.ok) {
    throw new Error(result.error.detail)
  }

  return result.data
}

export const useApplicationsQuery = (params: ApplicationsQueryParams) =>
  useQuery({
    queryKey: ['applications', params],
    queryFn: () => fetchApplications(params),
  })
