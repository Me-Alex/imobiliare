import { getAdminClient } from "@/lib/admin-api"

type Row = Record<string, any>
type AdminClient = ReturnType<typeof getAdminClient>

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object") : []
}

function normalizeProperty(row: Row): Row {
  return {
    ...row,
    area_sqm: row.area_sqm ?? row.surface ?? 0,
    bathrooms: row.bathrooms ?? row.baths ?? 0,
    transaction_type: row.transaction_type ?? row.transaction ?? "sale",
    city: row.city ?? row.zone ?? "Bucuresti",
    gallery_urls: Array.isArray(row.gallery_urls) ? row.gallery_urls : [],
    floorplan_urls: Array.isArray(row.floorplan_urls) ? row.floorplan_urls : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
  }
}

async function safeRows(supabase: AdminClient, table: string, order = "created_at", ascending = false, limit = 500): Promise<Row[]> {
  let query = supabase.from(table).select("*").limit(limit)
  if (order) query = query.order(order, { ascending })
  const { data, error } = await query
  if (error) return []
  return asRows(data)
}

export async function listAdminCore(supabase = getAdminClient()) {
  const [leads, rawProperties, rawAppointments, audit] = await Promise.all([
    safeRows(supabase, "leads", "created_at", false, 500),
    safeRows(supabase, "properties", "updated_at", false, 500),
    safeRows(supabase, "appointments", "created_at", false, 500),
    safeRows(supabase, "admin_audit_log", "created_at", false, 500),
  ])
  const properties = rawProperties.map(normalizeProperty)
  const propertyById = new Map(properties.map((property) => [String(property.id), property]))
  const appointments = rawAppointments.map((appointment) => {
    const property = appointment.property_id ? propertyById.get(String(appointment.property_id)) : null
    return {
      ...appointment,
      property_title: appointment.property_title || property?.title || null,
      property_city: appointment.property_city || property?.city || null,
    }
  })
  return { leads, properties, appointments, audit }
}

export async function listAdminModules(supabase = getAdminClient()) {
  const rows = await safeRows(supabase, "admin_modules", "updated_at", false, 1000)
  const grouped: Record<string, Row[]> = {
    payment_plans: [],
    projects: [],
    team_users: [],
    owners: [],
    documents: [],
    notifications: [],
    activities: [],
  }
  let settings: Row = { agency: "HQS Imobiliare", commission: 3, target: 500000, vat: 19, theme: "system" }
  for (const row of rows) {
    const item = { id: row.id, ...(row.payload || {}), type: row.type, status: row.status ?? row.payload?.status, created_at: row.created_at, updated_at: row.updated_at }
    if (row.type === "settings") settings = { ...settings, ...(row.payload || {}) }
    else if (row.type in grouped) grouped[row.type].push(item)
  }
  return { ...grouped, settings }
}

export async function listAdminPlatform(supabase = getAdminClient()) {
  const [
    client_profiles,
    client_favorites,
    client_documents,
    property_offers,
    cms_entries,
    zone_poi,
    admin_roles,
    lead_history,
    client_activity,
    client_notifications,
    appointment_slots,
    admin_audit_log,
    admin_notification_outbox,
    property_media,
    admin_provider_jobs,
    admin_invoices,
    admin_commissions,
    admin_document_templates,
    admin_document_versions,
    owner_reports,
    calendar_sync_events,
    analytics_attribution,
    admin_bulk_imports,
  ] = await Promise.all([
    safeRows(supabase, "client_profiles", "updated_at", false, 500),
    safeRows(supabase, "client_favorites", "created_at", false, 500),
    safeRows(supabase, "client_documents", "created_at", false, 500),
    safeRows(supabase, "property_offers", "created_at", false, 500),
    safeRows(supabase, "cms_entries", "updated_at", false, 500),
    safeRows(supabase, "zone_poi", "score", false, 500),
    safeRows(supabase, "admin_roles", "updated_at", false, 500),
    safeRows(supabase, "lead_history", "created_at", false, 500),
    safeRows(supabase, "client_activity", "created_at", false, 500),
    safeRows(supabase, "client_notifications", "created_at", false, 500),
    safeRows(supabase, "appointment_slots", "starts_at", true, 500),
    safeRows(supabase, "admin_audit_log", "created_at", false, 500),
    safeRows(supabase, "admin_notification_outbox", "created_at", false, 500),
    safeRows(supabase, "property_media", "sort_order", true, 1000),
    safeRows(supabase, "admin_provider_jobs", "created_at", false, 500),
    safeRows(supabase, "admin_invoices", "created_at", false, 500),
    safeRows(supabase, "admin_commissions", "created_at", false, 500),
    safeRows(supabase, "admin_document_templates", "updated_at", false, 500),
    safeRows(supabase, "admin_document_versions", "created_at", false, 500),
    safeRows(supabase, "owner_reports", "created_at", false, 500),
    safeRows(supabase, "calendar_sync_events", "created_at", false, 500),
    safeRows(supabase, "analytics_attribution", "created_at", false, 1000),
    safeRows(supabase, "admin_bulk_imports", "created_at", false, 200),
  ])

  return {
    client_profiles,
    client_favorites,
    client_documents,
    property_offers,
    cms_entries,
    zone_poi,
    admin_roles,
    lead_history,
    client_activity,
    client_notifications,
    appointment_slots,
    admin_audit_log,
    admin_notification_outbox,
    property_media,
    admin_provider_jobs,
    admin_invoices,
    admin_commissions,
    admin_document_templates,
    admin_document_versions,
    owner_reports,
    calendar_sync_events,
    analytics_attribution,
    admin_bulk_imports,
  }
}

export async function listAdminSnapshot(supabase = getAdminClient()) {
  const [core, modules, platform] = await Promise.all([listAdminCore(supabase), listAdminModules(supabase), listAdminPlatform(supabase)])
  return { core, modules, platform }
}
