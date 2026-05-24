import { favoriteRequestSchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { PUBLIC_PROPERTY_SELECT } from "@/lib/supabase"
import { NextResponse } from "next/server"


export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { data, error } = await session.supabase
    .from("client_favorites")
    .select(`*, property:properties(${PUBLIC_PROPERTY_SELECT})`)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ favorites: data || [] })
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "client-favorites", 40, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const parsed = await parseJsonBody(request, favoriteRequestSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data

  const { data, error } = await session.supabase
    .from("client_favorites")
    .upsert({ user_id: session.user.id, property_id: body.property_id, source: "portal", notes: body.notes || null }, { onConflict: "user_id,property_id" })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await session.supabase.from("client_activity").insert({
    user_id: session.user.id,
    type: "FAVORITE_SAVED",
    title: "Proprietate salvata",
    description: "Clientul a salvat o proprietate in lista scurta.",
    metadata: { property_id: body.property_id },
  })
  return NextResponse.json({ favorite: data })
}

export async function DELETE(request: Request) {
  const limited = await rateLimit(request, "client-favorites-delete", 40, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const url = new URL(request.url)
  const propertyId = url.searchParams.get("property_id")?.trim()
  if (!propertyId) return NextResponse.json({ error: "property_id lipseste" }, { status: 400 })

  const { error } = await session.supabase
    .from("client_favorites")
    .delete()
    .eq("user_id", session.user.id)
    .eq("property_id", propertyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ deleted: true })
}
