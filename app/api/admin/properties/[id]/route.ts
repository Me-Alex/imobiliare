import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizePropertyPayload } from "@/lib/admin-properties"
import { NextResponse } from "next/server"


type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const { id } = await params
    const raw = await request.json().catch(() => ({}))
    const payload = normalizePropertyPayload(raw)
    if (!raw.title) delete (payload as any).title
    if (!raw.slug) delete (payload as any).slug
    const { data, error } = await auth.supabase.from("properties").update(payload).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "PROPERTY_UPDATED", entity: "properties", entity_id: data.id, details: payload, metadata: data }),
    ])
    return NextResponse.json({ property: data })
  } catch (error: any) {
    return jsonError(error.message || "Property update failed")
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const { id } = await params
    const { error } = await auth.supabase.from("properties").delete().eq("id", id)
    if (error) return jsonError(error.message, 400)
    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "PROPERTY_DELETED", entity: "properties", entity_id: id, details: { id }, metadata: { id } }),
    ])
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return jsonError(error.message || "Property delete failed")
  }
}
