import { hasAdminPermission, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizeAppointmentPayload } from "@/lib/admin-appointments"
import { listAdminPlatform } from "@/lib/admin-data"
import { buildAdminRuntimeHealth } from "@/lib/admin-health"
import { optionalUuid } from "@/lib/admin-properties"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"


type Row = Record<string, any>

export async function GET(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "leads")
  if ("error" in auth) return auth.error

  try {
    const payload = filterPlatformData(await listAdminPlatform(auth.supabase), auth.session)
    payload.runtime_health = buildAdminRuntimeHealth()
    return NextResponse.json({ ...payload, _admin: auth.session })
  } catch (error: any) {
    return jsonError(error.message || "Admin platform request failed")
  }
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "admin-platform", 90, 60_000)
  if (limited) return limited

  try {
    const body = await request.json().catch(() => ({}))
    const permission = permissionForAction(String(body.type || ""))
    const auth = await requireAdminPermissionAsync(request, permission)
    if ("error" in auth) return auth.error

    const supabase = auth.supabase
    const actor = auth.session.actor
    const payload = body.payload || body

    if (body.type === "lead") {
      const id = payload.id || body.id
      const next = { name: payload.name || "Client HQS", email: payload.email || null, phone: payload.phone || payload.email || "contact-necompletat", message: payload.message || null, status: payload.status || "NEW", source: payload.source || "admin", property_id: optionalUuid(payload.property_id), updated_at: new Date().toISOString() }
      const query = id ? supabase.from("leads").update(next).eq("id", id).select("*").single() : supabase.from("leads").insert(next).select("*").single()
      const { data, error } = await query
      if (error) return jsonError(error.message, 400)
      await logAudit(actor, "LEAD_MUTATED", "leads", data.id, data, supabase)
      return NextResponse.json({ lead: data })
    }

    if (body.type === "client_profile") {
      const id = payload.id || body.id
      const next = { full_name: payload.full_name || payload.name || payload.email || "Client HQS", email: payload.email || null, phone: payload.phone || null, budget: number(payload.budget), purpose: payload.purpose || null, financing_status: payload.financing_status || null, status: payload.status || "ACTIVE", updated_at: new Date().toISOString() }
      const query = id ? supabase.from("client_profiles").update(next).eq("id", id).select("*").single() : supabase.from("client_profiles").insert(next).select("*").single()
      const { data, error } = await query
      if (error) return jsonError(error.message, 400)
      await logAudit(actor, "CLIENT_PROFILE_MUTATED", "client_profiles", data.id, data, supabase)
      return NextResponse.json({ client: data })
    }

    if (body.type === "appointment") {
      const result = await upsertAppointment(payload, actor, supabase)
      return NextResponse.json({ appointment: result })
    }

    if (body.type === "appointment_slot") {
      const id = payload.id || body.id
      if (payload.action === "delete" && id) {
        const { data, error } = await supabase.from("appointment_slots").delete().eq("id", id).select("*").maybeSingle()
        if (error) return jsonError(error.message, 400)
        await logAudit(actor, "APPOINTMENT_SLOT_DELETED", "appointment_slots", id, data || { id }, supabase)
        return NextResponse.json({ slot: data || { id, deleted: true } })
      }
      const next = { agent_email: payload.agent_email || null, property_id: optionalUuid(payload.property_id), starts_at: payload.starts_at || new Date(Date.now() + 86400000).toISOString(), ends_at: payload.ends_at || new Date(Date.now() + 90000000).toISOString(), status: payload.status || "AVAILABLE", capacity: number(payload.capacity) || 1, notes: payload.notes || null, updated_at: new Date().toISOString() }
      const query = id ? supabase.from("appointment_slots").update(next).eq("id", id).select("*").single() : supabase.from("appointment_slots").insert(next).select("*").single()
      const { data, error } = await query
      if (error) return jsonError(error.message, 400)
      await logAudit(actor, "APPOINTMENT_SLOT_MUTATED", "appointment_slots", data.id, data, supabase)
      return NextResponse.json({ slot: data })
    }

    if (body.type === "offer_status") {
      const id = payload.id || body.id
      if (!id) return jsonError("Offer id lipseste", 400)
      const next = { status: payload.status || body.status || "NEGOTIATING", counter_offer: number(payload.counter_offer ?? body.counter_offer), notes: payload.notes || null, updated_at: new Date().toISOString() }
      const { data, error } = await supabase.from("property_offers").update(next).eq("id", id).select("*").single()
      if (error) return jsonError(error.message, 400)
      await queueOutbox({ target: data.client_email, subject: "Actualizare oferta HQS", body: `Status oferta: ${data.status}`, entity: "property_offers", entity_id: data.id }, actor, supabase)
      await logAudit(actor, "OFFER_MUTATED", "property_offers", data.id, data, supabase)
      return NextResponse.json({ offer: data })
    }

    if (body.type === "cms") {
      const key = payload.key || payload.slug
      if (!key) return jsonError("CMS key lipseste", 400)
      const content = typeof payload.body === "string" ? { body: payload.body } : payload.content || {}
      const row = { key, title: payload.title || key, section: payload.section || payload.type || "page", status: payload.status || "DRAFT", content, seo: payload.seo || { title: payload.meta_title, description: payload.meta_description }, updated_by: actor, updated_at: new Date().toISOString() }
      const existing = await supabase.from("cms_entries").select("id").eq("key", key).maybeSingle()
      const query = existing.data?.id ? supabase.from("cms_entries").update(row).eq("id", existing.data.id).select("*").single() : supabase.from("cms_entries").insert(row).select("*").single()
      const { data, error } = await query
      if (error) return jsonError(error.message, 400)
      await logAudit(actor, "CMS_ENTRY_UPSERTED", "cms_entries", data.id, data, supabase)
      return NextResponse.json({ entry: data })
    }

    if (body.type === "admin_role") {
      const permissions = Array.isArray(payload.permissions) ? payload.permissions : String(payload.permissions || "").split(",").map((item) => item.trim()).filter(Boolean)
      const { data, error } = await supabase.from("admin_roles").upsert({ email: String(payload.email || "").toLowerCase(), role: payload.role || "agent", permissions, status: payload.status || "ACTIVE", updated_at: new Date().toISOString() }, { onConflict: "email" }).select("*").single()
      if (error) return jsonError(error.message, 400)
      await logAudit(actor, "ADMIN_ROLE_UPSERTED", "admin_roles", data.id, data, supabase)
      return NextResponse.json({ role: data })
    }

    if (body.type === "zone_poi") {
      const id = payload.id || body.id
      if (payload.action === "delete" && id) {
        const { data, error } = await supabase.from("zone_poi").delete().eq("id", id).select("*").maybeSingle()
        if (error) return jsonError(error.message, 400)
        await logAudit(actor, "ZONE_POI_DELETED", "zone_poi", id, data || { id }, supabase)
        return NextResponse.json({ poi: data || { id, deleted: true } })
      }
      const row = { zone: payload.zone || payload.zone_slug || "Bucuresti Nord", name: payload.name || "Punct de interes", category: payload.category || "general", minutes: number(payload.minutes) || 5, score: number(payload.score) || 80, lat: number(payload.lat), lng: number(payload.lng), latitude: number(payload.lat), longitude: number(payload.lng), notes: payload.notes || null, updated_at: new Date().toISOString() }
      const query = id ? supabase.from("zone_poi").update(row).eq("id", id).select("*").single() : supabase.from("zone_poi").insert(row).select("*").single()
      const { data, error } = await query
      if (error) return jsonError(error.message, 400)
      await logAudit(actor, "ZONE_POI_MUTATED", "zone_poi", data.id, data, supabase)
      return NextResponse.json({ poi: data })
    }

    if (body.type === "document_status") {
      const id = payload.id || body.id
      if (!id) return jsonError("Document id lipseste", 400)
      const { data, error } = await supabase.from("client_documents").update({ status: payload.status || body.status || "REVIEW", notes: payload.notes || null, reviewed_by: actor, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("*").single()
      if (error) return jsonError(error.message, 400)
      await logAudit(actor, "CLIENT_DOCUMENT_REVIEWED", "client_documents", data.id, data, supabase)
      return NextResponse.json({ document: data })
    }

    if (body.type === "client_notification") {
      const notification = await queueOutbox(payload, actor, supabase)
      return NextResponse.json({ notification })
    }

    if (body.type === "audit_event") {
      const audit = await logAudit(actor, payload.action || "manual_check", payload.entity || "admin", payload.entity_id || null, payload.details || payload, supabase)
      return NextResponse.json({ audit })
    }

    return jsonError("Tip actiune invalid", 400)
  } catch (error: any) {
    return jsonError(error.message || "Admin platform save failed")
  }
}

async function upsertAppointment(payload: Row, actor: string, supabase: any) {
  const id = payload.id
  const next = normalizeAppointmentPayload(payload)
  const query = id ? supabase.from("appointments").update(next).eq("id", id).select("*").single() : supabase.from("appointments").insert(next).select("*").single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  if (data.slot_id) await supabase.from("appointment_slots").update({ status: ["CANCELLED", "REJECTED"].includes(data.status) ? "AVAILABLE" : "BOOKED", updated_at: new Date().toISOString() }).eq("id", data.slot_id)
  await queueOutbox({ target: data.client_email, subject: "Actualizare vizionare HQS", body: `Status vizionare: ${data.status}`, entity: "appointments", entity_id: data.id }, actor, supabase)
  await logAudit(actor, "APPOINTMENT_MUTATED", "appointments", data.id, data, supabase)
  return data
}

async function queueOutbox(payload: Row, actor: string, supabase: any) {
  const row = { channel: payload.channel || "EMAIL", target: payload.target || payload.client_email || null, subject: payload.subject || payload.title || "Reminder HQS", body: payload.body || "", status: payload.status || "QUEUED", due_at: payload.due_at || null, entity: payload.entity || null, entity_id: payload.entity_id || null, metadata: payload.metadata || {}, created_by: actor }
  const { data, error } = await supabase.from("admin_notification_outbox").insert(row).select("*").single()
  if (error) throw new Error(error.message)
  await logAudit(actor, "NOTIFICATION_QUEUED", "admin_notification_outbox", data.id, data, supabase)
  return data
}

async function logAudit(actor: string, action: string, entity: string, entityId: string | null, details: Row, supabase: any) {
  const { data } = await supabase.from("admin_audit_log").insert({ actor, action, entity, entity_id: entityId, details, metadata: details }).select("*").maybeSingle()
  return data
}

function number(value: unknown) {
  if (value === "" || value === null || value === undefined) return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
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

function filterPlatformData(data: Record<string, any>, session: any) {
  const next: Record<string, any> = { ...data }
  if (!hasAdminPermission(session, "clients")) next.client_profiles = []
  if (!hasAdminPermission(session, "documents")) next.client_documents = []
  if (!hasAdminPermission(session, "offers")) next.property_offers = []
  if (!hasAdminPermission(session, "cms")) next.cms_entries = []
  if (!hasAdminPermission(session, "zones")) next.zone_poi = []
  if (!hasAdminPermission(session, "roles")) next.admin_roles = []
  if (!hasAdminPermission(session, "audit")) next.admin_audit_log = []
  if (!hasAdminPermission(session, "notifications")) {
    next.client_notifications = []
    next.admin_notification_outbox = []
  }
  return next
}
