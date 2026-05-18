import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizePropertyPatch } from "@/lib/admin-properties"
import { NextResponse } from "next/server"

export const runtime = "edge"

function isPublished(status: unknown) {
  return String(status || "").toUpperCase() === "PUBLISHED"
}

async function hasCoverImage(supabase: any, propertyId: string, coverImageUrl?: string | null) {
  if (coverImageUrl) return true
  const { data } = await supabase
    .from("property_media")
    .select("id")
    .eq("property_id", propertyId)
    .in("kind", ["cover", "gallery"])
    .limit(1)
    .maybeSingle()
  return Boolean(data?.id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const raw = await request.json().catch(() => ({}))
    const payload = normalizePropertyPatch(raw)
    if (isPublished(payload.status)) {
      const existing = await auth.supabase.from("properties").select("cover_image_url").eq("id", params.id).maybeSingle()
      if (existing.error) return jsonError(existing.error.message, 400)
      const coverImageUrl = payload.cover_image_url !== undefined ? payload.cover_image_url : existing.data?.cover_image_url
      if (!(await hasCoverImage(auth.supabase, params.id, coverImageUrl))) {
        return jsonError("Adauga o imagine cover inainte de publicare.", 400)
      }
    }
    const { data, error } = await auth.supabase.from("properties").update(payload).eq("id", params.id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "PROPERTY_UPDATED", entity: "properties", entity_id: data.id, details: payload, metadata: data }),
    ])
    return NextResponse.json({ property: data })
  } catch (error: any) {
    return jsonError(error.message || "Property update failed")
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const { error } = await auth.supabase.from("properties").delete().eq("id", params.id)
    if (error) return jsonError(error.message, 400)
    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "PROPERTY_DELETED", entity: "properties", entity_id: params.id, details: { id: params.id }, metadata: { id: params.id } }),
    ])
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return jsonError(error.message || "Property delete failed")
  }
}
