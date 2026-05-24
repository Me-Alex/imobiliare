import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"


const moduleTypes = new Set(["payment_plans", "projects", "team_users", "owners", "documents", "notifications", "activities"])

function normalizePayload(payload: Record<string, any>) {
  return Object.fromEntries(Object.entries(payload || {}).filter(([, value]) => value !== undefined))
}

export async function GET(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "reports")
  if ("error" in auth) return auth.error

  try {
    const { listAdminModules } = await import("@/lib/admin-data")
    return NextResponse.json(await listAdminModules(auth.supabase))
  } catch (error: any) {
    return jsonError(error.message || "Admin modules request failed")
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "settings")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const supabase = auth.supabase
    const type = String(body.type || "")
    const payload = normalizePayload(body.payload || {})

    if (type === "settings") {
      const existing = await supabase.from("admin_modules").select("id").eq("type", "settings").eq("key", "settings").maybeSingle()
      const item = {
        type: "settings",
        key: "settings",
        payload,
        status: "ACTIVE",
        created_by: auth.session.actor,
        updated_at: new Date().toISOString(),
      }
      const query = existing.data?.id
        ? supabase.from("admin_modules").update(item).eq("id", existing.data.id).select("*").single()
        : supabase.from("admin_modules").insert(item).select("*").single()
      const { data, error } = await query
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ settings: data?.payload || payload })
    }

    if (!moduleTypes.has(type)) return jsonError("Tip de modul invalid", 400)

    const id = payload.id || body.id
    const { id: _payloadId, ...storedPayload } = payload
    const item = {
      type,
      payload: storedPayload,
      status: payload.status || payload.stage || null,
      created_by: auth.session.actor,
      updated_at: new Date().toISOString(),
    }
    const query = id
      ? supabase.from("admin_modules").update(item).eq("id", id).select("*").single()
      : supabase.from("admin_modules").insert(item).select("*").single()
    const { data, error } = await query
    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ type, item: { id: data.id, ...(data.payload || {}), status: data.status, created_at: data.created_at, updated_at: data.updated_at } })
  } catch (error: any) {
    return jsonError(error.message || "Admin module save failed")
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "settings")
  if ("error" in auth) return auth.error

  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type") || ""
    const id = url.searchParams.get("id") || ""
    if (!id || !moduleTypes.has(type)) return jsonError("Parametri invalidi", 400)
    const { data, error } = await auth.supabase.from("admin_modules").delete().eq("type", type).eq("id", id).select("id,type").maybeSingle()
    if (error) return jsonError(error.message, 400)
    if (!data) return jsonError("Intrarea nu exista sau a fost deja stearsa.", 404)
    return NextResponse.json({ deleted: true, type, id })
  } catch (error: any) {
    return jsonError(error.message || "Admin module delete failed")
  }
}
