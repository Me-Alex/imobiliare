import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createAuthenticatedSupabaseClient } from './supabase'
import { hasResponse, requireAdmin, requireAuthenticatedAccount, requireStaff } from './server-admin-auth'

vi.mock('./supabase', () => ({ createAuthenticatedSupabaseClient: vi.fn() }))
const getUser = vi.fn()
const readProfile = vi.fn()
const rpc = vi.fn()
const request = (authorization?: string) => new NextRequest('https://example.test/api/admin/dashboard', {
  headers: authorization ? { Authorization: authorization } : {},
})

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'verified-user', email: 'demo@example.test' } }, error: null })
  readProfile.mockResolvedValue({ data: { role: 'CLIENT', is_active: true }, error: null })
  rpc.mockResolvedValue({ data: false, error: null })
  vi.mocked(createAuthenticatedSupabaseClient).mockReturnValue({
    auth: { getUser }, rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: readProfile }) }) }),
  } as unknown as ReturnType<typeof createAuthenticatedSupabaseClient>)
})

describe('verified server account authorization', () => {
  it.each([undefined, 'Basic token', 'Bearer ', 'Bearer token extra'])('rejects malformed authorization: %s', async (header) => {
    const result = await requireAuthenticatedAccount(request(header))
    expect(hasResponse(result) && result.response.status).toBe(401)
    expect(createAuthenticatedSupabaseClient).not.toHaveBeenCalled()
  })

  it('accepts a case-insensitive Bearer scheme and verifies the token remotely', async () => {
    const result = await requireAuthenticatedAccount(request('bearer test-token'))
    expect(result).toMatchObject({ userId: 'verified-user', role: 'CLIENT' })
    expect(getUser).toHaveBeenCalledWith('test-token')
    expect(createAuthenticatedSupabaseClient).toHaveBeenCalledWith('test-token')
  })

  it.each(['CLIENT', 'OWNER', 'AGENT', 'ADMIN'])('enforces %s role boundaries', async (role) => {
    readProfile.mockResolvedValue({ data: { role, is_active: true }, error: null })
    rpc.mockResolvedValue({ data: role === 'ADMIN', error: null })
    const account = await requireAuthenticatedAccount(request('Bearer token'))
    expect(account).toMatchObject({ role })
    const admin = await requireAdmin(request('Bearer token'))
    expect(!hasResponse(admin)).toBe(role === 'ADMIN')
    const staff = await requireStaff(request('Bearer token'))
    expect(!hasResponse(staff)).toBe(role === 'AGENT' || role === 'ADMIN')
  })

  it('blocks a disabled administrator even when the admin registry still grants access', async () => {
    readProfile.mockResolvedValue({ data: { role: 'ADMIN', is_active: false }, error: null })
    rpc.mockResolvedValue({ data: true, error: null })
    const result = await requireAdmin(request('Bearer token'))
    expect(hasResponse(result) && result.response.status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('distinguishes an expired session from a service outage', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } })
    const expired = await requireAuthenticatedAccount(request('Bearer token'))
    expect(hasResponse(expired) && expired.response.status).toBe(401)
    getUser.mockRejectedValue(new Error('network unavailable'))
    const outage = await requireAuthenticatedAccount(request('Bearer token'))
    expect(hasResponse(outage) && outage.response.status).toBe(503)
  })

  it('does not grant access when the profile or permission service fails', async () => {
    readProfile.mockResolvedValue({ data: null, error: { message: 'unavailable' } })
    const profileFailure = await requireAdmin(request('Bearer token'))
    expect(hasResponse(profileFailure) && profileFailure.response.status).toBe(503)
    readProfile.mockResolvedValue({ data: { role: 'ADMIN', is_active: true }, error: null })
    rpc.mockRejectedValue(new Error('unavailable'))
    const permissionFailure = await requireAdmin(request('Bearer token'))
    expect(hasResponse(permissionFailure) && permissionFailure.response.status).toBe(503)
  })
})
