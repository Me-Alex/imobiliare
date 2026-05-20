import { describe, expect, it } from "vitest"
import { appointmentRequestCompatSchema, leadRequestSchema, valuationSchema } from "@/lib/api-validation"

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
})
