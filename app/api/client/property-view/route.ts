import { parseJsonBody, propertyViewSchema } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const limited = rateLimit(request, "client-property-view", 60, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  try {
    const parsed = await parseJsonBody(request, propertyViewSchema)
    if ("error" in parsed) return parsed.error
    const body = parsed.data

    const metadata = {
      property_id: body.property_id,
      property_slug: body.property_slug,
      property_title: body.property_title,
      property_city: body.property_city,
      price: body.price,
      rooms: body.rooms,
      source: body.source,
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
