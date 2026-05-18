import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizePropertyPayload } from "@/lib/admin-properties"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const payload = normalizePropertyPayload(await request.json().catch(() => ({})))
    const { data, error } = await auth.supabase.from("properties").insert(payload).select("*").single()
    if (error) return jsonError(error.message, 400)
    await auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "PROPERTY_CREATED", entity: "properties", entity_id: data.id, details: data, metadata: data }).throwOnError()
    return NextResponse.json({ property: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Property create failed")
  }
}
