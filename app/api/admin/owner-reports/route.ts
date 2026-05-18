import { getAdminClient, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { optionalUuid } from "@/lib/admin-properties"
import { NextResponse } from "next/server"

export const runtime = "edge"

function normalizeReport(payload: Record<string, any>, actor: string) {
  return {
    owner_email: String(payload.owner_email || "").trim().toLowerCase(),
    property_id: optionalUuid(payload.property_id),
    title: payload.title || "Raport proprietar HQS",
    period_start: payload.period_start || null,
    period_end: payload.period_end || null,
    status: payload.status || "DRAFT",
    summary: payload.summary || null,
    metrics: payload.metrics || {},
    created_by: actor,
    updated_at: new Date().toISOString(),
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "owners")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const payload = normalizeReport(body.payload || body, auth.session.actor)
    if (!payload.owner_email) return jsonError("owner_email lipseste", 400)
    const { data, error } = await getAdminClient().from("owner_reports").insert(payload).select("*").single()
    if (error) return jsonError(error.message, 400)
    await getAdminClient().from("admin_audit_log").insert({ actor: auth.session.actor, action: "OWNER_REPORT_CREATED", entity: "owner_reports", entity_id: data.id, details: data, metadata: data })
    return NextResponse.json({ report: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Owner report save failed")
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "owners")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || body.payload?.id || "")
    if (!id) return jsonError("id lipseste", 400)
    const payload = normalizeReport(body.payload || body, auth.session.actor)
    const { data, error } = await getAdminClient().from("owner_reports").update(payload).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await getAdminClient().from("admin_audit_log").insert({ actor: auth.session.actor, action: "OWNER_REPORT_UPDATED", entity: "owner_reports", entity_id: data.id, details: data, metadata: data })
    return NextResponse.json({ report: data })
  } catch (error: any) {
    return jsonError(error.message || "Owner report update failed")
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "owners")
  if ("error" in auth) return auth.error

  try {
    const id = new URL(request.url).searchParams.get("id") || ""
    if (!id) return jsonError("id lipseste", 400)
    const { error } = await getAdminClient().from("owner_reports").delete().eq("id", id)
    if (error) return jsonError(error.message, 400)
    await getAdminClient().from("admin_audit_log").insert({ actor: auth.session.actor, action: "OWNER_REPORT_DELETED", entity: "owner_reports", entity_id: id, details: { id }, metadata: { id } })
    return NextResponse.json({ deleted: true, id })
  } catch (error: any) {
    return jsonError(error.message || "Owner report delete failed")
  }
}
