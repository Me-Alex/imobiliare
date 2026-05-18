import { getEnv } from "./admin-api"

export class IntegrationConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "IntegrationConfigError"
  }
}

type Json = Record<string, any>

function requireEnv(names: string[]) {
  const missing = names.filter((name) => !getEnv(name))
  if (missing.length) throw new IntegrationConfigError(`Missing provider configuration: ${missing.join(", ")}`)
}

function formBody(values: Record<string, string | number | boolean | undefined | null>) {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") body.set(key, String(value))
  }
  return body
}

function base64Url(input: string | ArrayBuffer) {
  let binary = ""
  if (typeof input === "string") binary = input
  else {
    const bytes = new Uint8Array(input)
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function utf8Base64Url(value: unknown) {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value))
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n").replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "")
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function signJwt(payload: Json, privateKeyPem: string) {
  const header = { alg: "RS256", typ: "JWT" }
  const input = `${utf8Base64Url(header)}.${utf8Base64Url(payload)}`
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input))
  return `${input}.${base64Url(signature)}`
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function parseJsonResponse(response: Response) {
  const text = await response.text()
  const body = text ? JSON.parse(text) : {}
  if (!response.ok) throw new Error(body?.message || body?.error?.message || body?.error || `Provider request failed with ${response.status}`)
  return body
}

export function providerStatus() {
  return {
    resend: Boolean(getEnv("RESEND_API_KEY") && getEnv("RESEND_FROM_EMAIL")),
    twilio: Boolean(getEnv("TWILIO_ACCOUNT_SID") && getEnv("TWILIO_AUTH_TOKEN") && getEnv("TWILIO_FROM_NUMBER")),
    google: Boolean(getEnv("GOOGLE_CALENDAR_ID") && getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL") && getEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")),
    docusign: Boolean(getEnv("DOCUSIGN_INTEGRATION_KEY") && getEnv("DOCUSIGN_USER_ID") && getEnv("DOCUSIGN_ACCOUNT_ID") && getEnv("DOCUSIGN_PRIVATE_KEY") && getEnv("DOCUSIGN_BASE_URL")),
    stripe: Boolean(getEnv("STRIPE_SECRET_KEY")),
  }
}

export async function sendResendEmail(input: { to: string; subject: string; html?: string; text?: string }) {
  requireEnv(["RESEND_API_KEY", "RESEND_FROM_EMAIL"])
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEnv("RESEND_FROM_EMAIL"),
      to: [input.to],
      subject: input.subject,
      html: input.html || `<p>${input.text || input.subject}</p>`,
      text: input.text,
    }),
  })
  return parseJsonResponse(response)
}

export async function sendTwilioSms(input: { to: string; body: string; statusCallback?: string }) {
  requireEnv(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"])
  const sid = getEnv("TWILIO_ACCOUNT_SID")!
  const token = getEnv("TWILIO_AUTH_TOKEN")!
  const auth = btoa(`${sid}:${token}`)
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody({ From: getEnv("TWILIO_FROM_NUMBER"), To: input.to, Body: input.body, StatusCallback: input.statusCallback }),
  })
  return parseJsonResponse(response)
}

async function getGoogleAccessToken() {
  requireEnv(["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"])
  const now = Math.floor(Date.now() / 1000)
  const payload: Json = {
    iss: getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    scope: "https://www.googleapis.com/auth/calendar.events",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }
  const subject = getEnv("GOOGLE_WORKSPACE_IMPERSONATE_EMAIL")
  if (subject) payload.sub = subject
  const assertion = await signJwt(payload, getEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")!)
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  })
  const body = await parseJsonResponse(response)
  return String(body.access_token || "")
}

export async function createGoogleCalendarEvent(input: { summary: string; description?: string; start: string; end: string; attendees?: string[]; location?: string }) {
  requireEnv(["GOOGLE_CALENDAR_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"])
  const token = await getGoogleAccessToken()
  const calendarId = encodeURIComponent(getEnv("GOOGLE_CALENDAR_ID")!)
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?sendUpdates=all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      attendees: (input.attendees || []).filter(Boolean).map((email) => ({ email })),
    }),
  })
  return parseJsonResponse(response)
}

