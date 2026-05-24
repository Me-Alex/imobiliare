import { jsonError } from "@/lib/admin-api"

function timingSafeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a)
  const right = new TextEncoder().encode(b)
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i]
  return diff === 0
}

async function hmacBase64(secret: string, payload: string, algorithm: "SHA-1" | "SHA-256" = "SHA-256") {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"])
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(signed)))
}

function getSecret(name: string) {
  const contextKey = Symbol.for('__cloudflare-request-context__')
  const context = (globalThis as typeof globalThis & Record<symbol, { env?: Record<string, string | undefined> } | undefined>)[contextKey]
  const secret = context?.env?.[name] || process.env[name]
  return typeof secret === "string" && secret.trim() ? secret.trim() : ""
}

export async function requireSharedWebhookSecret(request: Request, envName: string) {
  const secret = getSecret(envName)
  if (!secret) return jsonError(`${envName} is not configured.`, 503)
  const header = request.headers.get("x-hqs-webhook-secret") || request.headers.get("x-webhook-secret") || ""
  if (!timingSafeEqual(header, secret)) return jsonError("Invalid webhook signature.", 401)
  return null
}

export async function requireDocusignWebhookSignature(request: Request, rawBody: string) {
  const secret = getSecret("DOCUSIGN_WEBHOOK_SECRET")
  if (!secret) return jsonError("DOCUSIGN_WEBHOOK_SECRET is not configured.", 503)
  const signature = request.headers.get("x-docusign-signature-1") || request.headers.get("x-hqs-webhook-signature") || ""
  const expected = await hmacBase64(secret, rawBody)
  if (!signature || !timingSafeEqual(signature, expected)) return jsonError("Invalid DocuSign webhook signature.", 401)
  return null
}

export async function requireTwilioWebhookSignature(request: Request, rawBody: string) {
  const secret = getSecret("TWILIO_AUTH_TOKEN")
  if (!secret) return jsonError("TWILIO_AUTH_TOKEN is not configured.", 503)
  const signature = request.headers.get("x-twilio-signature") || ""
  const params = new URLSearchParams(rawBody)
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}`
  const signedPayload = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => `${acc}${key}${value}`, baseUrl)
  const expected = await hmacBase64(secret, signedPayload, "SHA-1")
  if (!signature || !timingSafeEqual(signature, expected)) return jsonError("Invalid Twilio webhook signature.", 401)
  return null
}
