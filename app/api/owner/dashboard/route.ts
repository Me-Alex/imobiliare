import { jsonError } from "@/lib/admin-api"
import { requireClient } from "@/lib/client-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const session = await requireClient(request)
    if ("error" in session) return NextResponse.json({ error: "Autentificare proprietar necesara" }, { status: 401 })
    const email = String(session.user.email || "").toLowerCase()
    const supabase = session.supabase
    const [properties, reports, docs] = await Promise.all([
      supabase.from("properties").select("*").eq("owner_email", email).order("updated_at", { ascending: false }),
      supabase.from("owner_reports").select("*").eq("owner_email", email).order("created_at", { ascending: false }),
      supabase.from("admin_document_versions").select("*").eq("signer_email", email).order("created_at", { ascending: false }),
    ])
    const firstError = [properties.error, reports.error, docs.error].find(Boolean)
    if (firstError) return jsonError(firstError.message, 400)
    return NextResponse.json({ owner: { id: session.user.id, email }, properties: properties.data || [], reports: reports.data || [], documents: docs.data || [] })
  } catch (error: any) {
    return jsonError(error.message || "Owner dashboard failed")
  }
}
