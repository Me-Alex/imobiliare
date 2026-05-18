import { beforeEach, describe, expect, it } from "vitest"
import { BUYER_INTENT_KEY, FAVORITES_KEY, readBuyerIntent, readStoredIds, toggleStoredId, writeBuyerIntent } from "@/lib/client-preferences"

describe("client preferences", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("deduplicates stored ids through toggles", () => {
    expect(toggleStoredId(FAVORITES_KEY, "p1").ids).toEqual(["p1"])
    expect(toggleStoredId(FAVORITES_KEY, "p1").ids).toEqual([])
    expect(readStoredIds(FAVORITES_KEY)).toEqual([])
  })

  it("clamps buyer intent values", () => {
    writeBuyerIntent({ budget: 10, area: "Pipera", rooms: 99, purpose: "locuire" })
    const intent = readBuyerIntent()
    expect(intent.budget).toBe(75000)
    expect(intent.rooms).toBe(6)
    expect(intent.area).toBe("Pipera")
  })

  it("returns defaults for invalid local storage", () => {
    localStorage.setItem(BUYER_INTENT_KEY, "{bad json")
    expect(readBuyerIntent().budget).toBe(250000)
  })
})