async function getDocuSignAccessToken() {
  requireEnv(["DOCUSIGN_INTEGRATION_KEY", "DOCUSIGN_USER_ID", "DOCUSIGN_PRIVATE_KEY", "DOCUSIGN_BASE_URL"])
  const baseUrl = getEnv("DOCUSIGN_BASE_URL") || ""
  const authHost = baseUrl.includes("demo") ? "account-d.docusign.com" : "account.docusign.com"
  const now = Math.floor(Date.now() / 1000)
  const assertion = await signJwt({
    iss: getEnv("DOCUSIGN_INTEGRATION_KEY"),
    sub: getEnv("DOCUSIGN_USER_ID"),
    aud: authHost,
    iat: now,
    exp: now + 3600,
    scope: "signature impersonation",
  }, getEnv("DOCUSIGN_PRIVATE_KEY")!)
  const response = await fetch(`https://${authHost}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  })
  const body = await parseJsonResponse(response)
  return String(body.access_token || "")
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export async function createDocuSignEnvelope(input: { signerEmail: string; signerName: string; subject: string; documentHtml?: string; returnUrl?: string }) {
  requireEnv(["DOCUSIGN_ACCOUNT_ID", "DOCUSIGN_BASE_URL"])
  const token = await getDocuSignAccessToken()
  const accountId = getEnv("DOCUSIGN_ACCOUNT_ID")!
  const baseUrl = getEnv("DOCUSIGN_BASE_URL")!.replace(/\/$/, "")
  const clientUserId = input.signerEmail.toLowerCase()
  const documentHtml = input.documentHtml || `<h1>${input.subject}</h1><p>Document generat de HQS Imobiliare.</p><p>Semnatar: ${input.signerName} (${input.signerEmail})</p>`
  const response = await fetch(`${baseUrl}/v2.1/accounts/${accountId}/envelopes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      emailSubject: input.subject,
      documents: [{ documentBase64: toBase64(documentHtml), name: `${input.subject}.html`, fileExtension: "html", documentId: "1" }],
      recipients: { signers: [{ email: input.signerEmail, name: input.signerName, recipientId: "1", routingOrder: "1", clientUserId, tabs: { signHereTabs: [{ documentId: "1", pageNumber: "1", xPosition: "80", yPosition: "180" }] } }] },
      status: "sent",
    }),
  })
  const envelope = await parseJsonResponse(response)
  if (!input.returnUrl) return envelope
  const viewResponse = await fetch(`${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelope.envelopeId}/views/recipient`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ returnUrl: input.returnUrl, authenticationMethod: "none", email: input.signerEmail, userName: input.signerName, recipientId: "1", clientUserId }),
  })
  const view = await parseJsonResponse(viewResponse)
  return { ...envelope, recipientViewUrl: view.url }
}

async function stripeRequest(path: string, params: Record<string, string | number | boolean | undefined | null>) {
  requireEnv(["STRIPE_SECRET_KEY"])
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getEnv("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-02-25.clover",
    },
    body: formBody(params),
  })
  return parseJsonResponse(response)
}

export async function createStripeInvoice(input: { clientEmail: string; clientName?: string; description: string; amount: number; currency?: string; propertyId?: string }) {
  const customer = await stripeRequest("/customers", { email: input.clientEmail, name: input.clientName })
  await stripeRequest("/invoiceitems", {
    customer: customer.id,
    amount: Math.round(Number(input.amount || 0) * 100),
    currency: (input.currency || "eur").toLowerCase(),
    description: input.description,
    "metadata[property_id]": input.propertyId,
  })
  const invoice = await stripeRequest("/invoices", {
    customer: customer.id,
    auto_advance: true,
    collection_method: "send_invoice",
    days_until_due: 7,
    "metadata[property_id]": input.propertyId,
  })
  const sent = await stripeRequest(`/invoices/${invoice.id}/send`, {})
  return { customer, invoice: sent }
}

export async function verifyStripeSignature(payload: string, header: string | null) {
  requireEnv(["STRIPE_WEBHOOK_SECRET"])
  if (!header) return false
  const parts = Object.fromEntries(header.split(",").map((part) => {
    const [key, ...rest] = part.split("=")
    return [key, rest.join("=")]
  }))
  if (!parts.t || !parts.v1) return false
  const expected = await hmacSha256Hex(getEnv("STRIPE_WEBHOOK_SECRET")!, `${parts.t}.${payload}`)
  return expected === parts.v1
}
