// erasableSyntaxOnly forbids real `enum` declarations — this is the
// standard replacement: a const object plus a derived union type.
export const APPLICATION_STATUS = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
} as const

export type ApplicationStatusValue = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS]

export interface ApplicationSummary {
  id: string
  firstName: string
  lastName: string
  requestedAmount: number
  requestedTermMonths: number
  status: ApplicationStatusValue
  createdOn: string
}

export interface ApplicationDetail {
  id: string
  firstName: string
  lastName: string
  egn: string
  phone: string
  email: string
  requestedAmount: number
  requestedTermMonths: number
  status: ApplicationStatusValue
  reviewNote: string | null
  reviewedBy: string | null
  reviewedOn: string | null
  createdOn: string
}

// ApplicationDecision is a separate server-side enum from ApplicationStatus
// (Approved = 0, Rejected = 1 — no Pending) — sent in the PUT
// /applications/{id}/status/ JSON body. Unlike the ?status= query param
// (bound by name), a JSON body's enum field is deserialized by its numeric
// value, since no JsonStringEnumConverter is configured server-side.
export const APPLICATION_DECISION = {
  Approved: 0,
  Rejected: 1,
} as const

export type ApplicationDecisionValue =
  (typeof APPLICATION_DECISION)[keyof typeof APPLICATION_DECISION]
