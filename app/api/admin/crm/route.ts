import { getAdminClient, getAdminRpcSecret, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { estimateLeadScore } from "@/lib/experience"
import { NextResponse } from "next/server"





export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const leadId = body.lead_id || null
    const score = Number(body.score || estimateLeadScore({ budget: body.budget, urgency: body.urgency, message: body.note, phone: body.phone }))
    const nextFollowUp = new Date()
    nextFollowUp.setDate(nextFollowUp.getDate() + (body.urgency === "rapid" ? 1 : 3))

    const { data, error } = await getAdminClient()
      .rpc("admin_add_lead_history", {
        admin_secret: getAdminRpcSecret(),
        payload: {
          lead_id: leadId,
          status: String(body.status || "FOLLOW_UP"),
          score,
          assigned_to: String(body.assigned_to || "agent@hqsimobiliare.ro"),
          note: String(body.note || "Follow-up automat generat din CRM."),
          next_follow_up: body.next_follow_up || nextFollowUp.toISOString(),
        },
      })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ history: data })
  } catch (error: any) {
    return jsonError(error.message || "CRM request failed")
  }
}
