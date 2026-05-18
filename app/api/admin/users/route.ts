import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

function permissions(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean)
}

function role(value: unknown) {
  const next = String(value || "agent").toLowerCase()
  return ["admin", "manager", "agent"].includes(next) ? next : "agent"
}

async function queueNotice(supabase: any, actor: string, target: string, subject: string, body: string) {
  if (!target) return null
  const inserted = await supabase.from("admin_notification_outbox").insert({
    channel: "EMAIL",
    target,
    subject,
    body,
    status: "QUEUED",
    entity: "admin_roles",
    created_by: actor,
    updated_at: new Date().toISOString(),
  }).select("*").maybeSingle()
  return inserted.data || null
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "roles")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || "invite").toLowerCase()
    const email = String(body.email || body.payload?.email || "").trim().toLowerCase()
    if (!email.includes("@")) return jsonError("Email admin invalid.", 400)

    if (action === "deactivate") {
      const { data, error } = await auth.supabase.from("admin_roles").update({ status: "INACTIVE", updated_at: new Date().toISOString() }).eq("email", email).select("*").single()
      if (error) return jsonError(error.message, 400)
      await auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "ADMIN_ROLE_DEACTIVATED", entity: "admin_roles", entity_id: data.id, details: data, metadata: data })
      return NextResponse.json({ role: data })
    }

    if (action === "reset") {
      const notice = await queueNotice(auth.supabase, auth.session.actor, email, "Reset acces admin HQS", "Acceseaza /admin/login si foloseste resetarea Supabase pentru contul tau.")
      await auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: "ADMIN_RESET_NOTICE_QUEUED", entity: "admin_roles", entity_id: email, details: { email }, metadata: { email } })
      return NextResponse.json({ queued: Boolean(notice), notice })
    }

    const next = {
      email,
      role: role(body.role || body.payload?.role),
      permissions: permissions(body.permissions || body.payload?.permissions || "leads,clients,appointments,properties,documents,reports"),
      status: body.status || body.payload?.status || "ACTIVE",
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await auth.supabase.from("admin_roles").upsert(next, { onConflict: "email" }).select("*").single()
    if (error) return jsonError(error.message, 400)
    const notice = action === "invite"
      ? await queueNotice(auth.supabase, auth.session.actor, email, "Ai acces admin HQS", "Acceseaza /admin/login cu contul Supabase asociat acestui email.")
      : null
    await auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: action === "invite" ? "ADMIN_INVITED" : "ADMIN_ROLE_UPSERTED", entity: "admin_roles", entity_id: data.id, details: data, metadata: data })
    return NextResponse.json({ role: data, notice })
  } catch (error: any) {
    return jsonError(error.message || "Admin user action failed")
  }
}
