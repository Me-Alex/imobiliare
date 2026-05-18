import { describe, expect, it } from "vitest"
import { buildOfferDraft, calculateValuation, getMarketSignal } from "@/lib/complexity"

describe("complexity calculations", () => {
  it("returns a known market signal fallback", () => {
    expect(getMarketSignal("zona necunoscuta").zone).toBe("Bucuresti Nord")
    expect(getMarketSignal("Pipera Nord").zone).toBe("Pipera")
  })

  it("keeps valuation inside a coherent price band", () => {
    const valuation = calculateValuation({ area: 70, rooms: 3, zone: "Floreasca", condition: "bun", parking: 1 })
    expect(valuation.low).toBeLessThan(valuation.mid)
    expect(valuation.mid).toBeLessThan(valuation.high)
    expect(valuation.confidence).toBeGreaterThan(70)
  })

  it("caps offer by client budget before risk discount", () => {
    const offer = buildOfferDraft({ propertyTitle: "Test", listPrice: 300000, clientBudget: 250000, advancePercent: 20, closingDays: 30, riskLevel: "mediu" })
    expect(offer.recommended).toBeLessThanOrEqual(250000)
    expect(offer.advance).toBe(Math.round(offer.recommended * 0.2))
  })
})
