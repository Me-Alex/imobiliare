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

export type ScenarioAnalysisInput = {
  propertyPrice: number
  area: number
  zone: string
  monthlyRent: number
  advancePercent: number
  interestRate: number
  years: number
  renovationBudget: number
  holdingYears: number
  riskTolerance: number
  competitionLevel: "scazut" | "mediu" | "ridicat"
}

function finiteNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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
  const area = clampNumber(finiteNumber(input.area, 70), 15, 2_000)
  const rooms = Math.round(clampNumber(finiteNumber(input.rooms, 2), 1, 12))
  const parking = Math.round(clampNumber(finiteNumber(input.parking, 0), 0, 8))
  const floor = typeof input.floor === "number" ? Math.round(clampNumber(finiteNumber(input.floor, 0), -2, 80)) : undefined
  const market = getMarketSignal(input.zone || "Bucuresti Nord")
  const conditionFactor = { premium: 1.14, renovat: 1.06, bun: 1, "de-renovat": 0.88 }[input.condition]
  const roomFactor = rooms >= 4 ? 1.05 : rooms === 1 ? 0.94 : 1
  const parkingBonus = Math.min(parking, 3) * 8500
  const floorFactor = typeof floor === "number" && floor <= 1 ? 0.97 : 1
  const base = area * market.avgPrice * conditionFactor * roomFactor * floorFactor + parkingBonus
  const low = Math.round(base * 0.94)
  const high = Math.round(base * 1.07)

  return {
    market,
    low,
    mid: Math.round(base),
    high,
    confidence: Math.min(94, 68 + Math.round(market.liquidity / 5) + (area > 40 ? 7 : 0)),
    notes: [
      `Pret mediu zona: EUR ${market.avgPrice}/mp`,
      `Lichiditate estimata: ${market.liquidity}/100`,
      `Randament chirie: ${market.rentYield}%`,
      `Risc piata: ${market.risk}`,
    ],
  }
}

export function buildOfferDraft(input: OfferInput) {
  const listPrice = clampNumber(finiteNumber(input.listPrice, 250_000), 1_000, 50_000_000)
  const clientBudget = clampNumber(finiteNumber(input.clientBudget, listPrice), 1_000, 50_000_000)
  const advancePercent = clampNumber(finiteNumber(input.advancePercent, 20), 1, 95)
  const closingDays = Math.round(clampNumber(finiteNumber(input.closingDays, 30), 1, 365))
  const pressure = input.riskLevel === "ridicat" ? 0.91 : input.riskLevel === "mediu" ? 0.95 : 0.98
  const budgetCap = Math.min(listPrice, clientBudget)
  const recommended = Math.round(budgetCap * pressure)
  const advance = Math.round(recommended * (advancePercent / 100))
  const negotiationRoom = Math.max(0, listPrice - recommended)

  return {
    propertyTitle: input.propertyTitle,
    recommended,
    advance,
    negotiationRoom,
    closingDays,
    clauses: [
      "oferta conditionata de verificarea actelor",
      "termen de raspuns 48 de ore",
      "avans platibil dupa semnarea promisiunii",
      input.riskLevel === "ridicat" ? "clauza suplimentara pentru remedierea observatiilor tehnice" : "calendar rapid pentru notar si banca",
    ],
  }
}

