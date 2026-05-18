import { describe, expect, it } from "vitest"
import { leadRequestSchema, valuationSchema } from "@/lib/api-validation"

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
})
