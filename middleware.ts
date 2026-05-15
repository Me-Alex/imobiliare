import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith("/admin")) {
    const parsed = parseBasicAuth(request.headers.get("authorization"))
    const adminPass = process.env.ADMIN_PASSWORD
    const allowedUsers = parseAllowedUsers(process.env.ADMIN_ALLOWED_USERS)
    const userAllowed = !allowedUsers.length || Boolean(parsed?.username && allowedUsers.includes(parsed.username.toLowerCase()))

    if (!adminPass || parsed?.password !== adminPass || !parsed.username || !userAllowed) {
      return new NextResponse("Autentificare necesara", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="HQS Admin"' },
      })
    }

    if (pathname === "/admin" || pathname === "/admin/") {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = "/admin/dashboard"
      return NextResponse.redirect(dashboardUrl)
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
    return { username: decoded.slice(0, separator).trim().toLowerCase(), password: decoded.slice(separator + 1) }
  } catch {
    return null
  }
}

function parseAllowedUsers(value: string | undefined) {
  return (value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
}

export const config = { matcher: ["/admin/:path*"] }
