import { getAdminClient, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizePropertyPayload } from "@/lib/admin-properties"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "bulk")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!rows.length) return jsonError("Nu exista randuri de import.", 400)
    const normalized = rows.map((row: Record<string, any>) => normalizePropertyPayload(row))
    const { data, error } = await getAdminClient().from("properties").upsert(normalized, { onConflict: "slug" }).select("id,title,slug,status")
    const result = { type: "properties", status: error ? "FAILED" : "DONE", total_count: rows.length, success_count: error ? 0 : (data || []).length, error_count: error ? rows.length : 0, errors: error ? [{ message: error.message }] : [], created_by: auth.session.actor, updated_at: new Date().toISOString() }
    await getAdminClient().from("admin_bulk_imports").insert(result)
    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ imported: data || [], summary: result })
  } catch (error: any) {
    return jsonError(error.message || "Bulk import failed")
  }
}

