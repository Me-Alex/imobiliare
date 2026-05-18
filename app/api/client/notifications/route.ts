import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const limited = await rateLimit(request, "client-notifications", 80, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const url = new URL(request.url)
  const unreadOnly = url.searchParams.get("unread") === "1"

  try {
    if (unreadOnly) {
      const { count, error } = await session.supabase
        .from("client_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("status", "UNREAD")
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ unread: Number(count || 0) })
    }

    const { data, error } = await session.supabase
      .from("client_notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ notifications: Array.isArray(data) ? data : [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Client notifications request failed" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const limited = await rateLimit(request, "client-notifications-mutate", 30, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || "")
    if (!id) return NextResponse.json({ error: "Notification id lipseste" }, { status: 400 })
    const action = String(body.action || (body.read ? "read" : body.unread ? "unread" : "read")).toLowerCase()
    const isRead = action !== "unread"

    const { data, error } = await session.supabase
      .from("client_notifications")
      .update({
        status: isRead ? "READ" : "UNREAD",
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ notification: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Client notification update failed" }, { status: 500 })
  }
}

