import { describe, expect, it } from "vitest"
import { cleanLocation, formatPropertyArea, formatPropertyCount, formatPropertyPrice } from "@/lib/property-display"

describe("property display helpers", () => {
  it("does not expose zero prices as EUR 0", () => {
    expect(formatPropertyPrice(0)).toBe("Pret la cerere")
    expect(formatPropertyPrice(null)).toBe("Pret la cerere")
    expect(formatPropertyPrice(455000)).toBe("EUR 455.000")
  })

  it("formats missing dimensions as request-only data", () => {
    expect(formatPropertyArea(0)).toBe("La cerere")
    expect(formatPropertyArea(118)).toBe("118 mp")
    expect(formatPropertyCount(0, "camera", "camere")).toBe("-")
    expect(formatPropertyCount(3, "camera", "camere")).toBe("3 camere")
  })

  it("removes empty, null-like, duplicate location parts", () => {
    expect(cleanLocation(null, " Bucuresti ", "Bucuresti", "Romania")).toBe("Bucuresti, Romania")
    expect(cleanLocation(",", "undefined", "-")).toBe("")
  })
})
