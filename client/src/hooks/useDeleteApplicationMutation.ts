import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'

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
      void queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
