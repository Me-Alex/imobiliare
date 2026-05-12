import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function getClientToken(request: Request) {
  const auth = request.headers.get("authorization") || ""
  return auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : ""
}

export function getClientSupabase(token: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase public environment variables are missing")
  }

  return createClient(supabaseUrl, supabaseKey, {
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
