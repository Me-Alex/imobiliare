import { getAdminClient, getAdminRpcSecret, hasAdminPermission, jsonError, requireAdminPermission } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"



export async function GET(request: Request) {
  const auth = requireAdminPermission(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const supabase = getAdminClient()
    const admin_secret = getAdminRpcSecret()

    const [leads, properties, appointments, audit] = await Promise.all([
      supabase.rpc("admin_list_leads", { admin_secret }),
      supabase.rpc("admin_list_properties", { admin_secret }),
      supabase.rpc("admin_list_appointments", { admin_secret }),
      supabase.rpc("admin_list_audit_log", { admin_secret }),
    ])

    if (leads.error) return jsonError(leads.error.message)
    if (properties.error) return jsonError(properties.error.message)
    if (appointments.error) return jsonError(appointments.error.message)
    if (audit.error) return jsonError(audit.error.message)

    return NextResponse.json({
      leads: hasAdminPermission(auth.session, "leads") ? leads.data || [] : [],
      properties: hasAdminPermission(auth.session, "reports") ? properties.data || [] : [],
      appointments: hasAdminPermission(auth.session, "appointments") ? appointments.data || [] : [],
      audit: hasAdminPermission(auth.session, "audit") ? audit.data || [] : [],
      _admin: auth.session,
    })
  } catch (error: any) {
    return jsonError(error.message || "Admin data request failed")
  }
}
