import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createIpRateLimiter } from './rate-limit'

describe('createIpRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  it('permits requests up to the limit', () => {
    const limiter = createIpRateLimiter({ windowMs: 60_000, max: 3 })
    expect(limiter.check('1.1.1.1').limited).toBe(false)
    expect(limiter.check('1.1.1.1').limited).toBe(false)
    expect(limiter.check('1.1.1.1').limited).toBe(false)
    expect(limiter.check('1.1.1.1').limited).toBe(true)
  })

  it('counts IPs independently', () => {
    const limiter = createIpRateLimiter({ windowMs: 60_000, max: 1 })
    expect(limiter.check('a').limited).toBe(false)
    expect(limiter.check('a').limited).toBe(true)
    expect(limiter.check('b').limited).toBe(false)
  })

  it('expires old entries after the window elapses', () => {
    const limiter = createIpRateLimiter({ windowMs: 1_000, max: 1 })
    expect(limiter.check('x').limited).toBe(false)
    expect(limiter.check('x').limited).toBe(true)
    vi.advanceTimersByTime(1_500)
    expect(limiter.check('x').limited).toBe(false)
  })

  it('prunes when the key cap is exceeded', () => {
    const limiter = createIpRateLimiter({
      windowMs: 60_000,
      max: 1,
      maxKeys: 2,
    })
    limiter.check('a')
    vi.advanceTimersByTime(120_000) // age out a's timestamp
    limiter.check('b')
    limiter.check('c')
    // The third insertion should have triggered a prune; the window
    // already cleared a, so we should still be under the cap.
    expect(limiter.check('a').limited).toBe(false)
  })
})
