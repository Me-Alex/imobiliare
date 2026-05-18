import { clientOfferSchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { buildOfferDraft } from "@/lib/complexity"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"




export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { data, error } = await session.supabase
    .from("property_offers")
    .select("*, property:properties(title,slug,city,price)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ offers: data || [] })
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "client-offers", 12, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const parsed = await parseJsonBody(request, clientOfferSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data
  const draft = buildOfferDraft({
    propertyTitle: body.property_title,
    listPrice: body.list_price,
    clientBudget: body.offer_price || body.client_budget || body.list_price,
    advancePercent: body.advance_percent,
    closingDays: body.closing_days,
    riskLevel: body.risk_level,
  })

  const { data, error } = await session.supabase
    .from("property_offers")
    .insert({
      user_id: session.user.id,
      client_user_id: session.user.id,
      property_id: body.property_id || null,
      property_title: body.property_title || draft.propertyTitle,
      client_name: body.client_name || session.user.email || "Client HQS",
      client_email: session.user.email,
      list_price: body.list_price || draft.recommended,
      offer_price: body.offer_price || draft.recommended,
      advance_percent: body.advance_percent,
      closing_days: body.closing_days,
      risk_level: body.risk_level,
      notes: body.notes || draft.clauses.join("; "),
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await session.supabase.from("client_activity").insert({
    user_id: session.user.id,
    type: "OFFER_SUBMITTED",
    title: "Oferta trimisa",
    description: body.property_title || draft.propertyTitle,
    metadata: { offer_id: data.id, offer_price: data.offer_price, status: data.status },
  })
  return NextResponse.json({ offer: data, draft })
}
