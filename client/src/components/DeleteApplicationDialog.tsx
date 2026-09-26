import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CircleAlert } from 'lucide-react'

interface DeleteApplicationDialogProps {
  applicantName: string
  isPending: boolean
  errorMessage: string | null
  onConfirm: () => void
  onCancel: () => void
}

const EASE = [0.22, 1, 0.36, 1] as const

export const DeleteApplicationDialog = ({
  applicantName,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteApplicationDialogProps) => {
  const titleId = useId()
  const errorId = useId()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={errorMessage ? errorId : undefined}
        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-stone-900/5"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-600">
          <CircleAlert className="h-5 w-5" aria-hidden="true" />
        </div>

        <h2 id={titleId} className="mt-4 text-base font-semibold text-stone-900">
          Изтриване на кандидатура
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Сигурни ли сте, че искате да изтриете кандидатурата на{' '}
          <span className="font-medium text-stone-900">{applicantName}</span>? Това действие е
          необратимо.
        </p>

        {errorMessage && (
          <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-terracotta-600">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Изтриване...' : 'Да, изтрий'}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-300 transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            Отказ
          </button>
        </div>
      </motion.div>
    </div>
  )
}
