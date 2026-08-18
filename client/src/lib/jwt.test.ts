import { describe, expect, it } from 'vitest'
import { getRolesFromToken } from '@/lib/jwt'

const ROLE_CLAIM_TYPE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

const encodeBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const createToken = (payload: Record<string, unknown>) => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  return `${header}.${encodedPayload}.signature`
}

describe('getRolesFromToken', () => {
  it('extracts a single role from a valid token', () => {
    const token = createToken({ [ROLE_CLAIM_TYPE]: 'Approver' })

    expect(getRolesFromToken(token)).toEqual(['Approver'])
  })

  it('extracts multiple roles when the claim is an array', () => {
    const token = createToken({ [ROLE_CLAIM_TYPE]: ['Approver', 'Viewer'] })

    expect(getRolesFromToken(token)).toEqual(['Approver', 'Viewer'])
  })

  it('returns an empty array when the token has no role claim', () => {
    const token = createToken({ sub: 'user-1' })

    expect(getRolesFromToken(token)).toEqual([])
  })

  it('does not throw for a malformed token and returns an empty array', () => {
    expect(() => getRolesFromToken('not-a-valid-jwt')).not.toThrow()
    expect(getRolesFromToken('not-a-valid-jwt')).toEqual([])
  })

  it('does not throw for an empty string and returns an empty array', () => {
    expect(() => getRolesFromToken('')).not.toThrow()
    expect(getRolesFromToken('')).toEqual([])
  })

  it('returns an empty array when the payload segment is not valid base64/JSON', () => {
    expect(getRolesFromToken('aaa.!!!notbase64!!!.bbb')).toEqual([])
  })
})
