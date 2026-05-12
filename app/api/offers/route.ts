import { NextResponse } from "next/server"
import { buildOfferDraft } from "@/lib/complexity"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const draft = buildOfferDraft({
      propertyTitle: String(body.propertyTitle || "Proprietate HQS"),
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
