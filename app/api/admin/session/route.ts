import { getAdminSession, unauthorized } from "@/lib/admin-api"
import { NextResponse } from "next/server"

function isSecureRequest(request: Request) {
  try {
    return new URL(request.url).protocol === "https:"
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const session = await getAdminSession(request)
  if (!session) return unauthorized()

  const response = NextResponse.json({ admin: session })
  const auth = request.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : ""
  if (token) {
    response.cookies.set("hqs_admin_token", token, {
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: "lax",
      path: "/admin",
      maxAge: 60 * 60 * 8,
    })
  }
  return response
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true })
  response.cookies.set("hqs_admin_token", "", {
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  })
  return response
}
