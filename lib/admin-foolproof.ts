export type AdminRow = Record<string, any>
export type AdminView = string

export type GuidedAction = {
  id: string
  title: string
  body: string
  view: AdminView
  query?: string
  mark: string
}

export type AdminTask = {
  id: string
  title: string
  meta: string
  view: AdminView
  query?: string
  tone: "danger" | "warn" | "ok" | "neutral"
  cta: string
}

export type ReadinessCheck = {
  id: string
  label: string
  ok: boolean
  detail: string
  view: AdminView
}

export type ViewGuide = {
  title: string
  goal: string
  primary: string
  steps: string[]
  avoid: string[]
}

function rows(value: unknown): AdminRow[] {
  return Array.isArray(value) ? value : []
}

function isOpenStatus(row: AdminRow) {
  return !["CLOSED", "LOST", "DONE", "SOLD", "RENTED", "PAID", "VOID", "CANCELLED"].includes(String(row.status || "").toUpperCase())
}

function ageHours(row: AdminRow) {
  const time = new Date(row.updated_at || row.created_at || 0).getTime()
  return time ? (Date.now() - time) / 3_600_000 : 0
}

export const guidedActions: GuidedAction[] = [
  { id: "property", title: "Add or publish a property", body: "Use the checklist so a listing cannot go live half-finished.", view: "properties", mark: "P" },
  { id: "lead", title: "Work today's leads", body: "Open the CRM queue sorted by urgency, score and stale follow-up.", view: "crm", query: "NEW", mark: "CRM" },
  { id: "media", title: "Fix photos and cover", body: "Upload media, set cover, reorder gallery and add alt text.", view: "media", mark: "IMG" },
  { id: "tour", title: "Schedule or release tours", body: "Check slots, holds, bookings and Google Calendar sync from one screen.", view: "calendar", mark: "CAL" },
  { id: "invoice", title: "Create or chase invoices", body: "Send Stripe invoices, mark paid, resend or void safely.", view: "accounting", mark: "EUR" },
  { id: "import", title: "Import properties in bulk", body: "Preview CSV, import valid rows and rollback if needed.", view: "bulk", mark: "CSV" },
  { id: "owner", title: "Send owner reports", body: "Publish or schedule owner portal reports and review feedback.", view: "ownerPortal", mark: "OWN" },
  { id: "users", title: "Manage admin access", body: "Invite, reset or deactivate admins through RBAC roles.", view: "users", mark: "RBAC" },
]

export const viewGuides: Record<string, ViewGuide> = {
  overview: {
    title: "Start here",
    goal: "Pick the next operational job instead of hunting through the sidebar.",
    primary: "Use Next best actions first, then quick actions.",
    steps: ["Review red/warn tasks", "Open the suggested section", "Finish one workflow and refresh data"],
    avoid: ["Do not export or delete before checking filters", "Do not ignore provider failures"],
  },
  properties: {
    title: "Property editor",
    goal: "Create clean listings that are safe to publish.",
    primary: "Save draft first, then publish only when the checklist is ready.",
    steps: ["Fill basics and price", "Add location, specs and SEO", "Set cover/media before publishing"],
    avoid: ["Publishing without cover", "Missing owner or agent email"],
  },
  media: {
    title: "Media workflow",
    goal: "Make every listing visually complete and searchable.",
    primary: "Upload, set cover, add alt text and reorder gallery.",
    steps: ["Pick property", "Upload media with the right kind", "Set cover and fix NEEDS_ALT items"],
    avoid: ["Deleting the only cover image", "Uploading files to the wrong property"],
  },
  crm: {
    title: "CRM queue",
    goal: "Call the right leads first and record follow-up.",
    primary: "Work HIGH priority and stale leads before browsing all rows.",
    steps: ["Open top lead", "Call or email", "Update status and follow-up"],
    avoid: ["Leaving NEW leads untouched", "Creating clients without contact data"],
  },
  calendar: {
    title: "Calendar",
    goal: "Keep slots and actual appointments aligned.",
    primary: "Use the week board, then sync confirmed events.",
    steps: ["Check available/held/booked slots", "Release stale holds", "Sync confirmed appointments"],
    avoid: ["Double booking one agent", "Deleting booked slots without checking appointment"],
  },
  appointments: {
    title: "Tours",
    goal: "Make booking state explicit.",
    primary: "Use status updates and slot controls instead of manual notes.",
    steps: ["Confirm request", "Attach/adjust slot", "Move to DONE or CANCELLED"],
    avoid: ["Leaving held slots forever", "Cancelling without freeing slot"],
  },
  accounting: {
    title: "Accounting",
    goal: "Keep invoice state auditable.",
    primary: "Use Paid, Resend or Void actions instead of editing raw status.",
    steps: ["Create invoice", "Watch unpaid status", "Mark paid or void with confirmation"],
    avoid: ["Voiding active invoices accidentally", "Resending to empty email"],
  },
  integrations: {
    title: "Integrations",
    goal: "Make external provider failures recoverable.",
    primary: "Process due jobs, retry provider failures, cancel only when obsolete.",
    steps: ["Check provider status", "Process due jobs", "Retry or cancel failed jobs"],
    avoid: ["Retrying missing credentials repeatedly", "Cancelling jobs without checking target"],
  },
  documents: {
    title: "Documents",
    goal: "Keep private documents private and reviewable.",
    primary: "Upload through private storage, then approve/reject in review.",
    steps: ["Pick client", "Upload private file", "Review status and expiry"],
    avoid: ["Using public URLs for sensitive files", "Approving expired documents"],
  },
  bulk: {
    title: "Bulk import",
    goal: "Import many listings without losing control.",
    primary: "Preview first, import only valid rows, rollback with confirmation.",
    steps: ["Paste CSV", "Preview and fix errors", "Import and keep import record"],
    avoid: ["Skipping preview", "Rolling back the wrong import"],
  },
  users: {
    title: "RBAC",
    goal: "Give each admin the minimum access needed.",
    primary: "Invite with explicit permissions and deactivate unused accounts.",
    steps: ["Set email", "Choose role and permissions", "Reset or deactivate from role table"],
    avoid: ["Giving all permissions by default", "Leaving inactive users ACTIVE"],
  },
}

