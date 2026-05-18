import { adminMediaUploadSchema, parseJsonBody } from "@/lib/api-validation"
import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])
const floorplanTypes = new Set([...Array.from(imageTypes), "application/pdf"])
const maxImageBytes = 8 * 1024 * 1024
const maxFloorplanBytes = 20 * 1024 * 1024

function cleanName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload"
}

function normalizeContentType(fileName: string, contentType: string) {
  const lower = fileName.toLowerCase()
  if (contentType && contentType !== "application/octet-stream") return contentType.toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".avif")) return "image/avif"
  if (lower.endsWith(".pdf")) return "application/pdf"
  return "application/octet-stream"
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "media")
  if ("error" in auth) return auth.error

  try {
    const parsed = await parseJsonBody(request, adminMediaUploadSchema)
    if ("error" in parsed) return parsed.error
    const body = parsed.data
    const propertyId = body.property_id
    const fileName = cleanName(body.file_name)
    const kind = body.kind
    const contentType = normalizeContentType(fileName, body.content_type)
    const allowedTypes = kind === "floorplan" ? floorplanTypes : imageTypes
    const maxBytes = kind === "floorplan" ? maxFloorplanBytes : maxImageBytes

    if (!allowedTypes.has(contentType)) {
      return jsonError(kind === "floorplan" ? "Floorplan accepta doar imagini sau PDF." : "Media proprietate accepta doar JPG, PNG, WebP sau AVIF.", 400)
    }
    if (body.size > maxBytes) return jsonError(`Fisierul depaseste limita de ${Math.round(maxBytes / 1024 / 1024)} MB.`, 400)

    const property = await auth.supabase.from("properties").select("id").eq("id", propertyId).maybeSingle()
    if (property.error) return jsonError(property.error.message, 400)
    if (!property.data) return jsonError("Proprietatea nu exista.", 404)
    if (body.checksum) {
      const duplicate = await auth.supabase.from("property_media").select("id,path").eq("property_id", propertyId).eq("checksum", body.checksum).maybeSingle()
      if (duplicate.data) return jsonError(`Fisier duplicat pentru aceasta proprietate: ${duplicate.data.path}`, 409)
    }

    const path = `${propertyId}/${kind}/${Date.now()}-${fileName}`
    const { data, error } = await auth.supabase.storage.from("property-media").createSignedUploadUrl(path)
    if (error) return jsonError(error.message, 400)
    return NextResponse.json({
      ...data,
      path,
      bucket: "property-media",
      content_type: contentType,
      max_size_bytes: maxBytes,
      allowed_types: Array.from(allowedTypes),
      checksum: body.checksum || null,
      width: body.width || 0,
      height: body.height || 0,
    })
  } catch (error: any) {
    return jsonError(error.message || "Media upload URL failed")
  }
}
