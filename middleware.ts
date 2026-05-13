import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const parsed = parseBasicAuth(request.headers.get("authorization"))
    const adminPass = process.env.ADMIN_PASSWORD
    if (!adminPass || parsed?.password !== adminPass || !parsed.username) {
      return new NextResponse("Autentificare necesara", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="HQS Admin"' },
      })
    }
  }
  return NextResponse.next()
}

function parseBasicAuth(auth: string | null) {
  if (!auth?.startsWith("Basic ")) return null
  try {
    const decoded = atob(auth.slice("Basic ".length))
    const separator = decoded.indexOf(":")
    if (separator === -1) return null
    return { username: decoded.slice(0, separator).trim(), password: decoded.slice(separator + 1) }
  } catch {
    return null
  }
}

export const config = { matcher: ["/admin/:path*"] }
