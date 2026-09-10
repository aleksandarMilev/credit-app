import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { ChevronLeft, ChevronRight, CircleAlert, Inbox, Loader2 } from 'lucide-react'
import { useApplicationsQuery } from '@/hooks/useApplicationsQuery'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { StatusBadge } from '@/components/StatusBadge'
import { APPLICATION_STATUS, type ApplicationStatusValue } from '@/types/application'

const PAGE_SIZE = 10

const EASE = [0.22, 1, 0.36, 1] as const

type StatusFilterValue = ApplicationStatusValue | 'All'

const FILTER_OPTIONS: { label: string; value: StatusFilterValue }[] = [
  { label: 'Всички', value: 'All' },
  { label: 'Чакащи', value: APPLICATION_STATUS.Pending },
  { label: 'Одобрени', value: APPLICATION_STATUS.Approved },
  { label: 'Отхвърлени', value: APPLICATION_STATUS.Rejected },
]

const filterPillClassName = (isActive: boolean) =>
  [
    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-pine-600 text-white shadow-sm'
      : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-pine-50 hover:text-pine-700 hover:ring-pine-200',
  ].join(' ')

const paginationButtonClassName =
  'inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-pine-50 hover:text-pine-700 disabled:pointer-events-none disabled:opacity-50'

const statusCardClassName =
  'flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-900/5'

export const AdminQueuePage = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('All')
  const [pageIndex, setPageIndex] = useState(1)
  const shouldReduceMotion = useReducedMotion()

  const query = useApplicationsQuery({
    pageIndex,
    pageSize: PAGE_SIZE,
    status: statusFilter === 'All' ? null : statusFilter,
  })

  const handleFilterChange = (value: StatusFilterValue) => {
    setStatusFilter(value)
    setPageIndex(1)
  }

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.totalCount / PAGE_SIZE)) : 1

  const fadeUp: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
      }

  const staggerContainer: Variants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-stone-900">Опашка от кандидатури</h1>
        <p className="mt-1 text-sm text-stone-500">Преглед на подадените кандидатури за кредит.</p>

        <div role="group" aria-label="Филтър по статус" className="mt-6 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = option.value === statusFilter
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  handleFilterChange(option.value)
                }}
                className={filterPillClassName(isActive)}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          {query.isLoading && (
            <div className={`${statusCardClassName} text-stone-500`}>
              <Loader2 className="h-8 w-8 animate-spin text-pine-500" aria-hidden="true" />
              <p className="mt-3 text-sm">Зареждане на кандидатурите...</p>
            </div>
          )}

          {query.isError && (
            <div className={statusCardClassName}>
              <CircleAlert className="h-8 w-8 text-terracotta-500" aria-hidden="true" />
              <p role="alert" className="mt-3 text-sm font-medium text-terracotta-600">
                {query.error.message}
              </p>
            </div>
          )}

          {query.isSuccess && query.data.items.length === 0 && (
            <div className={statusCardClassName}>
              <Inbox className="h-8 w-8 text-stone-400" aria-hidden="true" />
              <p className="mt-3 text-sm text-stone-500">
                Няма кандидатури, отговарящи на филтъра.
              </p>
            </div>
          )}

          {query.isSuccess && query.data.items.length > 0 && (
            <>
              <motion.ul
                key={`${String(statusFilter)}-${String(pageIndex)}`}
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-3"
              >
                {query.data.items.map((application) => (
                  <motion.li key={application.id} variants={fadeUp}>
                    <Link
                      to={`/admin/applications/${application.id}`}
                      className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-pine-200 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <div className="flex flex-col sm:w-1/4">
                        <span className="font-semibold text-stone-900">
                          {application.firstName} {application.lastName}
                        </span>
                        <span className="text-xs text-stone-500">
                          {formatDate(application.createdOn)}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-stone-700 sm:w-2/5">
                        <span>{formatCurrency(application.requestedAmount)}</span>
                        <span>{application.requestedTermMonths} месеца</span>
                      </div>

                      <StatusBadge status={application.status} />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={pageIndex <= 1}
                  onClick={() => {
                    setPageIndex((current) => current - 1)
                  }}
                  className={paginationButtonClassName}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Предишна
                </button>

                <span className="text-sm text-stone-500">
                  Страница {pageIndex} от {totalPages}
                </span>

                <button
                  type="button"
                  disabled={pageIndex >= totalPages}
                  onClick={() => {
                    setPageIndex((current) => current + 1)
                  }}
                  className={paginationButtonClassName}
                >
                  Следваща
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
