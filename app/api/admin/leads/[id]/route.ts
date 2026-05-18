import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

const STATUSES = new Set(["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"])

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermissionAsync(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const status = String(body.status || "")
    if (!STATUSES.has(status)) return jsonError("Status invalid", 400)

    const { data, error } = await auth.supabase.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", params.id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await auth.supabase.from("lead_history").insert({ lead_id: params.id, status, score: body.score || 50, assigned_to: body.assigned_to || auth.session.actor, note: body.note || "Status actualizat din admin", next_follow_up: body.next_follow_up || null })
    return NextResponse.json({ lead: data })
  } catch (error: any) {
    return jsonError(error.message || "Lead update failed")
  }
}
