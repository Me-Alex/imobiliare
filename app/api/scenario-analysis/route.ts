import { buildScenarioAnalysis } from "@/lib/complexity"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

const competitionLevels = ["scazut", "mediu", "ridicat"] as const

export async function POST(request: Request) {
  const limited = rateLimit(request, "scenario-analysis", 20, 60_000)
  if (limited) return limited

  try {
    const body = await request.json().catch(() => ({}))
    const competitionLevel = competitionLevels.includes(body.competitionLevel)
      ? body.competitionLevel
      : "mediu"

    const scenario = buildScenarioAnalysis({
      propertyPrice: Number(body.propertyPrice || 250000),
      area: Number(body.area || 75),
      zone: String(body.zone || "Bucuresti Nord").trim().slice(0, 80),
      monthlyRent: Number(body.monthlyRent || 1200),
      advancePercent: Number(body.advancePercent || 20),
      interestRate: Number(body.interestRate || 6.2),
      years: Number(body.years || 25),
      renovationBudget: Number(body.renovationBudget || 0),
      holdingYears: Number(body.holdingYears || 5),
      riskTolerance: Number(body.riskTolerance || 3),
      competitionLevel,
    })

    return NextResponse.json({ scenario })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Scenario analysis failed" }, { status: 500 })
  }
}
