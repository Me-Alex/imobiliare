import { getAdminClient, getAdminRpcSecret, isAdminRequest, jsonError, unauthorized } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"


export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

  try {
    const { data, error } = await getAdminClient().rpc("admin_list_platform", {
      admin_secret: getAdminRpcSecret(),
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json(data || {})
  } catch (error: any) {
    return jsonError(error.message || "Admin platform request failed")
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

  try {
    const body = await request.json().catch(() => ({}))
    const supabase = getAdminClient()
    const admin_secret = getAdminRpcSecret()

    if (body.type === "offer_status") {
      const { data, error } = await supabase.rpc("admin_update_offer_status", {
        admin_secret,
        offer_id: body.id,
        next_status: body.status || "NEGOTIATION",
        counter: body.counter_offer || null,
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ offer: data })
    }

    if (body.type === "cms") {
      const { data, error } = await supabase.rpc("admin_upsert_cms_entry", {
        admin_secret,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ entry: data })
    }

    if (body.type === "admin_role") {
      const { data, error } = await supabase.rpc("admin_upsert_role", {
        admin_secret,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ role: data })
    }

    if (body.type === "zone_poi") {
      const { data, error } = await supabase.rpc("admin_upsert_zone_poi", {
        admin_secret,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ poi: data })
    }

    if (body.type === "document_status") {
      const { data, error } = await supabase.rpc("admin_update_client_document_status", {
        admin_secret,
        document_id: body.id,
        next_status: body.status || "REVIEW",
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ document: data })
    }

    if (body.type === "client_notification") {
      const { data, error } = await supabase.rpc("admin_add_client_notification", {
        admin_secret,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ notification: data })
    }

    if (body.type === "audit_event") {
      const { data, error } = await supabase.rpc("admin_log_audit_event", {
        admin_secret,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ audit: data })
    }

    return jsonError("Tip actiune invalid", 400)
  } catch (error: any) {
    return jsonError(error.message || "Admin platform save failed")
  }
}
