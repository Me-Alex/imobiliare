import { jsonError } from "@/lib/admin-api"
import { appointmentRequestCompatSchema, parseJsonBody } from "@/lib/api-validation"
import { rateLimit } from "@/lib/rate-limit"
import { supabase as publicSupabase } from "@/lib/supabase"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  const limited = await rateLimit(request, "appointments", 8, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, appointmentRequestCompatSchema)
    if ("error" in parsed) return parsed.error

    // Atomic booking is handled inside the RPC (including slot availability and outbox/audit).
    const { data, error } = await publicSupabase.rpc("book_appointment_slot", {
      payload: parsed.data,
      p_client_user_id: null,
      p_actor: "public",
    })
    if (error) return jsonError(error.message, 400)

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Appointment request failed", 400)
  }
}
