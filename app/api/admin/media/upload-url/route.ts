import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"


function cleanName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload"
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "media")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const propertyId = String(body.property_id || body.propertyId || "")
    const fileName = cleanName(String(body.file_name || body.name || "property-media"))
    const kind = cleanName(String(body.kind || "gallery"))
    if (!propertyId) return jsonError("property_id lipseste", 400)
    const path = `${propertyId}/${kind}/${Date.now()}-${fileName}`
    const { data, error } = await auth.supabase.storage.from("property-media").createSignedUploadUrl(path)
    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ ...data, path, bucket: "property-media" })
  } catch (error: any) {
    return jsonError(error.message || "Media upload URL failed")
  }
}
