import { getAdminClient, getAdminRpcSecret, jsonError, requireAdminPermission } from "@/lib/admin-api"
import { buildExecutiveReport } from "@/lib/platform-reports"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const limited = rateLimit(request, "admin-reports", 60, 60_000)
  if (limited) return limited

  const auth = requireAdminPermission(request, "reports")
  if ("error" in auth) return auth.error

  try {
    const supabase = getAdminClient()
    const admin_secret = getAdminRpcSecret()

    const [platform, modules, leads, properties, appointments] = await Promise.all([
      supabase.rpc("admin_list_platform", { admin_secret }),
      supabase.rpc("admin_list_modules", { admin_secret }),
      supabase.rpc("admin_list_leads", { admin_secret }),
      supabase.rpc("admin_list_properties", { admin_secret }),
      supabase.rpc("admin_list_appointments", { admin_secret }),
    ])

    const error = platform.error || modules.error || leads.error || properties.error || appointments.error
    if (error) return jsonError(error.message, 400)

    const report = buildExecutiveReport({
      ...(platform.data || {}),
      ...(modules.data || {}),
      leads: leads.data || [],
      properties: properties.data || [],
      appointments: appointments.data || [],
    })

    return NextResponse.json({ report, _admin: auth.session })
  } catch (error: any) {
    return jsonError(error.message || "Admin report request failed")
  }
}
