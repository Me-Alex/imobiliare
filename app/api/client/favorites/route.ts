import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"


export const runtime = "edge"

export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { data, error } = await session.supabase
    .from("client_favorites")
    .select("*, property:properties(*)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ favorites: data || [] })
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "client-favorites", 40, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const body = await request.json().catch(() => ({}))
  const propertyId = String(body.property_id || "")
  if (!propertyId) return NextResponse.json({ error: "property_id lipseste" }, { status: 400 })

  const { data, error } = await session.supabase
    .from("client_favorites")
    .upsert({ user_id: session.user.id, property_id: propertyId, source: "portal", notes: body.notes || null }, { onConflict: "user_id,property_id" })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await session.supabase.from("client_activity").insert({
    user_id: session.user.id,
    type: "FAVORITE_SAVED",
    title: "Proprietate salvata",
    description: "Clientul a salvat o proprietate in lista scurta.",
    metadata: { property_id: propertyId },
  })
  return NextResponse.json({ favorite: data })
}

export async function DELETE(request: Request) {
  const limited = rateLimit(request, "client-favorites-delete", 40, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const url = new URL(request.url)
  const propertyId = url.searchParams.get("property_id")
  if (!propertyId) return NextResponse.json({ error: "property_id lipseste" }, { status: 400 })

  const { error } = await session.supabase
    .from("client_favorites")
    .delete()
    .eq("user_id", session.user.id)
    .eq("property_id", propertyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ deleted: true })
}
