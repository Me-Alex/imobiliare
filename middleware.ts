import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session-cookie"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) return NextResponse.next()

  const session = await verifyAdminSessionCookie(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
  if (session) return NextResponse.next()

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/admin/login"
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*"],
}
