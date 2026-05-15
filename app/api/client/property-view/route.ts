import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  const limited = rateLimit(request, "client-property-view", 60, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  try {
    const body = await request.json().catch(() => ({}))
    const propertyId = String(body.property_id || "")
    if (!propertyId) return NextResponse.json({ error: "property_id lipseste" }, { status: 400 })

    const metadata = {
      property_id: propertyId,
      property_slug: body.property_slug ? String(body.property_slug) : null,
      property_title: body.property_title ? String(body.property_title) : null,
      property_city: body.property_city ? String(body.property_city) : null,
      price: Number(body.price || 0),
      rooms: Number(body.rooms || 0),
      source: String(body.source || "property_page"),
    }

    const { data, error } = await session.supabase
      .from("client_activity")
      .insert({
        user_id: session.user.id,
        type: "PROPERTY_VIEWED",
        title: metadata.property_title || "Proprietate vizualizata",
        description: metadata.property_city ? `Clientul a vizualizat o proprietate in ${metadata.property_city}.` : "Clientul a vizualizat o proprietate.",
        metadata,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ activity: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Property view tracking failed" }, { status: 500 })
  }
}
