import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizeMarketDataPayload } from "@/lib/market-data"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "analytics")
  if ("error" in auth) return auth.error

  const { data, error } = await auth.supabase
    .from("market_data")
    .select("*")
    .order("zone", { ascending: true })
    .limit(200)

  if (error) return jsonError(error.message, 400)
  return NextResponse.json({ market_data: data || [] })
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "admin-market-data", 60, 60_000)
  if (limited) return limited

  const auth = await requireAdminPermissionAsync(request, "analytics")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const row = normalizeMarketDataPayload(body)
    if (!row.zone) return jsonError("Zona este obligatorie.", 400)
    const { data, error } = await auth.supabase
      .from("market_data")
      .upsert({ ...row, created_by: auth.session.actor }, { onConflict: "zone" })
      .select("*")
      .single()

    if (error) return jsonError(error.message, 400)
    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "MARKET_DATA_UPSERTED", entity: "market_data", entity_id: data.id, details: data, metadata: data }),
    ])
    return NextResponse.json({ market_data: data })
  } catch (error: any) {
    return jsonError(error.message || "Market data save failed")
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "analytics")
  if ("error" in auth) return auth.error

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return jsonError("id lipseste", 400)
  const { data, error } = await auth.supabase
    .from("market_data")
    .update({ status: "ARCHIVED", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()

  if (error) return jsonError(error.message, 400)
  return NextResponse.json({ market_data: data })
}