export function guideForView(view: string): ViewGuide {
  return viewGuides[view] || {
    title: "Guided page",
    goal: "Finish one workflow at a time and use refresh after changes.",
    primary: "Use the primary form first, then review the table below.",
    steps: ["Check filters", "Make one change", "Refresh and confirm state"],
    avoid: ["Changing multiple unknown records at once", "Ignoring warnings"],
  }
}

export function buildAdminTasks(core: AdminRow, modules: AdminRow, platform: AdminRow, metrics: AdminRow): AdminTask[] {
  const properties = rows(core.properties)
  const leads = rows(core.leads)
  const appointments = rows(core.appointments)
  const documents = [...rows(modules.documents), ...rows(platform.client_documents)]
  const providerJobs = rows(platform.admin_provider_jobs)
  const invoices = rows(platform.admin_invoices)
  const media = rows(platform.property_media)
  const runtimeHealth = platform.runtime_health || {}

  const failedJobs = providerJobs.filter((row) => String(row.status || "").includes("FAILED"))
  const staleLeads = rows(metrics.activeLeads).filter((row) => ageHours(row) >= 24)
  const newLeads = leads.filter((row) => String(row.status || "NEW").toUpperCase() === "NEW")
  const draftProperties = properties.filter((row) => String(row.status || "").toUpperCase() === "DRAFT")
  const missingCover = properties.filter((row) => !row.cover_image_url && !row.cover_image && !["SOLD", "RENTED"].includes(String(row.status || "").toUpperCase()))
  const needsAlt = media.filter((row) => String(row.review_status || "").toUpperCase() === "NEEDS_ALT" || !row.alt)
  const pendingDocs = documents.filter((row) => !["APPROVED", "SIGNED", "VALID"].includes(String(row.status || "").toUpperCase()))
  const openInvoices = invoices.filter(isOpenStatus)
  const missingRequired = Number(runtimeHealth.summary?.missingRequired || 0)
  const missingOptional = Number(runtimeHealth.summary?.missingOptional || 0)
  const nextTours = appointments.filter((row) => {
    const start = new Date(row.start_at || row.requested_at || 0).getTime()
    return start && start >= Date.now() && start <= Date.now() + 7 * 24 * 60 * 60 * 1000
  })

  const tasks: AdminTask[] = [
    missingRequired ? { id: "missing-required-env", title: `${missingRequired} required secret(s) missing`, meta: "Admin/service features are running degraded until Cloudflare runtime secrets are configured.", view: "integrations", query: "missing", tone: "danger", cta: "Open readiness" } : null,
    !missingRequired && missingOptional ? { id: "missing-provider-env", title: `${missingOptional} provider variable(s) missing`, meta: "Provider actions fail safely, but email/SMS/signature/invoice automation is incomplete.", view: "integrations", query: "missing", tone: "warn", cta: "Check providers" } : null,
    failedJobs.length ? { id: "failed-jobs", title: `${failedJobs.length} provider job(s) failed`, meta: "Retry or cancel before customers notice missing email/SMS/calendar events.", view: "integrations", query: "FAILED", tone: "danger", cta: "Fix integrations" } : null,
    staleLeads.length ? { id: "stale-leads", title: `${staleLeads.length} stale lead(s) need follow-up`, meta: "Older than 24h and still active.", view: "crm", query: "NEW", tone: "warn", cta: "Open CRM queue" } : null,
    newLeads.length ? { id: "new-leads", title: `${newLeads.length} new lead(s) waiting`, meta: "Start with phone-ready and high-score leads.", view: "crm", query: "NEW", tone: "warn", cta: "Call leads" } : null,
    draftProperties.length ? { id: "drafts", title: `${draftProperties.length} draft listing(s)`, meta: "Complete checklist before publishing.", view: "properties", query: "DRAFT", tone: "neutral", cta: "Finish listings" } : null,
    missingCover.length ? { id: "missing-cover", title: `${missingCover.length} listing(s) missing cover`, meta: "Cover images are the most common publish blocker.", view: "media", query: "cover", tone: "warn", cta: "Fix media" } : null,
    needsAlt.length ? { id: "needs-alt", title: `${needsAlt.length} media item(s) need alt text`, meta: "Improves SEO, accessibility and publish quality.", view: "media", query: "NEEDS_ALT", tone: "neutral", cta: "Review media" } : null,
    pendingDocs.length ? { id: "pending-docs", title: `${pendingDocs.length} document(s) need review`, meta: "Approve, reject or upload missing private files.", view: "documents", query: "PENDING", tone: "warn", cta: "Review docs" } : null,
    openInvoices.length ? { id: "open-invoices", title: `${openInvoices.length} invoice(s) still open`, meta: "Resend, mark paid or void safely.", view: "accounting", query: "SENT", tone: "neutral", cta: "Open accounting" } : null,
    nextTours.length ? { id: "next-tours", title: `${nextTours.length} tour(s) in next 7 days`, meta: "Check slots and sync calendar before visits.", view: "calendar", tone: "ok", cta: "Open calendar" } : null,
  ].filter(Boolean) as AdminTask[]

  return tasks.length ? tasks : [{ id: "clean", title: "No urgent admin blockers", meta: "Use quick actions to create new work or export a report.", view: "overview", tone: "ok", cta: "Stay on dashboard" }]
}

