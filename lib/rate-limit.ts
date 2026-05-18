import { NextResponse } from "next/server"
import { getEnv } from "@/lib/admin-api"
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase"

function getClientIp(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim()
  if (cloudflareIp) return cloudflareIp

  const forwardedFor = request.headers.get("x-forwarded-for")
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim()
  return firstForwardedIp || "local"
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function rateLimitError(message: string, status = 503, retryAfter = 30) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Retry-After": String(retryAfter) } },
  )
}

export async function rateLimit(request: Request, scope: string, limit = 30, windowMs = 60_000) {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const salt = getEnv("RATE_LIMIT_SALT") || supabaseUrl
  const identifierHash = await sha256(`${salt}:${getClientIp(request)}`)

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_rate_limit`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_scope: scope,
      p_identifier_hash: identifierHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    }),
  }).catch(() => null)

  if (!response?.ok) {
    return rateLimitError("Limitarea cererilor este temporar indisponibila. Incearca din nou in cateva momente.")
  }

  const payload = await response.json().catch(() => null)
  const result = Array.isArray(payload) ? payload[0] : payload
  if (!result || typeof result !== "object") {
    return rateLimitError("Limitarea cererilor este temporar indisponibila. Incearca din nou in cateva momente.")
  }

  const retryAfter = Math.max(1, Number(result.retry_after || windowSeconds))
  const count = Number(result.request_count || result.count || 0)
  const remaining = Math.max(0, limit - count)
  const headers = {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": result.reset_at ? String(result.reset_at) : "",
  }

  if (result.allowed === false) {
    return NextResponse.json(
      { error: "Prea multe cereri. Incearca din nou peste cateva minute." },
      { status: 429, headers },
    )
  }

  return null
}
