import { requireClient } from "@/lib/client-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { data, error } = await session.supabase
    .from("client_documents")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ documents: data || [] })
}

export async function POST(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const body = await request.json().catch(() => ({}))
  const { data, error } = await session.supabase
    .from("client_documents")
    .insert({
      user_id: session.user.id,
      title: String(body.title || "Document client"),
      type: String(body.type || "act client"),
      status: String(body.status || "PENDING"),
      url: body.url ? String(body.url) : null,
      expires_at: body.expires_at || null,
      notes: body.notes ? String(body.notes) : null,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ document: data })
}
