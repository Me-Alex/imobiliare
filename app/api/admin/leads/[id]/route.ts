import { getAdminClient, getAdminRpcSecret, isAdminRequest, jsonError, unauthorized } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

const STATUSES = new Set(["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"])

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request)) return unauthorized()

  try {
    const body = await request.json()
    const status = String(body.status || "")
    if (!STATUSES.has(status)) return jsonError("Status invalid", 400)

    const { data, error } = await getAdminClient().rpc("admin_update_lead_status", {
      admin_secret: getAdminRpcSecret(),
      lead_id: params.id,
      next_status: status,
    })

    if (error) return jsonError(error.message)
    return NextResponse.json({ lead: data })
  } catch (error: any) {
    return jsonError(error.message || "Lead update failed")
  }
}
