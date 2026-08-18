import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CircleAlert, Inbox, Loader2 } from 'lucide-react'
import { useApplicationsQuery } from '@/hooks/useApplicationsQuery'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { StatusBadge } from '@/components/StatusBadge'
import { APPLICATION_STATUS, type ApplicationStatusValue } from '@/types/application'

const PAGE_SIZE = 10

type StatusFilterValue = ApplicationStatusValue | 'All'

const FILTER_OPTIONS: { label: string; value: StatusFilterValue }[] = [
  { label: 'Всички', value: 'All' },
  { label: 'Чакащи', value: APPLICATION_STATUS.Pending },
  { label: 'Одобрени', value: APPLICATION_STATUS.Approved },
  { label: 'Отхвърлени', value: APPLICATION_STATUS.Rejected },
]

export const AdminQueuePage = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('All')
  const [pageIndex, setPageIndex] = useState(1)

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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900">Опашка от кандидатури</h1>
        <p className="mt-1 text-sm text-gray-500">Преглед на подадените кандидатури за кредит.</p>

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
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          {query.isLoading && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-gray-500 shadow-sm ring-1 ring-gray-900/5">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" aria-hidden="true" />
              <p className="mt-3 text-sm">Зареждане на кандидатурите...</p>
            </div>
          )}

          {query.isError && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
              <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
              <p role="alert" className="mt-3 text-sm font-medium text-red-600">
                {query.error.message}
              </p>
            </div>
          )}

          {query.isSuccess && query.data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
              <Inbox className="h-8 w-8 text-gray-400" aria-hidden="true" />
              <p className="mt-3 text-sm text-gray-500">
                Няма кандидатури, отговарящи на филтъра.
              </p>
            </div>
          )}

          {query.isSuccess && query.data.items.length > 0 && (
            <>
              <ul className="space-y-3">
                {query.data.items.map((application) => (
                  <li key={application.id}>
                    <Link
                      to={`/admin/applications/${application.id}`}
                      className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <div className="flex flex-col sm:w-1/4">
                        <span className="font-semibold text-gray-900">
                          {application.firstName} {application.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(application.createdOn)}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-700 sm:w-2/5">
                        <span>{formatCurrency(application.requestedAmount)}</span>
                        <span>{application.requestedTermMonths} месеца</span>
                      </div>

                      <StatusBadge status={application.status} />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={pageIndex <= 1}
                  onClick={() => {
                    setPageIndex((current) => current - 1)
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Предишна
                </button>

                <span className="text-sm text-gray-500">
                  Страница {pageIndex} от {totalPages}
                </span>

                <button
                  type="button"
                  disabled={pageIndex >= totalPages}
                  onClick={() => {
                    setPageIndex((current) => current + 1)
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:pointer-events-none disabled:opacity-50"
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
