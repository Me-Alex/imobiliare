import { getAdminClient } from "@/lib/admin-api"
import { normalizeAppointmentPayload } from "@/lib/admin-appointments"
import { clientAppointmentRequestSchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  try {
    const email = String(session.user.email || "").toLowerCase()
    const { data, error } = await getAdminClient()
      .from("appointments")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ appointments: Array.isArray(data) ? data : [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Client appointments request failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "client-appointments", 8, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  try {
    const parsed = await parseJsonBody(request, clientAppointmentRequestSchema)
    if ("error" in parsed) return parsed.error
    const body = parsed.data

    const profile = await session.supabase
      .from("client_profiles")
      .select("full_name, phone")
      .eq("user_id", session.user.id)
      .maybeSingle()

    const payload = normalizeAppointmentPayload({
      ...body,
      client_name: profile.data?.full_name || session.user.email || "Client HQS",
      client_email: session.user.email,
      client_phone: profile.data?.phone || null,
      notes: body.notes || "Programare trimisa din portalul clientului.",
    })

    const supabase = getAdminClient()
    const { data, error } = await supabase.from("appointments").insert(payload).select("*").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (data.slot_id) await supabase.from("appointment_slots").update({ status: "BOOKED", updated_at: new Date().toISOString() }).eq("id", data.slot_id)
    await session.supabase.from("client_activity").insert({
      user_id: session.user.id,
      type: "APPOINTMENT_REQUESTED",
      title: "Programare solicitata",
      description: "Clientul a solicitat o vizionare din portal.",
      metadata: { appointment: data, property_id: payload.property_id, slot_id: payload.slot_id },
    })

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Client appointment save failed" }, { status: 500 })
  }
}
