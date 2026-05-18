import { describe, expect, it } from "vitest"
import { normalizePropertyPatch } from "@/lib/admin-properties"

describe("admin property patch normalization", () => {
  it("does not reset full property fields during status-only updates", () => {
    const patch = normalizePropertyPatch({ status: "PUBLISHED" })

    expect(patch.status).toBe("PUBLISHED")
    expect(patch.title).toBeUndefined()
    expect(patch.price).toBeUndefined()
    expect(patch.city).toBeUndefined()
    expect(patch.published_at).toBeTruthy()
  })

  it("keeps explicit aliases for partial edits", () => {
    const patch = normalizePropertyPatch({ surface: 92, baths: 2, zone: "Pipera" })

    expect(patch.area_sqm).toBe(92)
    expect(patch.bathrooms).toBe(2)
    expect(patch.city).toBe("Pipera")
    expect(patch.status).toBeUndefined()
  })
})
