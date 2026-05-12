import { getAdminClient, getAdminRpcSecret, isAdminRequest, jsonError, unauthorized } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request)) return unauthorized()

  try {
    const payload = await request.json()
    const { data, error } = await getAdminClient().rpc("admin_update_appointment_status", {
      admin_secret: getAdminRpcSecret(),
      appointment_id: params.id,
      next_status: payload.status,
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ appointment: data })
  } catch (error: any) {
    return jsonError(error.message || "Appointment update failed", 400)
  }
}
