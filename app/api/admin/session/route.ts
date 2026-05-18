import { getAdminClientIfConfigured, getAdminSession, unauthorized } from "@/lib/admin-api"
import { ADMIN_SESSION_COOKIE, createAdminSessionCookie } from "@/lib/admin-session-cookie"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await getAdminSession(request)
  if (!session) return unauthorized()
  return NextResponse.json({ admin: session })
}

export async function POST(request: Request) {
  const session = await getAdminSession(request)
  if (!session) return unauthorized()
  await logAdminAuth("ADMIN_LOGIN_SUCCESS", session.email, { role: session.role, bootstrap: session.bootstrap })
  const cookie = await createAdminSessionCookie(session)
  const response = NextResponse.json({ admin: session })
  const secure = new URL(request.url).protocol === "https:"
  response.cookies.set(ADMIN_SESSION_COOKIE, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/admin",
    maxAge: cookie.maxAge,
  })
  return response
}

export async function PUT(request: Request) {
  const limited = await rateLimit(request, "admin-login-audit", 20, 60_000)
  if (limited) return limited

  const body = await request.json().catch(() => ({}))
  const identifier = String(body.identifier || "").trim().toLowerCase()
  await logAdminAuth("ADMIN_LOGIN_FAILED", identifier || "unknown", {
    reason: String(body.reason || "login_failed").slice(0, 240),
  })
  return NextResponse.json({ logged: true })
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ cleared: true })
  const secure = new URL(request.url).protocol === "https:"
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/admin",
    maxAge: 0,
  })
  return response
}

async function logAdminAuth(action: string, identifier: string, details: Record<string, any>) {
  const supabase = getAdminClientIfConfigured()
  if (!supabase) return
  const actor = identifier || "unknown"
  await supabase
    .from("admin_audit_log")
    .insert({
      actor,
      action,
      entity: "admin_auth",
      entity_id: actor,
      details: { ...details, identifier: maskIdentifier(actor) },
      metadata: { ...details, identifier: maskIdentifier(actor) },
    })
    .then(() => undefined)
}

function maskIdentifier(value: string) {
  if (!value.includes("@")) return value.slice(0, 3) + "***"
  const [name, domain] = value.split("@")
  return `${name.slice(0, 2)}***@${domain}`
}
