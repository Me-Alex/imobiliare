import { getAdminClient, jsonError } from "@/lib/admin-api"
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
      supabase.from("properties").select("*").eq("owner_email", email).order("updated_at", { ascending: false }),
      supabase.from("owner_reports").select("*").eq("owner_email", email).order("created_at", { ascending: false }),
      supabase.from("admin_document_versions").select("*").eq("signer_email", email).order("created_at", { ascending: false }),
    ])
    return NextResponse.json({ owner: { id: user.id, email }, properties: properties.data || [], reports: reports.data || [], documents: docs.data || [] })
  } catch (error: any) {
    return jsonError(error.message || "Owner dashboard failed")
  }
}
