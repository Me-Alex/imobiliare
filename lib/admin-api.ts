import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isAdminRequest(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const auth = request.headers.get("authorization")

  if (!adminPassword || !auth) return false
  return auth === "Basic " + btoa(`admin:${adminPassword}`)
}

export function unauthorized() {
  return new NextResponse("Autentificare necesara", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="HQS Admin"' },
  })
}

export function getAdminClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase public environment variables are missing")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getAdminRpcSecret() {
  const secret = process.env.ADMIN_RPC_SECRET
  if (!secret) throw new Error("ADMIN_RPC_SECRET is missing")
  return secret
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}
