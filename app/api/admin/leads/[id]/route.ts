import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"


const STATUSES = new Set(["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"])

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminPermissionAsync(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const status = String(body.status || "")
    if (!STATUSES.has(status)) return jsonError("Status invalid", 400)

    const { data, error } = await auth.supabase.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await auth.supabase.from("lead_history").insert({ lead_id: id, status, score: body.score || 50, assigned_to: body.assigned_to || auth.session.actor, note: body.note || "Status actualizat din admin", next_follow_up: body.next_follow_up || null })
    return NextResponse.json({ lead: data })
  } catch (error: any) {
    return jsonError(error.message || "Lead update failed")
  }
}
