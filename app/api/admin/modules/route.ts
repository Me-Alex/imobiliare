import { getAdminClient, getAdminRpcSecret, isAdminRequest, jsonError, unauthorized } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

const upsertRpc = {
  payment_plans: "admin_upsert_payment_plan",
  projects: "admin_upsert_project",
  team_users: "admin_upsert_team_user",
} as const

const deleteRpc = {
  payment_plans: { fn: "admin_delete_payment_plan", idKey: "plan_id" },
  projects: { fn: "admin_delete_project", idKey: "project_id" },
  team_users: { fn: "admin_delete_team_user", idKey: "user_id" },
} as const

type ModuleType = keyof typeof upsertRpc

function isModuleType(type: string): type is ModuleType {
  return type in upsertRpc
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

  try {
    const { data, error } = await getAdminClient().rpc("admin_list_modules", {
      admin_secret: getAdminRpcSecret(),
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json(data || {})
  } catch (error: any) {
    return jsonError(error.message || "Admin modules request failed")
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

  try {
    const body = await request.json()

    if (body.type === "settings") {
      const { data, error } = await getAdminClient().rpc("admin_update_settings", {
        admin_secret: getAdminRpcSecret(),
        payload: body.payload || {},
      })

      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ settings: data })
    }

    const type = String(body.type || "")
    if (!isModuleType(type)) return jsonError("Tip de modul invalid", 400)

    const { data, error } = await getAdminClient().rpc(upsertRpc[type], {
      admin_secret: getAdminRpcSecret(),
      payload: body.payload || {},
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ type, item: data })
  } catch (error: any) {
    return jsonError(error.message || "Admin module save failed")
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type") || ""
    const id = url.searchParams.get("id") || ""

    if (!id || !(type in deleteRpc)) return jsonError("Parametri invalidi", 400)

    const config = deleteRpc[type as keyof typeof deleteRpc]
    const { data, error } = await getAdminClient().rpc(config.fn, {
      admin_secret: getAdminRpcSecret(),
      [config.idKey]: id,
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ deleted: Boolean(data), type, id })
  } catch (error: any) {
    return jsonError(error.message || "Admin module delete failed")
  }
}
