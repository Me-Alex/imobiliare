import { getAdminClient } from "@/lib/admin-api"

type Row = Record<string, any>

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

async function safeRows(table: string, order = "created_at", ascending = false, limit = 500): Promise<Row[]> {
  const supabase = getAdminClient()
  let query = supabase.from(table).select("*").limit(limit)
  if (order) query = query.order(order, { ascending })
  const { data, error } = await query
  if (error) return []
  return asRows(data)
}

export async function listAdminCore() {
  const [leads, rawProperties, rawAppointments, audit] = await Promise.all([
    safeRows("leads", "created_at", false, 500),
    safeRows("properties", "updated_at", false, 500),
    safeRows("appointments", "created_at", false, 500),
    safeRows("admin_audit_log", "created_at", false, 500),
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

export async function listAdminModules() {
  const rows = await safeRows("admin_modules", "updated_at", false, 1000)
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

export async function listAdminPlatform() {
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
    safeRows("client_profiles", "updated_at", false, 500),
    safeRows("client_favorites", "created_at", false, 500),
    safeRows("client_documents", "created_at", false, 500),
    safeRows("property_offers", "created_at", false, 500),
    safeRows("cms_entries", "updated_at", false, 500),
    safeRows("zone_poi", "score", false, 500),
    safeRows("admin_roles", "updated_at", false, 500),
    safeRows("lead_history", "created_at", false, 500),
    safeRows("client_activity", "created_at", false, 500),
    safeRows("client_notifications", "created_at", false, 500),
    safeRows("appointment_slots", "starts_at", true, 500),
    safeRows("admin_audit_log", "created_at", false, 500),
    safeRows("admin_notification_outbox", "created_at", false, 500),
    safeRows("property_media", "sort_order", true, 1000),
    safeRows("admin_provider_jobs", "created_at", false, 500),
    safeRows("admin_invoices", "created_at", false, 500),
    safeRows("admin_commissions", "created_at", false, 500),
    safeRows("admin_document_templates", "updated_at", false, 500),
    safeRows("admin_document_versions", "created_at", false, 500),
    safeRows("owner_reports", "created_at", false, 500),
    safeRows("calendar_sync_events", "created_at", false, 500),
    safeRows("analytics_attribution", "created_at", false, 1000),
    safeRows("admin_bulk_imports", "created_at", false, 200),
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

export async function listAdminSnapshot() {
  const [core, modules, platform] = await Promise.all([listAdminCore(), listAdminModules(), listAdminPlatform()])
  return { core, modules, platform }
}