export function buildScenarioAnalysis(input: ScenarioAnalysisInput) {
  const market = getMarketSignal(input.zone || "Bucuresti Nord")
  const propertyPrice = clampNumber(finiteNumber(input.propertyPrice, 250_000), 25_000, 50_000_000)
  const area = clampNumber(finiteNumber(input.area, 70), 15, 2_000)
  const monthlyRent = clampNumber(finiteNumber(input.monthlyRent, Math.round(propertyPrice * 0.004)), 0, 250_000)
  const advancePercent = clampNumber(finiteNumber(input.advancePercent, 20), 5, 95)
  const interestRate = clampNumber(finiteNumber(input.interestRate, 6.2), 0.5, 18)
  const years = Math.round(clampNumber(finiteNumber(input.years, 25), 1, 35))
  const renovationBudget = clampNumber(finiteNumber(input.renovationBudget, 0), 0, propertyPrice)
  const holdingYears = Math.round(clampNumber(finiteNumber(input.holdingYears, 5), 1, 20))
  const riskTolerance = Math.round(clampNumber(finiteNumber(input.riskTolerance, 3), 1, 5))
  const competitionPressure = { scazut: 0.98, mediu: 0.95, ridicat: 0.91 }[input.competitionLevel]
  const liquidityPressure = market.liquidity > 88 ? 0.985 : market.liquidity < 72 ? 0.93 : 0.96
  const conditionReserve = Math.max(0.025, Math.min(0.12, renovationBudget / propertyPrice))
  const closingCosts = Math.round(propertyPrice * 0.025)
  const downPayment = Math.round(propertyPrice * (advancePercent / 100))
  const financedAmount = Math.max(0, propertyPrice - downPayment)
  const monthlyPayment = estimateAmortizedPayment(financedAmount, interestRate, years)
  const annualRent = monthlyRent * 12
  const operatingCosts = Math.round(annualRent * 0.18 + propertyPrice * 0.006)
  const annualDebtService = monthlyPayment * 12
  const annualCashflow = Math.round(annualRent - operatingCosts - annualDebtService)
  const grossYield = roundOne((annualRent / propertyPrice) * 100)
  const netYield = roundOne(((annualRent - operatingCosts) / (propertyPrice + renovationBudget + closingCosts)) * 100)
  const totalCashNeeded = downPayment + renovationBudget + closingCosts
  const pricePerSqm = Math.round(propertyPrice / area)
  const marketDelta = roundOne(((pricePerSqm - market.avgPrice) / market.avgPrice) * 100)
  const exitValue = Math.round((propertyPrice + renovationBudget * 0.62) * Math.pow(1 + market.growth / 100, holdingYears))
  const remainingLoan = estimateRemainingLoan(financedAmount, interestRate, years, holdingYears)
  const projectedEquity = Math.round(exitValue - remainingLoan + annualCashflow * holdingYears - totalCashNeeded)
  const projectedRoi = roundOne((projectedEquity / Math.max(totalCashNeeded, 1)) * 100)
  const liquidityScore = Math.round(clampNumber(market.liquidity + (marketDelta < -4 ? 7 : marketDelta > 8 ? -8 : 0) - conditionReserve * 25, 1, 100))
  const riskScore = Math.round(clampNumber(100 - liquidityScore + conditionReserve * 120 + (annualCashflow < 0 ? 12 : -4) - riskTolerance * 4, 1, 100))
  const recommendedOffer = Math.round(propertyPrice * competitionPressure * liquidityPressure * (1 - conditionReserve / 2))
  const negotiationRoom = Math.max(0, propertyPrice - recommendedOffer)
  const verdict = projectedRoi >= 24 && riskScore < 55
    ? "continua"
    : projectedRoi >= 8 && riskScore < 72
      ? "negociaza"
      : "asteapta"

  return {
    market,
    financing: {
      downPayment,
      financedAmount,
      monthlyPayment,
      annualDebtService,
      totalCashNeeded,
      closingCosts,
    },
    performance: {
      grossYield,
      netYield,
      annualCashflow,
      exitValue,
      projectedEquity,
      projectedRoi,
      pricePerSqm,
      marketDelta,
    },
    negotiation: {
      recommendedOffer,
      negotiationRoom,
      competitionPressure,
      liquidityPressure,
      conditionReserve: roundOne(conditionReserve * 100),
    },
    risk: {
      liquidityScore,
      riskScore,
      verdict,
      redFlags: buildRedFlags(marketDelta, annualCashflow, conditionReserve, riskScore),
      strengths: buildStrengths(market.liquidity, grossYield, marketDelta, projectedRoi),
    },
    nextActions: buildScenarioActions(verdict, negotiationRoom, annualCashflow),
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

function estimateAmortizedPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0) return 0
  const months = Math.max(1, years * 12)
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate === 0) return Math.round(principal / months)
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  return Math.round(payment)
}

function estimateRemainingLoan(principal: number, annualRate: number, years: number, holdingYears: number) {
  if (principal <= 0) return 0
  const months = Math.max(1, years * 12)
  const paidMonths = Math.min(months, holdingYears * 12)
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate === 0) return Math.round(principal * (1 - paidMonths / months))
  const payment = estimateAmortizedPayment(principal, annualRate, years)
  const balance = principal * Math.pow(1 + monthlyRate, paidMonths) - payment * ((Math.pow(1 + monthlyRate, paidMonths) - 1) / monthlyRate)
  return Math.round(Math.max(0, balance))
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

function buildRedFlags(marketDelta: number, annualCashflow: number, conditionReserve: number, riskScore: number) {
  return [
    marketDelta > 8 ? "pret/mp peste media zonei" : "",
    annualCashflow < 0 ? "cashflow anual negativ dupa costuri si credit" : "",
    conditionReserve > 0.08 ? "buget mare de renovare fata de pret" : "",
    riskScore > 70 ? "risc operational peste pragul recomandat" : "",
  ].filter(Boolean)
}

function buildStrengths(liquidity: number, grossYield: number, marketDelta: number, projectedRoi: number) {
  return [
    liquidity >= 85 ? "lichiditate ridicata in zona" : "",
    grossYield >= 5 ? "randament brut competitiv" : "",
    marketDelta < -4 ? "pret/mp sub media zonei" : "",
    projectedRoi >= 24 ? "randament proiectat solid la exit" : "",
  ].filter(Boolean)
}

function buildScenarioActions(verdict: "continua" | "negociaza" | "asteapta", negotiationRoom: number, annualCashflow: number) {
  if (verdict === "continua") {
    return ["rezerva vizionare tehnica", "cere extras CF actualizat", "pregateste oferta cu termen de raspuns 48h"]
  }
  if (verdict === "negociaza") {
    return [
      `deschide negocierea cu discount de EUR ${Math.round(negotiationRoom).toLocaleString("ro-RO")}`,
      annualCashflow < 0 ? "cere scenariu de chirie mai conservator" : "conditioneaza oferta de verificarea documentelor",
      "valideaza costurile de renovare inainte de avans",
    ]
  }
  return ["asteapta o corectie de pret", "monitorizeaza zone alternative", "revino cand cashflow-ul sau riscul se imbunatateste"]
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
