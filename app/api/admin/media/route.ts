import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "media")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const propertyId = String(body.property_id || "")
    const path = String(body.path || "")
    if (!propertyId || !path) return jsonError("property_id si path sunt obligatorii", 400)
    const { data: publicData } = auth.supabase.storage.from("property-media").getPublicUrl(path)
    const row = {
      property_id: propertyId,
      bucket: "property-media",
      path,
      public_url: body.public_url || publicData.publicUrl,
      kind: body.kind || "gallery",
      alt: body.alt || null,
      sort_order: Number(body.sort_order || 0),
      metadata: body.metadata || {},
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
    const { data, error } = await auth.supabase.from("property_media").update({ kind: body.kind, alt: body.alt, sort_order: body.sort_order, metadata: body.metadata || {}, updated_at: new Date().toISOString() }).eq("id", id).select("*").single()
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
