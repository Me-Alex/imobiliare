import { NextResponse } from "next/server"
import { buildOfferDraft } from "@/lib/complexity"
import { rateLimit } from "@/lib/rate-limit"


export const runtime = "edge"

export async function POST(request: Request) {
  const limited = rateLimit(request, "offer-draft", 20, 60_000)
  if (limited) return limited

  try {
    const body = await request.json().catch(() => ({}))
    const propertyTitle = String(body.propertyTitle || "").trim().slice(0, 160) || "Proprietate HQS"
    const draft = buildOfferDraft({
      propertyTitle,
      listPrice: Number(body.listPrice || 250000),
      clientBudget: Number(body.clientBudget || body.listPrice || 250000),
      advancePercent: Number(body.advancePercent || 20),
      closingDays: Number(body.closingDays || 30),
      riskLevel: ["scazut", "mediu", "ridicat"].includes(body.riskLevel) ? body.riskLevel : "mediu",
    })

    return NextResponse.json({ draft })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Offer request failed" }, { status: 500 })
  }
}
