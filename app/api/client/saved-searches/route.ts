import { parseJsonBody, savedSearchSchema } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { data, error } = await session.supabase
    .from("client_saved_searches")
    .select("*")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ saved_searches: data || [] })
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "client-saved-searches", 30, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const parsed = await parseJsonBody(request, savedSearchSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data

  const row = {
    user_id: session.user.id,
    label: body.label,
    query: body.query || "",
    filters: body.filters || {},
    results_count: body.results_count,
    notifications_enabled: body.notifications_enabled,
    updated_at: new Date().toISOString(),
  }

  const query = body.id
    ? session.supabase.from("client_saved_searches").update(row).eq("user_id", session.user.id).eq("id", body.id).select("*").single()
    : session.supabase.from("client_saved_searches").upsert(row, { onConflict: "user_id,label" }).select("*").single()
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await Promise.allSettled([
    session.supabase.from("client_activity").insert({
      user_id: session.user.id,
      type: "SAVED_SEARCH_SYNCED",
      title: "Cautare salvata",
      description: `Cautarea "${data.label}" a fost sincronizata in cont.`,
      metadata: { saved_search_id: data.id, filters: data.filters },
    }),
  ])

  return NextResponse.json({ saved_search: data })
}

export async function DELETE(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id lipseste" }, { status: 400 })
  const { error } = await session.supabase
    .from("client_saved_searches")
    .delete()
    .eq("user_id", session.user.id)
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ deleted: true })
}
