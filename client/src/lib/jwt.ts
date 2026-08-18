const ROLE_CLAIM_TYPE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split('.')
  if (segments.length !== 3) {
    return null
  }

  const [, payloadSegment] = segments

  try {
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )

    const parsed: unknown = JSON.parse(json)

    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export const getRolesFromToken = (token: string): string[] => {
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return []
  }

  const roleClaim = payload[ROLE_CLAIM_TYPE]

  if (typeof roleClaim === 'string') {
    return [roleClaim]
  }

  if (Array.isArray(roleClaim)) {
    return roleClaim.filter((value): value is string => typeof value === 'string')
  }

  return []
}
