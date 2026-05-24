import { getAdminClient, jsonError } from "@/lib/admin-api"
import { PUBLIC_PROPERTY_SELECT } from "@/lib/supabase"
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase"
import { NextResponse } from "next/server"


async function getUser(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : ""
  if (!token) return null
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` } })
  if (!response.ok) return null
  return response.json().catch(() => null)
}

export async function GET(request: Request) {
  try {
    const user = await getUser(request)
    const email = String(user?.email || "").toLowerCase()
    if (!email) return NextResponse.json({ error: "Autentificare proprietar necesara" }, { status: 401 })
    const supabase = getAdminClient()
    const [properties, reports, docs] = await Promise.all([
      supabase.from("properties").select(PUBLIC_PROPERTY_SELECT).eq("owner_email", email).in("status", ["PUBLISHED", "SOLD", "RENTED"]).order("updated_at", { ascending: false }),
      supabase.from("owner_reports").select("id,owner_email,property_id,title,period_start,period_end,status,summary,metrics,created_at,updated_at").eq("owner_email", email).in("status", ["PUBLISHED", "SENT", "APPROVED"]).order("created_at", { ascending: false }),
      supabase.from("admin_document_versions").select("id,title,type,status,docusign_envelope_id,created_at,updated_at").eq("signer_email", email).in("status", ["SENT", "SIGNED", "COMPLETED"]).order("created_at", { ascending: false }),
    ])
    return NextResponse.json({ owner: { id: user.id, email }, properties: properties.data || [], reports: reports.data || [], documents: docs.data || [] })
  } catch (error: any) {
    return jsonError(error.message || "Owner dashboard failed")
  }
}