export function buildReadinessChecks(core: AdminRow, platform: AdminRow): ReadinessCheck[] {
  const properties = rows(core.properties)
  const roles = rows(platform.admin_roles)
  const providerJobs = rows(platform.admin_provider_jobs)
  const media = rows(platform.property_media)
  const documents = rows(platform.client_documents)
  const runtimeHealth = platform.runtime_health || {}
  const healthSummary = runtimeHealth.summary || {}

  return [
    { id: "runtime", label: "Runtime secrets ready", ok: Number(healthSummary.missingRequired || 0) === 0, detail: `${healthSummary.configuredRequired || 0}/${healthSummary.required || 0} required`, view: "integrations" },
    { id: "providers", label: "Providers configured", ok: Number(healthSummary.readyProviders || 0) >= Number(healthSummary.totalProviders || 1), detail: `${healthSummary.readyProviders || 0}/${healthSummary.totalProviders || 0} providers`, view: "integrations" },
    { id: "rbac", label: "RBAC configured", ok: roles.some((row) => String(row.status || "").toUpperCase() === "ACTIVE"), detail: `${roles.length} role(s)`, view: "users" },
    { id: "media", label: "Media ready", ok: properties.every((row) => row.cover_image_url || row.cover_image || ["SOLD", "RENTED"].includes(String(row.status || "").toUpperCase())), detail: `${media.length} media item(s)`, view: "media" },
    { id: "provider-jobs", label: "Provider queue clean", ok: !providerJobs.some((row) => String(row.status || "").includes("FAILED")), detail: `${providerJobs.length} job(s)`, view: "integrations" },
    { id: "documents", label: "Documents tracked", ok: documents.length > 0, detail: `${documents.length} client doc(s)`, view: "documents" },
    { id: "inventory", label: "Inventory active", ok: properties.length > 0, detail: `${properties.length} listing(s)`, view: "properties" },
  ]
}
