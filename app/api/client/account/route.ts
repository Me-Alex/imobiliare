import { clientAccountSchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { supabase, user } = session
  const { data: profile, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: { id: user.id, email: user.email }, profile })
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "client-account", 20, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { supabase, user } = session
  const parsed = await parseJsonBody(request, clientAccountSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data
  const preferredZones = Array.isArray(body.preferred_zones)
    ? body.preferred_zones.map(String)
    : String(body.preferred_zones || "").split(",").map((x) => x.trim()).filter(Boolean)

  const payload = {
    user_id: user.id,
    email: user.email,
    full_name: body.full_name || body.name || user.email || "Client HQS",
    phone: body.phone || null,
    budget: body.budget,
    preferred_zones: preferredZones,
    rooms: body.rooms,
    purpose: body.purpose,
    financing_status: body.financing_status,
  }

  const { data, error } = await supabase
    .from("client_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await supabase.from("client_activity").insert({
    user_id: user.id,
    type: "PROFILE_UPDATED",
    title: "Profil actualizat",
    description: "Clientul a actualizat bugetul, zonele sau datele de contact.",
    metadata: { budget: payload.budget, preferred_zones: payload.preferred_zones, rooms: payload.rooms, purpose: payload.purpose },
  })
  return NextResponse.json({ profile: data })
}
