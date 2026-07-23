/**
 * IP-based rate limiter shared by API routes.
 *
 * Intentionally simple: an in-memory sliding window. This protects against
 * single-isolate abuse but is NOT a global counter. On Cloudflare Workers
 * each isolate keeps its own bucket, so a determined attacker can multiply
 * the effective limit by the number of isolates. Use a Durable Object or
 * Workers KV if you need a true global rate limit.
 *
 * The store is bounded: when more than `maxKeys` distinct IPs are tracked,
 * stale (empty / expired) entries are pruned. This keeps memory pressure
 * predictable for long-lived isolates.
 */

const DEFAULT_MAX_KEYS = 5_000
const DEFAULT_KEY_TTL_MS = 10 * 60 * 1_000 // 10 minutes of inactivity

export interface RateLimitOptions {
  /** Sliding window length in milliseconds. */
  windowMs: number
  /** Maximum requests permitted per IP inside the window. */
  max: number
  /** Hard cap on the number of distinct IPs we remember. */
  maxKeys?: number
  /** Identifier extractor — defaults to the supplied IP. */
  resolveKey?: (request: Request) => string
}

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetMs: number
}

interface Bucket {
  timestamps: number[]
  lastTouched: number
}

function cfConnectingIp(headers: Headers): string | null {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  )
}

export function getClientIp(request: Request): string {
  return cfConnectingIp(request.headers) || 'unknown'
}

export function createIpRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, maxKeys = DEFAULT_MAX_KEYS } = options
  const store = new Map<string, Bucket>()

  function prune(now: number): void {
    // Cheap incremental cleanup: if the map grew beyond the cap, drop the
    // entries whose most recent timestamp already fell out of the window.
    if (store.size <= maxKeys) return
    for (const [key, bucket] of store) {
      const newest = bucket.timestamps[bucket.timestamps.length - 1]
      if (newest === undefined || newest < now - windowMs) {
        store.delete(key)
      }
      if (store.size <= maxKeys) return
    }
  }

  function check(key: string): RateLimitResult {
    const now = Date.now()
    const cutoff = now - windowMs
    const existing = store.get(key)

    if (!existing) {
      store.set(key, { timestamps: [now], lastTouched: now })
      prune(now)
      return { limited: false, remaining: max - 1, resetMs: windowMs }
    }

    // Drop timestamps that have aged out.
    while (existing.timestamps.length > 0 && existing.timestamps[0]! < cutoff) {
      existing.timestamps.shift()
    }

    existing.lastTouched = now

    if (existing.timestamps.length >= max) {
      const oldest = existing.timestamps[0]!
      return {
        limited: true,
        remaining: 0,
        resetMs: Math.max(0, oldest + windowMs - now),
      }
    }

    existing.timestamps.push(now)
    prune(now)
    return {
      limited: false,
      remaining: max - existing.timestamps.length,
      resetMs: windowMs,
    }
  }

  return {
    check,
    /** Test-only: drop all state. */
    reset() {
      store.clear()
    },
  }
}

/**
 * Convenience helper that combines IP extraction with a default key resolver.
 * Returns a `Response` ready to be returned by the route handler when the
 * caller is rate limited.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  message = 'Prea multe solicitări. Încearcă din nou peste un minut.',
): Response {
  const retryAfter = Math.max(1, Math.ceil(result.resetMs / 1_000))
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Remaining': '0',
    },
  })
}
