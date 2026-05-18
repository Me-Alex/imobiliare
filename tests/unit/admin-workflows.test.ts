import { describe, expect, it } from "vitest"
import { buildPropertyPublishChecklist, leadNextAction } from "@/lib/admin-workflows"

describe("admin workflow helpers", () => {
  it("blocks property publishing when required commercial fields are missing", () => {
    const result = buildPropertyPublishChecklist({ id: "p1", title: "Test", price: 0 })

    expect(result.ready).toBe(false)
    expect(result.score).toBeLessThan(50)
    expect(result.missing.map((item) => item.id)).toContain("cover")
    expect(result.missing.map((item) => item.id)).toContain("pricing")
  })

  it("accepts cover media and gallery media when scoring a ready property", () => {
    const result = buildPropertyPublishChecklist(
      {
        id: "p1",
        title: "Apartament premium Pipera",
        price: 250000,
        currency: "EUR",
        city: "Bucuresti",
        address: "Pipera",
        area_sqm: 90,
        rooms: 3,
        description: "Apartament premium cu terasa, compartimentare practica, acces rapid catre scoli private, birouri si zone verzi din nordul Bucurestiului.",
        meta_title: "Apartament premium Pipera | HQS Imobiliare",
        meta_description: "Apartament premium in Pipera cu terasa, parcare, acces bun si analiza completa HQS pentru cumparatori.",
        owner_email: "owner@example.com",
        agent_email: "agent@example.com",
        amenities: ["terasa", "parcare", "boxa"],
      },
      [
        { property_id: "p1", kind: "cover" },
        { property_id: "p1", kind: "gallery" },
        { property_id: "p1", kind: "gallery" },
      ],
    )

    expect(result.ready).toBe(true)
    expect(result.score).toBe(100)
  })

  it("prioritizes stale high-score leads", () => {
    const result = leadNextAction({
      status: "NEW",
      score: 90,
      phone: "0712345678",
      updated_at: "2026-05-16T10:00:00.000Z",
    }, new Date("2026-05-18T10:00:00.000Z"))

    expect(result.label).toBe("Suna azi")
    expect(result.priority).toBe("HIGH")
    expect(result.reasons).toContain("scor mare")
    expect(result.reasons).toContain("lead vechi")
  })
})
