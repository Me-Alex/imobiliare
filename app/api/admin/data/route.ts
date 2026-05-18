import { hasAdminPermission, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { listAdminCore } from "@/lib/admin-data"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const core = await listAdminCore()
    return NextResponse.json({
      leads: hasAdminPermission(auth.session, "leads") ? core.leads : [],
      properties: hasAdminPermission(auth.session, "properties") || hasAdminPermission(auth.session, "reports") ? core.properties : [],
      appointments: hasAdminPermission(auth.session, "appointments") ? core.appointments : [],
      audit: hasAdminPermission(auth.session, "audit") ? core.audit : [],
      _admin: auth.session,
    })
  } catch (error: any) {
    return jsonError(error.message || "Admin data request failed")
  }
}
