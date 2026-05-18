import { describe, expect, it } from "vitest"
import { adminMediaUploadSchema, clientNotificationUpdateSchema, leadRequestSchema, ownerFeedbackSchema, savedSearchSchema, valuationSchema } from "@/lib/api-validation"

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

  it("validates notification updates require a target unless marking all", () => {
    expect(clientNotificationUpdateSchema.safeParse({ action: "read" }).success).toBe(false)
    expect(clientNotificationUpdateSchema.parse({ action: "read_all" }).action).toBe("read_all")
  })

  it("normalizes admin media upload defaults", () => {
    const parsed = adminMediaUploadSchema.parse({ property_id: "prop-1", file_name: "cover.jpg" })
    expect(parsed.kind).toBe("gallery")
    expect(parsed.content_type).toBe("application/octet-stream")
    expect(parsed.size).toBe(0)
  })

  it("validates saved search payloads", () => {
    const parsed = savedSearchSchema.parse({ label: "Pipera 3 camere", filters: { zone: "Pipera", rooms: 3 }, results_count: 12 })
    expect(parsed.notifications_enabled).toBe(true)
    expect(parsed.filters.zone).toBe("Pipera")
  })

  it("validates owner feedback payloads", () => {
    const parsed = ownerFeedbackSchema.parse({ property_id: "prop-1", rating: "4", message: "Vreau raport mai detaliat dupa vizionare." })
    expect(parsed.rating).toBe(4)
    expect(parsed.category).toBe("GENERAL")
  })
})
