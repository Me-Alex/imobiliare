import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"


type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminPermissionAsync(request, "appointments")
  if ("error" in auth) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const { data, error } = await auth.supabase.from("appointments").update({ ...payload, updated_at: new Date().toISOString(), confirmed_at: payload.status === "CONFIRMED" ? new Date().toISOString() : payload.confirmed_at }).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    if (data.slot_id) await auth.supabase.from("appointment_slots").update({ status: ["CANCELLED", "REJECTED"].includes(data.status) ? "AVAILABLE" : "BOOKED", updated_at: new Date().toISOString() }).eq("id", data.slot_id)
    await auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "APPOINTMENT_UPDATED", entity: "appointments", entity_id: data.id, details: data, metadata: data })
    return NextResponse.json({ appointment: data })
  } catch (error: any) {
    return jsonError(error.message || "Appointment update failed", 400)
  }
}
