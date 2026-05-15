import { getAdminClient, getAdminRpcSecret, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"




const STATUSES = new Set(["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"])

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermissionAsync(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const status = String(body.status || "")
    if (!STATUSES.has(status)) return jsonError("Status invalid", 400)

    const { data, error } = await getAdminClient().rpc("admin_mutate_lead", {
      admin_secret: getAdminRpcSecret(),
      actor_name: auth.session.actor,
      payload: { id: params.id, status, note: body.note || "Status actualizat din admin" },
    })

    if (error) return jsonError(error.message)
    return NextResponse.json({ lead: data })
  } catch (error: any) {
    return jsonError(error.message || "Lead update failed")
  }
}
