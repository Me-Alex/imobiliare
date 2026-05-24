import { NextResponse } from "next/server"
import { buildViewingSlots } from "@/lib/complexity"
import { supabase } from "@/lib/supabase"




export async function GET(request: Request) {
  const url = new URL(request.url)
  const urgency = url.searchParams.get("urgency") || "normal"
  const propertyId = url.searchParams.get("property_id")
  const now = new Date().toISOString()
  const query = supabase
    .from("appointment_slots")
    .select("*, property:properties(title,slug,city)")
    .eq("status", "AVAILABLE")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(30)

  const { data, error } = propertyId ? await query.eq("property_id", propertyId) : await query
  const live = !error && Boolean(data?.length)

  if (live) {
    const slots = (data || []).map((slot: any) => ({
      id: slot.id,
      label: new Date(slot.starts_at).toLocaleString("ro-RO"),
      value: slot.starts_at,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      agent_email: slot.agent_email,
      property: slot.property,
    }))
    return NextResponse.json({ slots, suggestedSlots: [], live })
  }

  // When there are no live slots, do not return synthetic slots as "available".
  // Instead, return suggestions separately so the UI can label them correctly.
  const suggestedSlots = buildViewingSlots(["rapid", "normal", "flexibil"].includes(urgency) ? (urgency as any) : "normal")
    .map((slot) => ({ value: slot.iso, label: slot.label, score: slot.score }))

  return NextResponse.json({ slots: [], suggestedSlots, live: false })
}
