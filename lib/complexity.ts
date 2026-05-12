import type { Property } from "@/lib/supabase"

export type ComplexityPillar = {
  key: string
  title: string
  complexity: "ridicat" | "foarte ridicat" | "enterprise"
  surfaces: string[]
  outcome: string
}

export type ValuationInput = {
  area: number
  rooms: number
  zone: string
  condition: "renovat" | "bun" | "de-renovat" | "premium"
  parking: number
  floor?: number
}

export type OfferInput = {
  propertyTitle: string
  listPrice: number
  clientBudget: number
  advancePercent: number
  closingDays: number
  riskLevel: "scazut" | "mediu" | "ridicat"
}

export const complexityPillars: ComplexityPillar[] = [
  { key: "accounts", title: "Cont client si profil financiar", complexity: "foarte ridicat", surfaces: ["Portal", "Favorite", "Comparare"], outcome: "profil salvat, buget, lista scurta si progres" },
  { key: "crm", title: "CRM pipeline avansat", complexity: "enterprise", surfaces: ["Admin", "Clienti", "Vizionari"], outcome: "lead scoring, etape, follow-up si semnale operationale" },
  { key: "cms", title: "CMS pentru proprietati si continut", complexity: "foarte ridicat", surfaces: ["Admin", "Proprietati", "Zone"], outcome: "continut editabil, publicare si zone SEO" },
  { key: "property-data", title: "Date detaliate pe proprietate", complexity: "enterprise", surfaces: ["Detalii proprietate", "Comparare"], outcome: "pret/mp, rata, risc, checklist si schema.org" },
  { key: "maps-poi", title: "Harta, micro-zone si puncte de interes", complexity: "foarte ridicat", surfaces: ["Zone", "Detalii"], outcome: "context local pentru scoli, business, parcari si transport" },
  { key: "recommendations", title: "Recomandari inteligente", complexity: "enterprise", surfaces: ["Home", "API"], outcome: "scor de potrivire si motive explicabile" },
  { key: "calendar", title: "Calendar vizionari", complexity: "foarte ridicat", surfaces: ["Portal", "API"], outcome: "sloturi recomandate dupa urgenta si disponibilitate" },
  { key: "documents", title: "Dosar documente", complexity: "foarte ridicat", surfaces: ["Portal", "Admin"], outcome: "checklist acte, status si expirari" },
  { key: "automations", title: "Automatizari follow-up", complexity: "enterprise", surfaces: ["Admin", "Notificari"], outcome: "memento-uri, task-uri si mesaje planificate" },
  { key: "reports", title: "Rapoarte business", complexity: "enterprise", surfaces: ["Admin", "Portal"], outcome: "pipeline, portofoliu, conversie si export" },
  { key: "programmatic-seo", title: "SEO programatic", complexity: "foarte ridicat", surfaces: ["Zone", "Proprietati"], outcome: "pagini locale, metadata si structurare pentru cautare" },
  { key: "premium-detail", title: "Pagina proprietate premium", complexity: "enterprise", surfaces: ["Detalii"], outcome: "galerie, riscuri, oferta, documente si proprietati similare" },
  { key: "offers", title: "Sistem de oferta", complexity: "foarte ridicat", surfaces: ["Portal", "API"], outcome: "oferta calculata, avans, termene si pozitie de negociere" },
  { key: "roles", title: "Roluri si permisiuni admin", complexity: "enterprise", surfaces: ["Admin", "Utilizatori"], outcome: "responsabilitati pe agent, manager si owner" },
  { key: "audit-security", title: "Audit si securitate operationala", complexity: "enterprise", surfaces: ["Admin", "API"], outcome: "log actiuni, validari si erori explicite" },
]

export const localMarketMatrix = [
  { zone: "Pipera", avgPrice: 2190, rentYield: 5.6, liquidity: 82, growth: 8.4, risk: "mediu", poi: ["scoli private", "birouri", "centura", "restaurante"] },
  { zone: "Floreasca", avgPrice: 3010, rentYield: 4.9, liquidity: 91, growth: 7.1, risk: "scazut", poi: ["parc", "mall", "clinici", "business"] },
  { zone: "Corbeanca", avgPrice: 1680, rentYield: 4.1, liquidity: 68, growth: 6.2, risk: "mediu", poi: ["teren", "scoli", "lac", "aeroport"] },
  { zone: "Bucuresti Nord", avgPrice: 2450, rentYield: 5.2, liquidity: 86, growth: 7.8, risk: "scazut", poi: ["metrou", "business", "educatie", "servicii"] },
]

