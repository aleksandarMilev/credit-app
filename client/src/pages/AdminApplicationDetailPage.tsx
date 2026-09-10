import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, CircleAlert, ImageOff, Loader2, Trash2 } from 'lucide-react'
import { useApplicationDetailQuery } from '@/hooks/useApplicationDetailQuery'
import { useApplicationDocument } from '@/hooks/useApplicationDocument'
import { useDeleteApplicationMutation } from '@/hooks/useDeleteApplicationMutation'
import { useUpdateApplicationStatusMutation } from '@/hooks/useUpdateApplicationStatusMutation'
import { DeleteApplicationDialog } from '@/components/DeleteApplicationDialog'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { selectRoles, useAuthStore } from '@/store/useAuthStore'
import { APPLICATION_DECISION, APPLICATION_STATUS } from '@/types/application'
import type { ApplicationDecisionValue } from '@/types/application'

const APPROVER_ROLE_NAME = 'Approver'

const EASE = [0.22, 1, 0.36, 1] as const

const statusCardClassName =
  'flex flex-col items-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-900/5'

export const AdminApplicationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const roles = useAuthStore(selectRoles)
  const isApprover = roles.includes(APPROVER_ROLE_NAME)
  const shouldReduceMotion = useReducedMotion()

  const noteId = useId()
  const mutationErrorId = useId()

  const [note, setNote] = useState('')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const detailQuery = useApplicationDetailQuery(id ?? '')
  const document = useApplicationDocument(id ?? '')
  const mutation = useUpdateApplicationStatusMutation(id ?? '')
  const deleteMutation = useDeleteApplicationMutation(id ?? '')

  if (!id) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className={statusCardClassName}>
            <CircleAlert className="h-8 w-8 text-terracotta-500" aria-hidden="true" />
            <p role="alert" className="mt-3 text-sm font-medium text-terracotta-600">
              Невалиден адрес на кандидатура.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className={statusCardClassName}>
            <Loader2 className="h-8 w-8 animate-spin text-pine-500" aria-hidden="true" />
            <p className="mt-3 text-sm text-stone-500">Зареждане на кандидатурата...</p>
          </div>
        </div>
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className={statusCardClassName}>
            <CircleAlert className="h-8 w-8 text-terracotta-500" aria-hidden="true" />
            <p role="alert" className="mt-3 text-sm font-medium text-terracotta-600">
              {detailQuery.error.message}
            </p>
            <Link
              to="/admin"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-pine-700 hover:text-pine-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Обратно към опашката
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const application = detailQuery.data
  const isTerminal = application.status !== APPLICATION_STATUS.Pending

  const handleDecision = (decision: ApplicationDecisionValue) => {
    mutation.mutate({ decision, note })
  }

  const handleConfirmDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        void navigate('/admin')
      },
    })
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="mx-auto max-w-3xl"
      >
        <div className="flex items-center justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-sm font-medium text-pine-700 hover:text-pine-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Обратно към опашката
          </Link>

          {isApprover && (
            <button
              type="button"
              onClick={() => {
                setIsConfirmingDelete(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-terracotta-600 transition-colors hover:bg-terracotta-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Изтрий
            </button>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-stone-900">
                {application.firstName} {application.lastName}
              </h1>
              <p className="mt-1 text-xs text-stone-500">
                Подадена на {formatDate(application.createdOn)}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-stone-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">ЕГН</dt>
              <dd className="mt-1 text-sm text-stone-900">{application.egn}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                Телефон
              </dt>
              <dd className="mt-1 text-sm text-stone-900">{application.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                Имейл
              </dt>
              <dd className="mt-1 text-sm text-stone-900">{application.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                Желана сума
              </dt>
              <dd className="mt-1 text-sm text-stone-900">
                {formatCurrency(application.requestedAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">Срок</dt>
              <dd className="mt-1 text-sm text-stone-900">
                {application.requestedTermMonths} месеца
              </dd>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-8">
          <h2 className="text-base font-semibold text-stone-900">Снимка на личната карта</h2>

          <div className="mt-4 flex items-center justify-center rounded-lg bg-stone-50 p-4">
            {document.isLoading && (
              <div className="flex flex-col items-center gap-2 py-8 text-stone-500">
                <Loader2 className="h-6 w-6 animate-spin text-pine-500" aria-hidden="true" />
                <p className="text-sm">Зареждане на снимката...</p>
              </div>
            )}

            {document.error && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ImageOff className="h-6 w-6 text-terracotta-500" aria-hidden="true" />
                <p role="alert" className="text-sm font-medium text-terracotta-600">
                  {document.error}
                </p>
              </div>
            )}

            {document.documentUrl && (
              <img
                src={document.documentUrl}
                alt="Снимка на личната карта на кандидата"
                className="max-h-96 w-auto rounded-lg object-contain shadow-sm"
              />
            )}
          </div>
        </div>

        {isTerminal && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-8">
            <h2 className="text-base font-semibold text-stone-900">Решение</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                  Разгледано от
                </dt>
                <dd className="mt-1 text-sm text-stone-900">{application.reviewedBy ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                  Дата на решение
                </dt>
                <dd className="mt-1 text-sm text-stone-900">
                  {application.reviewedOn ? formatDate(application.reviewedOn) : '—'}
                </dd>
              </div>
              {application.reviewNote && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                    Бележка
                  </dt>
                  <dd className="mt-1 text-sm text-stone-900">{application.reviewNote}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {!isTerminal && isApprover && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-8">
            <h2 className="text-base font-semibold text-stone-900">Решение</h2>

            <label htmlFor={noteId} className="mt-4 block text-sm font-medium text-stone-700">
              Бележка (незадължително)
            </label>
            <textarea
              id={noteId}
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
              }}
              aria-describedby={mutation.isError ? mutationErrorId : undefined}
              className="mt-1.5 block w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/30"
            />

            {mutation.isError && (
              <p
                id={mutationErrorId}
                role="alert"
                className="mt-3 text-sm font-medium text-terracotta-600"
              >
                {mutation.error.message}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => {
                  handleDecision(APPLICATION_DECISION.Approved)
                }}
                className="flex-1 rounded-lg bg-pine-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pine-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending && mutation.variables.decision === APPLICATION_DECISION.Approved
                  ? 'Одобряване...'
                  : 'Одобри'}
              </button>
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => {
                  handleDecision(APPLICATION_DECISION.Rejected)
                }}
                className="flex-1 rounded-lg bg-terracotta-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-600 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending && mutation.variables.decision === APPLICATION_DECISION.Rejected
                  ? 'Отхвърляне...'
                  : 'Отхвърли'}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {isConfirmingDelete && (
        <DeleteApplicationDialog
          applicantName={`${application.firstName} ${application.lastName}`}
          isPending={deleteMutation.isPending}
          errorMessage={deleteMutation.isError ? deleteMutation.error.message : null}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsConfirmingDelete(false)
          }}
        />
      )}
    </div>
  )
}
