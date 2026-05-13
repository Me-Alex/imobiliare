import { getAdminClient, getAdminRpcSecret, jsonError, requireAdminPermission } from "@/lib/admin-api"
import { NextResponse } from "next/server"


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminPermission(request, "reports")
  if ("error" in auth) return auth.error

  try {
    const payload = await request.json()
    const { data, error } = await getAdminClient().rpc("admin_update_property", {
      admin_secret: getAdminRpcSecret(),
      property_id: params.id,
      payload,
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ property: data })
  } catch (error: any) {
    return jsonError(error.message || "Property update failed")
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminPermission(request, "reports")
  if ("error" in auth) return auth.error

  try {
    const { error } = await getAdminClient().rpc("admin_delete_property", {
      admin_secret: getAdminRpcSecret(),
      property_id: params.id,
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return jsonError(error.message || "Property delete failed")
  }
}
