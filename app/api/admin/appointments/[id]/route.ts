import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"


type RouteContext = { params: Promise<{ id: string }> }
const ALLOWED_STATUSES = new Set(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"])

function pickAppointmentUpdate(payload: Record<string, unknown>) {
  const update: Record<string, unknown> = {}
  if (typeof payload.status === "string") {
    const status = payload.status.trim().toUpperCase()
    if (!ALLOWED_STATUSES.has(status)) throw new Error("Status programare invalid.")
    update.status = status
    if (status === "CONFIRMED") update.confirmed_at = new Date().toISOString()
  }
  if (typeof payload.notes === "string") update.notes = payload.notes.trim().slice(0, 2000)
  if (typeof payload.agent_email === "string") update.agent_email = payload.agent_email.trim().toLowerCase().slice(0, 254)
  for (const field of ["requested_at", "start_at", "end_at"] as const) {
    if (typeof payload[field] === "string" && payload[field]) {
      const date = new Date(payload[field])
      if (Number.isNaN(date.getTime())) throw new Error(`${field} invalid.`)
      update[field] = date.toISOString()
    }
  }
  if (typeof payload.slot_id === "string") update.slot_id = payload.slot_id
  if (!Object.keys(update).length) throw new Error("Nu exista campuri valide pentru actualizare.")
  update.updated_at = new Date().toISOString()
  return update
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminPermissionAsync(request, "appointments")
  if ("error" in auth) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const update = pickAppointmentUpdate(payload)
    const { data, error } = await auth.supabase.from("appointments").update(update).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    if (data.slot_id) await auth.supabase.from("appointment_slots").update({ status: ["CANCELLED", "REJECTED"].includes(data.status) ? "AVAILABLE" : "BOOKED", updated_at: new Date().toISOString() }).eq("id", data.slot_id)
    await auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "APPOINTMENT_UPDATED", entity: "appointments", entity_id: data.id, details: data, metadata: data })
    return NextResponse.json({ appointment: data })
  } catch (error: any) {
    return jsonError(error.message || "Appointment update failed", 400)
  }
}
