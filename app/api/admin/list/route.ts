import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

type TableConfig = {
  table: string
  permission: string
  order: string
  search: string[]
  maxPageSize?: number
}

const tables: Record<string, TableConfig> = {
  leads: { table: "leads", permission: "leads", order: "created_at", search: ["name", "email", "phone", "status", "source"] },
  properties: { table: "properties", permission: "properties", order: "updated_at", search: ["title", "slug", "city", "status", "type", "owner_email", "agent_email"] },
  appointments: { table: "appointments", permission: "appointments", order: "created_at", search: ["client_name", "client_email", "client_phone", "property_title", "status", "agent_email"] },
  slots: { table: "appointment_slots", permission: "slots", order: "starts_at", search: ["agent_email", "status", "notes"] },
  media: { table: "property_media", permission: "media", order: "sort_order", search: ["path", "kind", "alt", "review_status"] },
  documents: { table: "client_documents", permission: "documents", order: "created_at", search: ["title", "type", "status", "notes"] },
  invoices: { table: "admin_invoices", permission: "accounting", order: "created_at", search: ["client_email", "client_name", "status", "stripe_invoice_id"] },
  provider_jobs: { table: "admin_provider_jobs", permission: "integrations", order: "created_at", search: ["provider", "action", "status", "target", "error"] },
  provider_events: { table: "admin_provider_events", permission: "integrations", order: "received_at", search: ["provider", "event_id", "event_type"] },
  owners: { table: "owner_reports", permission: "owners", order: "created_at", search: ["owner_email", "title", "status", "summary"] },
  roles: { table: "admin_roles", permission: "roles", order: "updated_at", search: ["email", "role", "status"] },
  audit: { table: "admin_audit_log", permission: "audit", order: "created_at", search: ["actor", "action", "entity"] },
  bulk_imports: { table: "admin_bulk_imports", permission: "bulk", order: "created_at", search: ["type", "status", "created_by"] },
  rate_limits: { table: "rate_limits", permission: "analytics", order: "updated_at", search: ["scope", "identifier_hash"] },
}

function clean(value: string | null, fallback = "") {
  return String(value || fallback).trim()
}

function searchTerm(value: string) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim()
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = clean(url.searchParams.get("table"), "leads")
  const config = tables[key]
  if (!config) return jsonError("Tabel admin invalid.", 400)

  const auth = await requireAdminPermissionAsync(request, config.permission)
  if ("error" in auth) return auth.error

  try {
    const page = Math.max(1, Number(url.searchParams.get("page") || 1))
    const maxPageSize = config.maxPageSize || 100
    const pageSize = Math.min(maxPageSize, Math.max(5, Number(url.searchParams.get("page_size") || 25)))
    const requestedSort = clean(url.searchParams.get("sort"))
    const sort = requestedSort && [...config.search, config.order].includes(requestedSort) ? requestedSort : config.order
    const direction = clean(url.searchParams.get("direction"), "desc").toLowerCase() === "asc" ? "asc" : "desc"
    const q = searchTerm(clean(url.searchParams.get("q")))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = auth.supabase.from(config.table).select("*", { count: "exact" })
    if (q) query = query.or(config.search.map((field) => `${field}.ilike.%${q}%`).join(","))
    query = query.order(sort || config.order, { ascending: direction === "asc" }).range(from, to)

    const { data, count, error } = await query
    if (error) return jsonError(error.message, 400)

    return NextResponse.json({
      table: key,
      rows: data || [],
      page,
      page_size: pageSize,
      total: count || 0,
      page_count: Math.max(1, Math.ceil((count || 0) / pageSize)),
      sort: sort || config.order,
      direction,
    })
  } catch (error: any) {
    return jsonError(error.message || "Admin list failed")
  }
}
