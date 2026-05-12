import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase"

export function getClientToken(request: Request) {
  const auth = request.headers.get("authorization") || ""
  return auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : ""
}

export function getClientSupabase(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  })
}

export async function requireClient(request: Request) {
  const token = getClientToken(request)
  const supabase = getClientSupabase(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Autentificare client necesara" }, { status: 401 }) }
  }

  return { token, supabase, user: data.user }
}
