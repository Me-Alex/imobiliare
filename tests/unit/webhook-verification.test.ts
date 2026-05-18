import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { verifyDocuSignWebhook, verifyResendWebhook, verifyStripeSignature, verifyTwilioWebhook } from "@/lib/admin-integrations"

describe("webhook verification", () => {
  it("validates Twilio form signatures", async () => {
    process.env.TWILIO_AUTH_TOKEN = "twilio-secret"
    const url = "https://hqsimobiliare.ro/api/webhooks/twilio"
    const params = { MessageSid: "SM123", MessageStatus: "delivered" }
    const signed = `${url}MessageSidSM123MessageStatusdelivered`
    const signature = createHmac("sha1", "twilio-secret").update(signed).digest("base64")
    await expect(verifyTwilioWebhook(url, params, signature)).resolves.toMatchObject({ ok: true, configured: true })
  })

  it("validates Resend Svix-style signatures with raw body", async () => {
    process.env.RESEND_WEBHOOK_SECRET = "resend-secret"
    const payload = JSON.stringify({ id: "evt_1", type: "email.delivered" })
    const id = "msg_1"
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = createHmac("sha256", "resend-secret").update(`${id}.${timestamp}.${payload}`).digest("base64")
    const headers = new Headers({ "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${signature}` })
    await expect(verifyResendWebhook(payload, headers)).resolves.toMatchObject({ ok: true, configured: true })
  })

  it("validates DocuSign HMAC signatures", async () => {
    process.env.DOCUSIGN_HMAC_KEY = "docusign-secret"
    const payload = JSON.stringify({ envelopeId: "env_1", status: "completed" })
    const signature = createHmac("sha256", "docusign-secret").update(payload).digest("base64")
    const headers = new Headers({ "x-docusign-signature-1": signature })
    await expect(verifyDocuSignWebhook(payload, headers)).resolves.toMatchObject({ ok: true, configured: true })
  })

  it("validates Stripe signatures with timestamp tolerance", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "stripe-secret"
    const payload = JSON.stringify({ id: "evt_1", type: "invoice.paid" })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = createHmac("sha256", "stripe-secret").update(`${timestamp}.${payload}`).digest("hex")
    await expect(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`)).resolves.toBe(true)
  })
})
