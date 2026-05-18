import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

type Params = { params: { id: string } }

function nowIso() {
  return new Date().toISOString()
}

async function audit(supabase: any, actor: string, action: string, id: string, details: Record<string, any>) {
  await supabase.from("admin_audit_log").insert({
    actor,
    action,
    entity: "admin_provider_jobs",
    entity_id: id,
    details,
    metadata: details,
  }).then(() => undefined)
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdminPermissionAsync(request, "integrations")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || "retry").toLowerCase()
    const id = params.id
    if (!id) return jsonError("job id lipseste", 400)

    const patch: Record<string, any> = { updated_at: nowIso() }
    if (["retry", "requeue"].includes(action)) {
      patch.status = "QUEUED"
      patch.error = null
      patch.next_attempt_at = nowIso()
      patch.locked_at = null
      patch.locked_by = null
      patch.completed_at = null
    } else if (action === "cancel") {
      patch.status = "CANCELLED"
      patch.error = body.reason || "Cancelled by admin"
      patch.next_attempt_at = null
      patch.locked_at = null
      patch.locked_by = null
    } else {
      return jsonError("Actiune job invalida.", 400)
    }

    const { data, error } = await auth.supabase.from("admin_provider_jobs").update(patch).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)
    await audit(auth.supabase, auth.session.actor, action === "cancel" ? "PROVIDER_JOB_CANCELLED" : "PROVIDER_JOB_REQUEUED", id, { action, patch })
    return NextResponse.json({ job: data })
  } catch (error: any) {
    return jsonError(error.message || "Provider job update failed")
  }
}
