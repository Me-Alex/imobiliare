import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase"

export type AdminSession = {
  actor: string
  userId: string
  email: string
  role: "admin" | "manager" | "agent"
  permissions: string[]
  bootstrap?: boolean
}

const rolePermissions: Record<AdminSession["role"], string[]> = {
  admin: ["all"],
  manager: ["leads", "clients", "appointments", "slots", "offers", "documents", "properties", "listings", "transactions", "maintenance", "payments", "marketing", "reports", "exports", "cms", "zones", "notifications", "audit", "compliance", "media", "calendar", "accounting", "bulk", "integrations", "owners", "analytics"],
  agent: ["leads", "clients", "appointments", "offers", "documents", "properties", "media", "calendar"],
}

export function getRuntimeEnv() {
  const contextKey = Symbol.for("__cloudflare-request-context__")
  const context = (globalThis as typeof globalThis & Record<symbol, { env?: Record<string, string | undefined> } | undefined>)[contextKey]
  const nodeEnv = typeof process !== "undefined" ? (process.env as Record<string, string | undefined>) : {}
  return { ...nodeEnv, ...(context?.env || {}) }
}

export function getEnv(name: string) {
  return getRuntimeEnv()[name]
}

function parseBearerToken(request: Request) {
  const auth = request.headers.get("authorization") || ""
  return auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : ""
}

function parseAllowedUsers(value: string | undefined) {
  return (value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
}

function normalizeRole(value: unknown): AdminSession["role"] {
  return value === "admin" || value === "manager" || value === "agent" ? value : "agent"
}

function normalizePermissions(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean)
    } catch {
      // Fall through to CSV parsing.
    }
    return value.split(",").map((item) => item.trim()).filter(Boolean)
  }
  return []
}

async function getUserFromToken(token: string) {
  if (!token) return null
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) return null
  const user = await response.json().catch(() => null)
  return user && typeof user === "object" ? user as Record<string, any> : null
}

export function getAdminClient() {
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing")
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const getAdminServiceClient = getAdminClient

export async function getAdminSession(request: Request): Promise<AdminSession | null> {
  const token = parseBearerToken(request)
  const user = await getUserFromToken(token)
  const email = String(user?.email || "").trim().toLowerCase()
  const userId = String(user?.id || "")
  if (!email || !userId) return null

  const bootstrapEmails = parseAllowedUsers(getEnv("ADMIN_BOOTSTRAP_EMAILS"))
  const isBootstrap = bootstrapEmails.includes(email)

  try {
    const supabase = getAdminClient()
    if (isBootstrap) {
      await supabase.from("admin_roles").upsert({
        user_id: userId,
        email,
        role: "admin",
        permissions: ["all"],
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" })
    }

    const { data } = await supabase
      .from("admin_roles")
      .select("email, role, permissions, status")
      .eq("email", email)
      .eq("status", "ACTIVE")
      .maybeSingle()

    if (!data && !isBootstrap) return null

    const role = normalizeRole(data?.role || (isBootstrap ? "admin" : "agent"))
    const permissions = normalizePermissions(data?.permissions)
    return {
      actor: email,
      userId,
      email,
      role,
      permissions: permissions.length ? permissions : rolePermissions[role],
      bootstrap: isBootstrap,
    }
  } catch {
    if (!isBootstrap) return null
    return { actor: email, userId, email, role: "admin", permissions: ["all"], bootstrap: true }
  }
}

export function hasAdminPermission(session: AdminSession, permission: string) {
  if (session.permissions.includes("all") || session.permissions.includes(permission)) return true
  if (permission === "exports" && session.permissions.includes("reports")) return true
  if (permission === "properties" && (session.permissions.includes("reports") || session.permissions.includes("listings"))) return true
  if (permission === "media" && session.permissions.includes("properties")) return true
  if (permission === "calendar" && session.permissions.includes("appointments")) return true
  if (permission === "accounting" && (session.permissions.includes("payments") || session.permissions.includes("transactions"))) return true
  return false
}

export async function requireAdminPermissionAsync(request: Request, permission: string) {
  const session = await getAdminSession(request)
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

export function requireAdminPermission(request: Request, permission: string) {
  return { error: NextResponse.json({ error: `Admin auth for ${permission} must be checked asynchronously.` }, { status: 500 }) as Response }
}

export function unauthorized() {
  return NextResponse.json({ error: "Autentificare admin Supabase necesara" }, { status: 401 })
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function isAdminRequest(_request: Request) {
  return false
}
