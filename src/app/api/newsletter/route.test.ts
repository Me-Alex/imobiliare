import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const { getSafeDb } = vi.hoisted(() => ({ getSafeDb: vi.fn() }))
vi.mock('@/lib/edge-db', () => ({ getSafeDb }))
vi.mock('@/lib/rate-limit', () => ({ createIpRateLimiter: () => ({ check: () => ({ limited: false }) }), getClientIp: () => 'test', rateLimitResponse: vi.fn() }))
import { POST } from './route'
const request = (email: unknown) => new NextRequest('http://localhost/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
beforeEach(() => vi.clearAllMocks())
describe('newsletter subscription persistence', () => {
  it('returns unavailable, never success, when storage is missing', async () => {
    getSafeDb.mockResolvedValue(null)
    const response = await POST(request('reader@example.com'))
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.success).toBeUndefined()
    expect(body.error).toContain('nu este disponibilă')
  })
  it('normalizes a padded address and confirms only after persistence', async () => {
    const create = vi.fn().mockResolvedValue({})
    getSafeDb.mockResolvedValue({ newsletterSubscription: { create } })
    const response = await POST(request('  Reader@example.com  '))
    expect(response.status).toBe(200)
    expect(create).toHaveBeenCalledWith({ data: { email: 'reader@example.com' } })
  })
  it('rejects non-string addresses before consulting storage', async () => {
    expect((await POST(request({ invalid: true }))).status).toBe(400)
    expect(getSafeDb).not.toHaveBeenCalled()
  })
})
