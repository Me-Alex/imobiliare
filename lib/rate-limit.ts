import { NextResponse } from "next/server"

const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(request: Request, scope: string, limit = 30, windowMs = 60_000) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local"
  const key = `${scope}:${ip}`
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return NextResponse.json({ error: "Prea multe cereri. Incearca din nou peste cateva minute." }, { status: 429 })
  }

  return null
}
