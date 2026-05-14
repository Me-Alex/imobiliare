import { NextResponse } from "next/server"

const buckets = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim()
  if (cloudflareIp) return cloudflareIp

  const forwardedFor = request.headers.get("x-forwarded-for")
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim()
  return firstForwardedIp || "local"
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 1_000) return
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt < now) buckets.delete(key)
  })
}

export function rateLimit(request: Request, scope: string, limit = 30, windowMs = 60_000) {
  const now = Date.now()
  pruneExpiredBuckets(now)

  const ip = getClientIp(request)
  const key = `${scope}:${ip}`
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  bucket.count += 1
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: "Prea multe cereri. Incearca din nou peste cateva minute." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    )
  }

  return null
}
