import { useEffect, useState } from 'react'
import { apiFetchBlob } from '@/lib/apiClient'

interface UseApplicationDocumentResult {
  documentUrl: string | null
  isLoading: boolean
  error: string | null
}

interface DocumentQueryState {
  applicationId: string | null
  documentUrl: string | null
  isLoading: boolean
  error: string | null
}

const INITIAL_STATE: DocumentQueryState = {
  applicationId: null,
  documentUrl: null,
  isLoading: true,
  error: null,
}

// Mirrors ApplyPage's object-URL cleanup pattern, but the source here is an
// async fetch rather than a File already in memory. Keying the state by the
// applicationId it belongs to (rather than resetting isLoading/error/url
// synchronously at the top of the effect) avoids a set-state-in-effect
// violation and lets "loading for a stale id" be derived at render time —
// the isCancelled guard still prevents a superseded response from
// overwriting newer state.
export const useApplicationDocument = (applicationId: string): UseApplicationDocumentResult => {
  const [state, setState] = useState<DocumentQueryState>(INITIAL_STATE)

  useEffect(() => {
    let objectUrl: string | null = null
    let isCancelled = false

    const loadDocument = async () => {
      const result = await apiFetchBlob(`/applications/${applicationId}/document/`)

      if (isCancelled) {
        return
      }

      if (!result.ok) {
        setState({
          applicationId,
          documentUrl: null,
          isLoading: false,
          error: result.error.detail,
        })
        return
      }

      objectUrl = URL.createObjectURL(result.data)
      setState({ applicationId, documentUrl: objectUrl, isLoading: false, error: null })
    }

    void loadDocument()

    return () => {
      isCancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [applicationId])

  const isCurrent = state.applicationId === applicationId

  return {
    documentUrl: isCurrent ? state.documentUrl : null,
    isLoading: !isCurrent || state.isLoading,
    error: isCurrent ? state.error : null,
  }
}
