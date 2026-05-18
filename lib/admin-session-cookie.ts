import type { AdminSession } from "@/lib/admin-api"

export const ADMIN_SESSION_COOKIE = "hqs_admin_session"

type CookiePayload = {
  email: string
  userId: string
  role: AdminSession["role"]
  exp: number
}

function getSigningSecret() {
  const env = typeof process !== "undefined" ? process.env as Record<string, string | undefined> : {}
  return env.ADMIN_SESSION_SIGNING_SECRET || env.RATE_LIMIT_SALT || "hqs-admin-session-dev"
}

function base64UrlEncode(value: string | ArrayBuffer) {
  let binary = ""
  if (typeof value === "string") {
    const bytes = new TextEncoder().encode(value)
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  } else {
    const bytes = new Uint8Array(value)
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=")
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(getSigningSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
  return base64UrlEncode(signature)
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

export async function createAdminSessionCookie(session: AdminSession, maxAgeSeconds = 8 * 60 * 60) {
  const payload: CookiePayload = {
    email: session.email,
    userId: session.userId,
    role: session.role,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }
  const encoded = base64UrlEncode(JSON.stringify(payload))
  const signature = await sign(encoded)
  return { value: `${encoded}.${signature}`, maxAge: maxAgeSeconds }
}

export async function verifyAdminSessionCookie(value?: string | null) {
  if (!value) return null
  const [encoded, signature] = value.split(".")
  if (!encoded || !signature) return null
  const expected = await sign(encoded)
  if (!timingSafeEqual(expected, signature)) return null
  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as CookiePayload
    if (!payload.email || !payload.userId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
