import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizePropertyPatch } from "@/lib/admin-properties"
import { NextResponse } from "next/server"


type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const { id } = await params
    const raw = await request.json().catch(() => ({}))
    const patch = normalizePropertyPatch(raw && typeof raw === "object" ? raw : {})

    const wantsPublish = String((patch as any).status || "").toUpperCase() === "PUBLISHED"
    if (wantsPublish) {
      const { data: existing, error: existingError } = await auth.supabase
        .from("properties")
        .select("id,title,slug,price,currency,city,type,cover_image_url,gallery_urls,status")
        .eq("id", id)
        .maybeSingle()
      if (existingError || !existing) return jsonError(existingError?.message || "Proprietatea nu a fost gasita.", 404)

      const candidate: Record<string, any> = { ...existing, ...patch }
      const missing: string[] = []
      if (!String(candidate.title || "").trim()) missing.push("titlu")
      if (!String(candidate.slug || "").trim()) missing.push("slug")
      if (!Number(candidate.price || 0)) missing.push("pret")
      if (!String(candidate.city || "").trim()) missing.push("zona/oras")
      if (!String(candidate.type || "").trim()) missing.push("tip")
      if (!String(candidate.cover_image_url || "").trim()) missing.push("cover (imagine principala)")

      if (missing.length) {
        return jsonError(`Nu poti publica inainte sa completezi: ${missing.join(", ")}.`, 400)
      }
    }

    const { data, error } = await auth.supabase.from("properties").update(patch).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: wantsPublish ? "PROPERTY_PUBLISHED" : "PROPERTY_UPDATED", entity: "properties", entity_id: data.id, details: patch, metadata: data }),
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
