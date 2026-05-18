import { getAdminClient, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { estimateLeadScore } from "@/lib/experience"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const score = Number(body.score || estimateLeadScore({ budget: body.budget, urgency: body.urgency, message: body.note, phone: body.phone }))
    const nextFollowUp = new Date()
    nextFollowUp.setDate(nextFollowUp.getDate() + (body.urgency === "rapid" ? 1 : 3))

    const payload = {
      lead_id: body.lead_id || null,
      status: String(body.status || "FOLLOW_UP"),
      score,
      assigned_to: String(body.assigned_to || auth.session.actor),
      note: String(body.note || "Follow-up automat generat din CRM."),
      next_follow_up: body.next_follow_up || nextFollowUp.toISOString(),
    }
    const { data, error } = await getAdminClient().from("lead_history").insert(payload).select("*").single()
    if (error) return jsonError(error.message, 400)
    if (body.lead_id) await getAdminClient().from("leads").update({ status: body.status || "CONTACTED", updated_at: new Date().toISOString() }).eq("id", body.lead_id)
    return NextResponse.json({ history: data })
  } catch (error: any) {
    return jsonError(error.message || "CRM request failed")
  }
}
