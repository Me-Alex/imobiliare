import { getAdminClient, getAdminRpcSecret, isAdminRequest, jsonError, unauthorized } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

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
      leads: leads.data || [],
      properties: properties.data || [],
      appointments: appointments.data || [],
      audit: audit.data || [],
    })
  } catch (error: any) {
    return jsonError(error.message || "Admin data request failed")
  }
}
