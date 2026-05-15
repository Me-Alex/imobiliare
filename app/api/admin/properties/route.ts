import { getAdminClient, getAdminRpcSecret, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"





export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const payload = await request.json()
    const { data, error } = await getAdminClient().rpc("admin_create_property", {
      admin_secret: getAdminRpcSecret(),
      payload,
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ property: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Property create failed")
  }
}
