import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

const maxBytes = 15 * 1024 * 1024
const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "document"
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "documents")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const userId = String(body.user_id || "").trim()
    const fileName = safeName(String(body.file_name || "document.pdf"))
    const contentType = String(body.content_type || "").trim()
    const size = Number(body.size || 0)

    if (!userId) return jsonError("user_id este obligatoriu pentru documente private.", 400)
    if (!allowedTypes.has(contentType)) return jsonError("Tip fisier neacceptat pentru document privat.", 400)
    if (!size || size > maxBytes) return jsonError("Fisierul depaseste limita de 15MB.", 400)

    const path = `${userId}/admin/${crypto.randomUUID()}-${fileName}`
    const { data, error } = await auth.supabase.storage.from("client-documents").createSignedUploadUrl(path, { upsert: false })
    if (error) return jsonError(error.message, 400)

    return NextResponse.json({
      bucket: "client-documents",
      path,
      token: data?.token,
      signed_url: data?.signedUrl,
      content_type: contentType,
      expires_in: 7200,
    })
  } catch (error: any) {
    return jsonError(error.message || "Document upload URL failed")
  }
}
