import { NextResponse } from "next/server"
import { offerDraftSchema, parseJsonBody } from "@/lib/api-validation"
import { buildOfferDraft } from "@/lib/complexity"
import { rateLimit } from "@/lib/rate-limit"

export const runtime = "edge"

export async function POST(request: Request) {
  const limited = rateLimit(request, "offer-draft", 20, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, offerDraftSchema)
    if ("error" in parsed) return parsed.error
    const body = parsed.data

    const draft = buildOfferDraft({
      propertyTitle: body.propertyTitle,
      listPrice: body.listPrice,
      clientBudget: body.clientBudget || body.listPrice,
      advancePercent: body.advancePercent,
      closingDays: body.closingDays,
      riskLevel: body.riskLevel,
    })

    return NextResponse.json({ draft })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Offer request failed" }, { status: 500 })
  }
}
