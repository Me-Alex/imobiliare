import { requireClient } from "@/lib/client-api"
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
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { supabase, user } = session
  const body = await request.json().catch(() => ({}))
  const payload = {
    user_id: user.id,
    email: user.email,
    full_name: String(body.full_name || body.name || user.email || "Client HQS"),
    phone: body.phone ? String(body.phone) : null,
    budget: Number(body.budget || 250000),
    preferred_zones: Array.isArray(body.preferred_zones) ? body.preferred_zones.map(String) : String(body.preferred_zones || "").split(",").map((x) => x.trim()).filter(Boolean),
    rooms: Number(body.rooms || 2),
    purpose: String(body.purpose || "locuire"),
    financing_status: String(body.financing_status || "neconfirmat"),
  }

  const { data, error } = await supabase
    .from("client_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ profile: data })
}
