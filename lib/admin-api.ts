import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase"

export type AdminSession = {
  actor: string
  role: "admin" | "manager" | "agent"
  permissions: string[]
}

const rolePermissions: Record<AdminSession["role"], string[]> = {
  admin: ["all"],
  manager: ["leads", "clients", "appointments", "slots", "offers", "documents", "reports", "cms", "zones", "notifications", "audit"],
  agent: ["leads", "clients", "appointments", "offers", "documents"],
}

function parseBasicAuth(request: Request) {
  const auth = request.headers.get("authorization") || ""
  if (!auth.startsWith("Basic ")) return null

  try {
    const decoded = atob(auth.slice("Basic ".length))
    const separator = decoded.indexOf(":")
    if (separator === -1) return null
    return {
      username: decoded.slice(0, separator).trim().toLowerCase(),
      password: decoded.slice(separator + 1),
    }
  } catch {
    return null
  }
}

export function isAdminRequest(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const parsed = parseBasicAuth(request)

  if (!adminPassword || !parsed?.username) return false
  return parsed.password === adminPassword
}

export function getAdminSession(request: Request): AdminSession | null {
  if (!isAdminRequest(request)) return null

  const parsed = parseBasicAuth(request)
  const actor = request.headers.get("x-admin-email")?.trim().toLowerCase() || parsed?.username || "admin"
  const role: AdminSession["role"] = actor.includes("manager") ? "manager" : actor.includes("agent") ? "agent" : "admin"

  return {
    actor,
    role,
    permissions: rolePermissions[role],
  }
}

export function hasAdminPermission(session: AdminSession, permission: string) {
  return session.permissions.includes("all") || session.permissions.includes(permission)
}

export function requireAdminPermission(request: Request, permission: string) {
  const session = getAdminSession(request)
  if (!session) return { error: unauthorized() as Response }
  if (!hasAdminPermission(session, permission)) {
    return {
      error: NextResponse.json(
        { error: `Rolul ${session.role} nu are permisiunea ${permission}` },
        { status: 403 },
      ) as Response,
    }
  }
  return { session }
}

export function unauthorized() {
  return new NextResponse("Autentificare necesara", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="HQS Admin"' },
  })
}

export function getAdminClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getAdminRpcSecret() {
  const contextKey = Symbol.for("__cloudflare-request-context__")
  const context = (globalThis as typeof globalThis & Record<symbol, { env?: Record<string, string | undefined> } | undefined>)[
    contextKey
  ]
  const env = context?.env as Record<string, string | undefined> | undefined
  const secret = env?.ADMIN_RPC_SECRET || process.env.ADMIN_RPC_SECRET
  if (!secret) throw new Error("ADMIN_RPC_SECRET is missing")
  return secret
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}
