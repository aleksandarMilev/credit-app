import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'
import { applicationDetailQueryKey } from '@/hooks/useApplicationDetailQuery'
import type { ApplicationDecisionValue, ApplicationDetail } from '@/types/application'

interface UpdateStatusInput {
  decision: ApplicationDecisionValue
  note: string
}

const updateApplicationStatus = async (
  id: string,
  input: UpdateStatusInput,
): Promise<ApplicationDetail> => {
  const trimmedNote = input.note.trim()

  const result = await apiFetch<ApplicationDetail>(`/applications/${id}/status/`, {
    method: 'PUT',
    body: {
      decision: input.decision,
      note: trimmedNote ? trimmedNote : null,
    },
  })

  if (!result.ok) {
    throw new Error(result.error.detail)
  }

  return result.data
}

// Seeds the detail query's cache with the server's fresh response directly
// on success, rather than refetching — the PUT response already is the
// exact updated ApplicationDetailServiceModel.
export const useUpdateApplicationStatusMutation = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateStatusInput) => updateApplicationStatus(id, input),
    onSuccess: (updatedDetail) => {
      queryClient.setQueryData(applicationDetailQueryKey(id), updatedDetail)
    },
  })
}
