import { getAdminClient, getAdminRpcSecret, jsonError, requireAdminPermission } from "@/lib/admin-api"
import { NextResponse } from "next/server"


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminPermission(request, "appointments")
  if ("error" in auth) return auth.error

  try {
    const payload = await request.json()
    const { data, error } = await getAdminClient().rpc("admin_mutate_appointment", {
      admin_secret: getAdminRpcSecret(),
      actor_name: auth.session.actor,
      payload: { ...payload, id: params.id },
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ appointment: data })
  } catch (error: any) {
    return jsonError(error.message || "Appointment update failed", 400)
  }
}
