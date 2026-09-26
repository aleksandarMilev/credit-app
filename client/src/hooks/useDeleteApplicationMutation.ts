import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'
import { applicationDetailQueryKey } from '@/hooks/useApplicationDetailQuery'

const deleteApplication = async (id: string): Promise<void> => {
  const result = await apiFetch<unknown>(`/applications/${id}/`, {
    method: 'DELETE',
  })

  if (!result.ok) {
    throw new Error(result.error.detail)
  }
}

export const useDeleteApplicationMutation = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteApplication(id),
    onSuccess: () => {
      // The detail page is still mounted when this runs, so invalidating
      // ['applications'] would refetch the deleted item and 404. Drop its
      // cache entry first; the page also disables the query on success so a
      // re-render before navigation can't recreate it.
      queryClient.removeQueries({ queryKey: applicationDetailQueryKey(id), exact: true })
      void queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
