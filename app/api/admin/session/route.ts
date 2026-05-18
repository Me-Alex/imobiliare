import { getAdminSession, unauthorized } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await getAdminSession(request)
  if (!session) return unauthorized()
  return NextResponse.json({ admin: session })
}
