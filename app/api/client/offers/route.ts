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
  const limited = rateLimit(request, "client-offers", 12, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const body = await request.json().catch(() => ({}))
  const draft = buildOfferDraft({
    propertyTitle: String(body.property_title || "Proprietate HQS"),
    listPrice: Number(body.list_price || 0),
    clientBudget: Number(body.offer_price || body.client_budget || body.list_price || 0),
    advancePercent: Number(body.advance_percent || 20),
    closingDays: Number(body.closing_days || 30),
    riskLevel: ["scazut", "mediu", "ridicat"].includes(body.risk_level) ? body.risk_level : "mediu",
  })

  const { data, error } = await session.supabase
    .from("property_offers")
    .insert({
      user_id: session.user.id,
      client_user_id: session.user.id,
      property_id: body.property_id || null,
      property_title: String(body.property_title || draft.propertyTitle),
      client_name: String(body.client_name || session.user.email || "Client HQS"),
      client_email: session.user.email,
      list_price: Number(body.list_price || draft.recommended),
      offer_price: Number(body.offer_price || draft.recommended),
      advance_percent: Number(body.advance_percent || 20),
      closing_days: Number(body.closing_days || 30),
      risk_level: String(body.risk_level || "mediu"),
      notes: body.notes ? String(body.notes) : draft.clauses.join("; "),
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await session.supabase.from("client_activity").insert({
    user_id: session.user.id,
    type: "OFFER_SUBMITTED",
    title: "Oferta trimisa",
    description: String(body.property_title || draft.propertyTitle),
    metadata: { offer_id: data.id, offer_price: data.offer_price, status: data.status },
  }).throwOnError()
  return NextResponse.json({ offer: data, draft })
}
