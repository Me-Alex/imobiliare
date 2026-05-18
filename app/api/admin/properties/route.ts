import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizePropertyPayload } from "@/lib/admin-properties"
import { NextResponse } from "next/server"

export const runtime = "edge"

function isPublished(status: unknown) {
  return String(status || "").toUpperCase() === "PUBLISHED"
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "properties")
  if ("error" in auth) return auth.error

  try {
    const payload = normalizePropertyPayload(await request.json().catch(() => ({})))
    if (isPublished(payload.status) && !payload.cover_image_url) {
      return jsonError("Adauga o imagine cover inainte de publicare.", 400)
    }
    const { data, error } = await auth.supabase.from("properties").insert(payload).select("*").single()
    if (error) return jsonError(error.message, 400)
    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "PROPERTY_CREATED", entity: "properties", entity_id: data.id, details: data, metadata: data }),
    ])
    return NextResponse.json({ property: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Property create failed")
  }
}
