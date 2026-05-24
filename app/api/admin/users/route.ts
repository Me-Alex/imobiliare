import { getAdminClient, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean)
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map(String).map((v) => v.trim()).filter(Boolean)
    } catch {
      // fall through to csv
    }
    return trimmed.split(",").map((v) => v.trim()).filter(Boolean)
  }
  return []
}

const rolePermissions: Record<string, string[]> = {
  admin: ["all"],
  manager: ["properties", "leads", "appointments", "reports", "media", "documents", "accounting"],
  agent: ["properties", "leads", "appointments"],
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "roles")
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => ({}))
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "").trim()
  const role = String(body.role || "agent").trim().toLowerCase()
  const requestedPermissions = normalizePermissions(body.permissions)
  const status = String(body.status || "ACTIVE").trim().toUpperCase()

  if (!email || !email.includes("@")) return jsonError("Email invalid", 400)
  if (password.length < 8) return jsonError("Parola trebuie sa aiba minim 8 caractere.", 400)
  if (!["admin", "manager", "agent"].includes(role)) return jsonError("Rol invalid (admin/manager/agent).", 400)
  if (requestedPermissions.includes("all") && role !== "admin") return jsonError("Permisiunea all este permisa doar pentru rolul admin.", 403)
  const permissions = requestedPermissions.length ? requestedPermissions : rolePermissions[role]

  try {
    const supabase = getAdminClient()
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "admin", created_by: auth.session.actor },
    })
    if (createError) return jsonError(createError.message, 400)

    const userId = created?.user?.id
    const { data: roleRow, error: roleError } = await supabase
      .from("admin_roles")
      .upsert(
        {
          user_id: userId || null,
          email,
          role,
          permissions: permissions.length ? permissions : ["all"],
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      )
      .select("*")
      .single()
    if (roleError) return jsonError(roleError.message, 400)

    await Promise.allSettled([
      supabase.from("admin_audit_log").insert({
        actor: auth.session.actor,
        action: "ADMIN_USER_CREATED",
        entity: "admin_roles",
        entity_id: roleRow.id,
        details: { email, role, permissions: roleRow.permissions },
        metadata: roleRow,
      }),
    ])

    return NextResponse.json({ user: created?.user || null, admin_role: roleRow }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Admin user creation failed")
  }
}
