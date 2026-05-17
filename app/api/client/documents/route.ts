import { clientDocumentSchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"





export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  const { data, error } = await session.supabase
    .from("client_documents")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const documents = await Promise.all((data || []).map(async (document) => {
    if (!document.url || /^https?:\/\//.test(document.url)) return document
    const signed = await session.supabase.storage.from("client-documents").createSignedUrl(document.url, 60 * 15)
    return { ...document, signed_url: signed.data?.signedUrl || null }
  }))
  return NextResponse.json({ documents })
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "client-documents", 20, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const parsed = await parseJsonBody(request, clientDocumentSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data
  const checklist = body.checklist || [
    { label: "Fisier incarcat sau link document", done: Boolean(body.url) },
    { label: "Verificare identitate", done: false },
    { label: "Validare expirare", done: Boolean(body.expires_at) },
  ]
  const { data, error } = await session.supabase
    .from("client_documents")
    .insert({
      user_id: session.user.id,
      title: body.title,
      type: body.type,
      status: body.status,
      url: body.url,
      expires_at: body.expires_at || null,
      checklist,
      notes: body.notes || null,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await session.supabase.from("client_activity").insert({
    user_id: session.user.id,
    type: "DOCUMENT_CREATED",
    title: "Document adaugat",
    description: body.title,
    metadata: { document_id: data.id, status: data.status },
  })
  return NextResponse.json({ document: data })
}
