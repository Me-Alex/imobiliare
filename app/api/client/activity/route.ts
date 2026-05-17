import { clientActivitySchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"


export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const [activity, notifications] = await Promise.all([
    session.supabase
      .from("client_activity")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    session.supabase
      .from("client_notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  if (activity.error) return NextResponse.json({ error: activity.error.message }, { status: 400 })
  if (notifications.error) return NextResponse.json({ error: notifications.error.message }, { status: 400 })

  return NextResponse.json({
    activity: activity.data || [],
    notifications: notifications.data || [],
  })
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "client-activity", 40, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const parsed = await parseJsonBody(request, clientActivitySchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data
  const { data, error } = await session.supabase
    .from("client_activity")
    .insert({
      user_id: session.user.id,
      type: body.type,
      title: body.title,
      description: body.description,
      metadata: body.metadata,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ activity: data }, { status: 201 })
}
