import { describe, expect, it } from "vitest"
import { appointmentRequestCompatSchema, leadRequestSchema, valuationSchema } from "@/lib/api-validation"
import { verifyStripeSignature } from "@/lib/admin-integrations"

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

describe("api validation", () => {
  it("requires either phone or email for leads", () => {
    const parsed = leadRequestSchema.safeParse({ name: "Client Test" })
    expect(parsed.success).toBe(false)
  })

  it("normalizes valid lead defaults", () => {
    const parsed = leadRequestSchema.parse({ name: "Client Test", phone: "0712345678" })
    expect(parsed.source).toBe("CONTACT_FORM")
    expect(parsed.budget).toBe(0)
  })

  it("clamps valuation defaults through schema", () => {
    const parsed = valuationSchema.parse({ area: "", rooms: "", zone: "", condition: "unknown", parking: "" })
    expect(parsed.area).toBe(70)
    expect(parsed.rooms).toBe(2)
    expect(parsed.condition).toBe("bun")
  })

  it("accepts appointment client field aliases", () => {
    const parsed = appointmentRequestCompatSchema.parse({
      client_name: "Client Test",
      client_phone: "0712345678",
      client_email: "client@example.com",
      starts_at: "2026-05-22T08:30:00.000Z",
    })

    expect(parsed.name).toBe("Client Test")
    expect(parsed.phone).toBe("0712345678")
    expect(parsed.email).toBe("client@example.com")
    expect(parsed.requested_at).toBe("2026-05-22T08:30:00.000Z")
  })

  it("accepts current Stripe webhook signatures and rejects replayed payloads", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    const payload = JSON.stringify({ id: "evt_test", type: "invoice.paid" })
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = await hmacSha256Hex("whsec_test", `${timestamp}.${payload}`)

    await expect(verifyStripeSignature(payload, `t=${timestamp},v1=bad,v1=${signature}`)).resolves.toBe(true)
    await expect(verifyStripeSignature(payload, `t=${timestamp - 301},v1=${signature}`)).resolves.toBe(false)
  })
})
