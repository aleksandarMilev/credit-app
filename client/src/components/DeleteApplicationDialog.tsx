import { useId } from 'react'
import { CircleAlert } from 'lucide-react'

interface DeleteApplicationDialogProps {
  applicantName: string
  isPending: boolean
  errorMessage: string | null
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteApplicationDialog = ({
  applicantName,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteApplicationDialogProps) => {
  const titleId = useId()
  const errorId = useId()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={errorMessage ? errorId : undefined}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <CircleAlert className="h-5 w-5" aria-hidden="true" />
        </div>

        <h2 id={titleId} className="mt-4 text-base font-semibold text-gray-900">
          Изтриване на кандидатура
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Сигурни ли сте, че искате да изтриете кандидатурата на{' '}
          <span className="font-medium text-gray-900">{applicantName}</span>? Това действие е
          необратимо.
        </p>

        {errorMessage && (
          <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Изтриване...' : 'Да, изтрий'}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            Отказ
          </button>
        </div>
      </div>
    </div>
  )
}
