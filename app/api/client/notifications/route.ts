import { clientNotificationUpdateSchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { data, error } = await session.supabase
    .from("client_notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const notifications = Array.isArray(data) ? data : []
  return NextResponse.json({
    notifications,
    unread_count: notifications.filter((item) => String(item.status || "").toUpperCase() !== "READ").length,
  })
}

export async function PATCH(request: Request) {
  const limited = await rateLimit(request, "client-notifications", 40, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const parsed = await parseJsonBody(request, clientNotificationUpdateSchema)
  if ("error" in parsed) return parsed.error

  const body = parsed.data
  const now = new Date().toISOString()
  const patch = body.action === "unread"
    ? { status: "UNREAD", read_at: null }
    : { status: "READ", read_at: now }

  let query = session.supabase
    .from("client_notifications")
    .update(patch)
    .eq("user_id", session.user.id)

  if (body.action === "read_all") {
    query = query.neq("status", "READ")
  } else {
    const ids = Array.from(new Set([body.id, ...body.ids].filter((id): id is string => Boolean(id))))
    query = query.in("id", ids)
  }

  const { data, error } = await query.select("*")
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const unread = await session.supabase
    .from("client_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .neq("status", "READ")

  return NextResponse.json({
    notifications: data || [],
    unread_count: unread.count || 0,
  })
}
