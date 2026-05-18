import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

const mediaKinds = new Set(["cover", "gallery", "floorplan"])

function normalizeKind(value: unknown) {
  const kind = String(value || "gallery").toLowerCase()
  return mediaKinds.has(kind) ? kind : ""
}

function thumbnailUrl(publicUrl?: string | null, contentType?: string) {
  if (!publicUrl || contentType === "application/pdf") return null
  if (!publicUrl.includes("/storage/v1/object/public/")) return publicUrl
  return `${publicUrl.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/")}?width=640&resize=contain&quality=75`
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "media")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const propertyId = String(body.property_id || "")
    const path = String(body.path || "")
    const kind = normalizeKind(body.kind)
    if (!propertyId || !path) return jsonError("property_id si path sunt obligatorii", 400)
    if (!kind) return jsonError("kind trebuie sa fie cover, gallery sau floorplan", 400)
    const { data: publicData } = auth.supabase.storage.from("property-media").getPublicUrl(path)
    const publicUrl = body.public_url || publicData.publicUrl
    const metadata = body.metadata || {}
    const contentType = String(metadata.content_type || body.content_type || "")
    const row = {
      property_id: propertyId,
      bucket: "property-media",
      path,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl(publicUrl, contentType),
      kind,
      alt: body.alt || null,
      sort_order: Number(body.sort_order || 0),
      mime_type: contentType || null,
      byte_size: Number(metadata.size || body.size || 0) || null,
      width: Number(metadata.width || body.width || 0) || null,
      height: Number(metadata.height || body.height || 0) || null,
      checksum: metadata.checksum || body.checksum || null,
      review_status: body.alt ? "READY" : "NEEDS_ALT",
      metadata: { ...metadata, source: "admin_signed_upload" },
      created_by: auth.session.actor,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await auth.supabase.from("property_media").upsert(row, { onConflict: "property_id,path" }).select("*").single()
    if (error) return jsonError(error.message, 400)
    await syncPropertyMedia(propertyId, auth.supabase)
    return NextResponse.json({ media: data })
  } catch (error: any) {
    return jsonError(error.message || "Media save failed")
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "media")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || "")
    if (!id) return jsonError("id lipseste", 400)
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (body.kind !== undefined) {
      const kind = normalizeKind(body.kind)
      if (!kind) return jsonError("kind trebuie sa fie cover, gallery sau floorplan", 400)
      patch.kind = kind
    }
    if (body.alt !== undefined) patch.alt = body.alt || null
    if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order || 0)
    if (body.metadata !== undefined) patch.metadata = body.metadata || {}
    if (body.thumbnail_url !== undefined) patch.thumbnail_url = body.thumbnail_url || null
    if (body.review_status !== undefined) patch.review_status = body.review_status || "READY"
    const { data, error } = await auth.supabase.from("property_media").update(patch).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await syncPropertyMedia(data.property_id, auth.supabase)
    return NextResponse.json({ media: data })
  } catch (error: any) {
    return jsonError(error.message || "Media update failed")
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "media")
  if ("error" in auth) return auth.error

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id") || ""
    if (!id) return jsonError("id lipseste", 400)
    const { data, error } = await auth.supabase.from("property_media").delete().eq("id", id).select("*").maybeSingle()
    if (error) return jsonError(error.message, 400)
    if (data?.path) await auth.supabase.storage.from(data.bucket || "property-media").remove([data.path]).then(() => undefined)
    if (data?.property_id) await syncPropertyMedia(data.property_id, auth.supabase)
    return NextResponse.json({ deleted: true, media: data })
  } catch (error: any) {
    return jsonError(error.message || "Media delete failed")
  }
}

async function syncPropertyMedia(propertyId: string, supabase: any) {
  const { data } = await supabase.from("property_media").select("public_url, kind, sort_order").eq("property_id", propertyId).order("sort_order", { ascending: true })
  const rows = Array.isArray(data) ? data : []
  const cover = rows.find((row) => row.kind === "cover")?.public_url || rows[0]?.public_url || null
  const gallery = rows.filter((row) => row.kind !== "floorplan").map((row) => row.public_url).filter(Boolean)
  const floorplans = rows.filter((row) => row.kind === "floorplan").map((row) => row.public_url).filter(Boolean)
  await supabase.from("properties").update({ cover_image_url: cover, gallery_urls: gallery, floorplan_urls: floorplans, updated_at: new Date().toISOString() }).eq("id", propertyId)
}
