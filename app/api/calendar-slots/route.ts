import { NextResponse } from "next/server"
import { buildViewingSlots } from "@/lib/complexity"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"



export async function GET(request: Request) {
  const url = new URL(request.url)
  const urgency = url.searchParams.get("urgency") || "normal"
  const propertyId = url.searchParams.get("property_id")
  const allowFallback = ["1", "true", "yes"].includes(String(url.searchParams.get("fallback") || "").toLowerCase())
  const now = new Date().toISOString()
  const query = supabase
    .from("appointment_slots")
    .select("*, property:properties(title,slug,city)")
    .eq("status", "AVAILABLE")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(30)

  const { data, error } = propertyId ? await query.eq("property_id", propertyId) : await query
  if (error && !allowFallback) {
    return NextResponse.json({ slots: [], live: false, error: error.message }, { status: 400 })
  }

  const liveSlots = data && data.length > 0
    ? data.map((slot: any) => ({
        id: slot.id,
        label: new Date(slot.starts_at).toLocaleString("ro-RO"),
        value: slot.starts_at,
        starts_at: slot.starts_at,
        ends_at: slot.ends_at,
        agent_email: slot.agent_email,
        property: slot.property,
      }))
    : []
  const fallbackSlots = allowFallback && !liveSlots.length
    ? buildViewingSlots(["rapid", "normal", "flexibil"].includes(urgency) ? urgency as any : "normal")
    : []

  return NextResponse.json({ slots: liveSlots.length ? liveSlots : fallbackSlots, live: liveSlots.length > 0, fallback: Boolean(fallbackSlots.length) })
}