export function getMarketSignal(zone: string) {
  const q = zone.toLowerCase()
  return localMarketMatrix.find((item) => q.includes(item.zone.toLowerCase()) || item.zone.toLowerCase().includes(q)) || localMarketMatrix[3]
}

export function calculateValuation(input: ValuationInput) {
  const market = getMarketSignal(input.zone || "Bucuresti Nord")
  const conditionFactor = { premium: 1.14, renovat: 1.06, bun: 1, "de-renovat": 0.88 }[input.condition]
  const roomFactor = input.rooms >= 4 ? 1.05 : input.rooms === 1 ? 0.94 : 1
  const parkingBonus = Math.min(input.parking, 3) * 8500
  const floorFactor = typeof input.floor === "number" && input.floor <= 1 ? 0.97 : 1
  const base = input.area * market.avgPrice * conditionFactor * roomFactor * floorFactor + parkingBonus
  const low = Math.round(base * 0.94)
  const high = Math.round(base * 1.07)

  return {
    market,
    low,
    mid: Math.round(base),
    high,
    confidence: Math.min(94, 68 + Math.round(market.liquidity / 5) + (input.area > 40 ? 7 : 0)),
    notes: [
      `Pret mediu zona: EUR ${market.avgPrice}/mp`,
      `Lichiditate estimata: ${market.liquidity}/100`,
      `Randament chirie: ${market.rentYield}%`,
      `Risc piata: ${market.risk}`,
    ],
  }
}

export function buildOfferDraft(input: OfferInput) {
  const pressure = input.riskLevel === "ridicat" ? 0.91 : input.riskLevel === "mediu" ? 0.95 : 0.98
  const budgetCap = Math.min(input.listPrice, input.clientBudget)
  const recommended = Math.round(budgetCap * pressure)
  const advance = Math.round(recommended * (input.advancePercent / 100))
  const negotiationRoom = Math.max(0, input.listPrice - recommended)

  return {
    propertyTitle: input.propertyTitle,
    recommended,
    advance,
    negotiationRoom,
    closingDays: input.closingDays,
    clauses: [
      "oferta conditionata de verificarea actelor",
      "termen de raspuns 48 de ore",
      "avans platibil dupa semnarea promisiunii",
      input.riskLevel === "ridicat" ? "clauza suplimentara pentru remedierea observatiilor tehnice" : "calendar rapid pentru notar si banca",
    ],
  }
}

export function buildViewingSlots(urgency: "rapid" | "normal" | "flexibil" = "normal") {
  const now = new Date()
  const spacing = urgency === "rapid" ? [1, 2, 3, 4] : urgency === "normal" ? [2, 4, 6, 8] : [5, 7, 10, 12]
  return spacing.map((days, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() + days)
    date.setHours(index % 2 === 0 ? 11 : 17, 30, 0, 0)
    return {
      iso: date.toISOString(),
      label: date.toLocaleString("ro-RO", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }),
      score: 94 - index * 7,
    }
  })
}

export function buildPortfolioAnalytics(properties: Property[]) {
  const published = properties.filter((p) => p.status === "PUBLISHED")
  const totalValue = published.reduce((sum, p) => sum + Number(p.price || 0), 0)
  const avgPrice = published.length ? Math.round(totalValue / published.length) : 0
  const avgSqm = published.length ? Math.round(published.reduce((sum, p) => sum + (p.area_sqm ? p.price / p.area_sqm : 0), 0) / published.length) : 0
  const premium = published.filter((p) => p.featured).length
  const byCity = published.reduce<Record<string, number>>((acc, p) => {
    acc[p.city || "Necunoscut"] = (acc[p.city || "Necunoscut"] || 0) + 1
    return acc
  }, {})

  return {
    published: published.length,
    totalValue,
    avgPrice,
    avgSqm,
    premium,
    byCity,
    conversionForecast: Math.min(34, 11 + premium * 3 + published.length),
    inventoryHealth: Math.min(100, 55 + published.length * 4 + premium * 6),
  }
}

export function buildSeoBlueprint(zone: string, type = "apartamente") {
  const market = getMarketSignal(zone)
  return {
    title: `${type} in ${market.zone} | HQS Imobiliare`,
    description: `Ghid local pentru ${type.toLowerCase()} in ${market.zone}: pret mediu, cerere, randament, riscuri si proprietati verificate.`,
    sections: ["preturi si randament", "micro-zone", "documente importante", "proprietati active", "intrebari frecvente"],
    internalLinks: ["/proprietati", `/zone/${market.zone.toLowerCase().replace(/\s+/g, "-")}`, "/portal", "/comparare"],
  }
}
