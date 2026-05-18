import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  if (pathname.startsWith("/admin/") && pathname !== "/admin/login" && pathname !== "/admin/dashboard") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ["/admin/:path*"] }
