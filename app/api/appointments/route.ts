import { getAdminClient, getEnv, jsonError } from "@/lib/admin-api"
import { normalizeAppointmentPayload } from "@/lib/admin-appointments"
import { appointmentRequestSchema, parseJsonBody } from "@/lib/api-validation"
import { rateLimit } from "@/lib/rate-limit"
import { supabase as publicSupabase } from "@/lib/supabase"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  const limited = await rateLimit(request, "appointments", 8, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, appointmentRequestSchema)
    if ("error" in parsed) return parsed.error

    const payload = normalizeAppointmentPayload(parsed.data)

    if (!getEnv("SUPABASE_SERVICE_ROLE_KEY")) {
      const { error } = await publicSupabase.from("appointments").insert(payload)
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ appointment: { status: payload.status, requested_at: payload.requested_at } }, { status: 201 })
    }

    const supabase = getAdminClient()
    const { data, error } = await supabase.from("appointments").insert(payload).select("*").single()
    if (error) return jsonError(error.message, 400)

    if (data.slot_id) await supabase.from("appointment_slots").update({ status: "BOOKED", updated_at: new Date().toISOString() }).eq("id", data.slot_id)
    await Promise.allSettled([
      supabase.from("admin_notification_outbox").insert({ channel: "EMAIL", target: data.client_email, subject: "Programare HQS primita", body: `Solicitare vizionare pentru ${data.client_name || "client"}.`, status: "QUEUED", entity: "appointments", entity_id: data.id, metadata: data, created_by: "website" }),
      supabase.from("admin_audit_log").insert({ actor: "website", action: "APPOINTMENT_CREATED", entity: "appointments", entity_id: data.id, details: data, metadata: data }),
    ])

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Appointment request failed", 400)
  }
}
