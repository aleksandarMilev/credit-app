import { APPLICATION_STATUS, type ApplicationStatusValue } from '@/types/application'

// ApplicationsController.GetAll's [FromQuery] ApplicationStatus? status
// binds enum query params by name (ASP.NET Core's query-string model
// binding, independent of JSON serialization settings) — but the same
// field comes back from the server as a plain number in JSON responses
// (no JsonStringEnumConverter configured), hence two different mappings.
export const STATUS_QUERY_PARAM_NAMES: Record<ApplicationStatusValue, string> = {
  [APPLICATION_STATUS.Pending]: 'Pending',
  [APPLICATION_STATUS.Approved]: 'Approved',
  [APPLICATION_STATUS.Rejected]: 'Rejected',
}

export const getStatusLabel = (status: ApplicationStatusValue): string => {
  switch (status) {
    case APPLICATION_STATUS.Pending:
      return 'Чакаща'
    case APPLICATION_STATUS.Approved:
      return 'Одобрена'
    case APPLICATION_STATUS.Rejected:
      return 'Отхвърлена'
  }
}

export const getStatusBadgeClassName = (status: ApplicationStatusValue): string => {
  switch (status) {
    case APPLICATION_STATUS.Pending:
      return 'bg-accent-100 text-accent-800'
    case APPLICATION_STATUS.Approved:
      return 'bg-green-100 text-green-800'
    case APPLICATION_STATUS.Rejected:
      return 'bg-red-100 text-red-800'
  }
}
