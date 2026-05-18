import { getAdminClient, getEnv, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { processProviderJobs } from "@/lib/provider-jobs"
import { NextResponse } from "next/server"

export const runtime = "edge"

function bearer(request: Request) {
  const header = request.headers.get("authorization") || ""
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : ""
}

type ResolvedJobAuth = { supabase: any; actor: string } | { error: Response }

async function resolveSupabase(request: Request): Promise<ResolvedJobAuth> {
  const cronSecret = getEnv("PROVIDER_CRON_SECRET") || getEnv("CRON_SECRET")
  if (cronSecret && bearer(request) === cronSecret) {
    return { supabase: getAdminClient(), actor: "provider-cron" }
  }

  const auth = await requireAdminPermissionAsync(request, "integrations")
  if (auth.error) return { error: auth.error }
  return { supabase: auth.supabase, actor: auth.session.actor }
}

export async function POST(request: Request) {
  try {
    const resolved = await resolveSupabase(request)
    if ("error" in resolved) return resolved.error

    const body = await request.json().catch(() => ({}))
    const result = await processProviderJobs({
      supabase: resolved.supabase,
      actor: resolved.actor,
      limit: Number(body.limit || 20),
      maxAttempts: Number(body.max_attempts || 5),
    })
    return NextResponse.json(result)
  } catch (error: any) {
    return jsonError(error.message || "Provider job processing failed", 500)
  }
}

export async function GET(request: Request) {
  try {
    const resolved = await resolveSupabase(request)
    if ("error" in resolved) return resolved.error

    const { data, error } = await resolved.supabase
      .from("admin_provider_jobs")
      .select("status,provider,action,created_at,next_attempt_at,error")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ jobs: data || [] })
  } catch (error: any) {
    return jsonError(error.message || "Provider job status failed", 500)
  }
}
