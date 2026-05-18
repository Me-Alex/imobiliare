import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

function normalize(payload: Record<string, any>) {
  const title = String(payload.title || payload.file_name || "Document client").trim()
  return {
    user_id: String(payload.user_id || "").trim(),
    title,
    type: payload.type || "dosar client",
    status: payload.status || "PENDING",
    url: payload.path || payload.url || null,
    expires_at: payload.expires_at || null,
    checklist: payload.checklist || [
      { label: "Fisier privat incarcat", done: Boolean(payload.path || payload.url) },
      { label: "Review admin", done: false },
      { label: "Expirare verificata", done: Boolean(payload.expires_at) },
    ],
    notes: payload.notes || null,
    updated_at: new Date().toISOString(),
  }
}

async function insertDocument(supabase: any, base: Record<string, any>, extra: Record<string, any>) {
  const first = await supabase.from("client_documents").insert({ ...base, ...extra }).select("*").single()
  if (!first.error) return first
  const message = String(first.error.message || "").toLowerCase()
  if (!message.includes("column") && !message.includes("schema cache")) return first
  return supabase.from("client_documents").insert(base).select("*").single()
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "documents")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const payload = normalize(body.payload || body)
    if (!payload.user_id) return jsonError("user_id lipseste", 400)
    if (!payload.title) return jsonError("title lipseste", 400)

    const extra = {
      storage_bucket: body.bucket || "client-documents",
      storage_path: payload.url,
      file_name: body.file_name || null,
      mime_type: body.content_type || body.mime_type || null,
      byte_size: Number(body.size || body.byte_size || 0) || null,
      checksum: body.checksum || null,
      uploaded_by: auth.session.actor,
    }
    const { data, error } = await insertDocument(auth.supabase, payload, extra)
    if (error) return jsonError(error.message, 400)

    await Promise.allSettled([
      auth.supabase.from("client_activity").insert({
        user_id: payload.user_id,
        type: "DOCUMENT_UPLOADED_BY_ADMIN",
        title: "Document adaugat de admin",
        description: payload.title,
        metadata: { document_id: data.id, path: payload.url },
      }),
      auth.supabase.from("admin_audit_log").insert({
        actor: auth.session.actor,
        action: "CLIENT_DOCUMENT_UPLOADED",
        entity: "client_documents",
        entity_id: data.id,
        details: data,
        metadata: data,
      }),
    ])

    return NextResponse.json({ document: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Document save failed")
  }
}
