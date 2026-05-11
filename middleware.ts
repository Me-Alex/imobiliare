import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const auth = request.headers.get("authorization")
    const adminPass = process.env.ADMIN_PASSWORD
    const expected = adminPass ? "Basic " + btoa(`admin:${adminPass}`) : null
    if (auth !== expected) {
      return new NextResponse("Autentificare necesară", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="HQS Admin"' },
      })
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ["/admin/:path*"] }
