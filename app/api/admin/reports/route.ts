import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { listAdminSnapshot } from "@/lib/admin-data"
import { buildExecutiveReport } from "@/lib/platform-reports"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const limited = rateLimit(request, "admin-reports", 60, 60_000)
  if (limited) return limited

  const auth = await requireAdminPermissionAsync(request, "reports")
  if ("error" in auth) return auth.error

  try {
    const { core, modules, platform } = await listAdminSnapshot(auth.supabase)
    const report = buildExecutiveReport({ ...platform, ...modules, ...core })
    return NextResponse.json({ report, _admin: auth.session })
  } catch (error: any) {
    return jsonError(error.message || "Admin report request failed")
  }
}
