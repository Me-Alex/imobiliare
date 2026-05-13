import { getAdminClient, getAdminRpcSecret, hasAdminPermission, jsonError, requireAdminPermission } from "@/lib/admin-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"




export async function GET(request: Request) {
  const auth = requireAdminPermission(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const { data, error } = await getAdminClient().rpc("admin_list_platform", {
      admin_secret: getAdminRpcSecret(),
    })

    if (error) return jsonError(error.message, 400)
    const payload = filterPlatformData(data || {}, auth.session)
    return NextResponse.json(payload)
  } catch (error: any) {
    return jsonError(error.message || "Admin platform request failed")
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "admin-platform", 90, 60_000)
  if (limited) return limited

  try {
    const body = await request.json().catch(() => ({}))
    const permission = permissionForAction(String(body.type || ""))
    const auth = requireAdminPermission(request, permission)
    if ("error" in auth) return auth.error

    const supabase = getAdminClient()
    const admin_secret = getAdminRpcSecret()
    const actor = auth.session.actor

    if (body.type === "lead") {
      const { data, error } = await supabase.rpc("admin_mutate_lead", {
        admin_secret,
        actor_name: actor,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ lead: data })
    }

    if (body.type === "client_profile") {
      const { data, error } = await supabase.rpc("admin_mutate_client_profile", {
        admin_secret,
        actor_name: actor,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ client: data })
    }

    if (body.type === "appointment") {
      const { data, error } = await supabase.rpc("admin_mutate_appointment", {
        admin_secret,
        actor_name: actor,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ appointment: data })
    }

    if (body.type === "appointment_slot") {
      const { data, error } = await supabase.rpc("admin_mutate_appointment_slot", {
        admin_secret,
        actor_name: actor,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ slot: data })
    }

    if (body.type === "offer_status") {
      const { data, error } = await supabase.rpc("admin_mutate_offer", {
        admin_secret,
        actor_name: actor,
        payload: { ...(body.payload || {}), id: body.id, status: body.status, counter_offer: body.counter_offer },
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ offer: data })
    }

    if (body.type === "cms") {
      const { data, error } = await supabase.rpc("admin_upsert_cms_entry", {
        admin_secret,
        payload: { ...(body.payload || {}), updated_by: actor },
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ entry: data })
    }

    if (body.type === "admin_role") {
      const { data, error } = await supabase.rpc("admin_upsert_role", {
        admin_secret,
        payload: { ...(body.payload || {}), actor },
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ role: data })
    }

    if (body.type === "zone_poi") {
      const { data, error } = await supabase.rpc("admin_mutate_zone_poi", {
        admin_secret,
        actor_name: actor,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ poi: data })
    }

    if (body.type === "document_status") {
      const { data, error } = await supabase.rpc("admin_review_client_document", {
        admin_secret,
        actor_name: actor,
        payload: { ...(body.payload || {}), id: body.id, status: body.status || body.payload?.status || "REVIEW" },
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ document: data })
    }

    if (body.type === "client_notification") {
      const { data, error } = await supabase.rpc("admin_queue_notification", {
        admin_secret,
        actor_name: actor,
        payload: body.payload || {},
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ notification: data })
    }

    if (body.type === "audit_event") {
      const { data, error } = await supabase.rpc("admin_log_audit_event", {
        admin_secret,
        payload: { ...(body.payload || {}), actor },
      })
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ audit: data })
    }

    return jsonError("Tip actiune invalid", 400)
  } catch (error: any) {
    return jsonError(error.message || "Admin platform save failed")
  }
}

function permissionForAction(type: string) {
  const map: Record<string, string> = {
    lead: "leads",
    client_profile: "clients",
    appointment: "appointments",
    appointment_slot: "slots",
    offer_status: "offers",
    cms: "cms",
    admin_role: "roles",
    zone_poi: "zones",
    document_status: "documents",
    client_notification: "notifications",
    audit_event: "audit",
  }
  return map[type] || "reports"
}

function filterPlatformData(data: Record<string, any>, session: { role: string; actor: string; permissions: string[] }) {
  const next: Record<string, any> = { ...data, _admin: session }
  if (!hasAdminPermission(session as any, "clients")) next.client_profiles = []
  if (!hasAdminPermission(session as any, "documents")) next.client_documents = []
  if (!hasAdminPermission(session as any, "offers")) next.property_offers = []
  if (!hasAdminPermission(session as any, "cms")) next.cms_entries = []
  if (!hasAdminPermission(session as any, "zones")) next.zone_poi = []
  if (!hasAdminPermission(session as any, "roles")) next.admin_roles = []
  if (!hasAdminPermission(session as any, "audit")) next.admin_audit_log = []
  if (!hasAdminPermission(session as any, "notifications")) {
    next.client_notifications = []
    next.admin_notification_outbox = []
  }
  return next
}
