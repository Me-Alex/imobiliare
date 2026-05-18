import { getAdminSession, unauthorized } from "@/lib/admin-api"
import { ADMIN_SESSION_COOKIE, createAdminSessionCookie } from "@/lib/admin-session-cookie"
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
