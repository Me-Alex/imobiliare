import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rute publice admin care nu necesita autentificare
const PUBLIC_ADMIN_PATHS = ["/admin/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirectioneaza /admin si /admin/ spre /admin/dashboard
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  // Protejeaza toate rutele /admin/* in afara de /admin/login
  if (pathname.startsWith("/admin/") && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    const authCookie = request.cookies.get("hqs_admin_token")?.value
    const authHeader = request.headers.get("authorization")
    const hasToken = !!(authCookie || authHeader?.startsWith("Bearer "))

    if (!hasToken) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ["/admin/:path*"] }
