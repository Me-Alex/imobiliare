"use client"

import { useEffect, useMemo, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"
import { supabase } from "@/lib/supabase"
import { AppointmentsView, CrmView, Overview, PropertiesView } from "./admin-core-views"
import { AgentsView, ClientsView, ComplianceView, DocumentsCenterView, ListingsView, MaintenanceView, MarketingView, TransactionsView } from "./admin-real-estate-views"
import { OperationsView } from "./admin-operations"
import { AuditView, ContentView, ReportsView, SettingsView, ToolsView, UsersView } from "./admin-secondary-views"
import { AccountingView, AnalyticsOpsView, BulkOpsView, CalendarOpsView, IntegrationsView, MarketDataView, MediaView, OwnerPortalAdminView } from "./admin-upgrade-views"
import { Banner, Button, LoadingState, MiniStat, NavButton } from "./admin-ui"
import { apiJson, csv, defaultCore, defaultModules, matches, nav, slugify, type ModuleType, type Row, type View } from "./admin-shared"

export default function AdminCommandCenter() {
  const [view, setView] = useState<View>("overview")
  const [query, setQuery] = useState("")
  const [core, setCore] = useState(defaultCore)
  const [modules, setModules] = useState(defaultModules)
  const [platform, setPlatform] = useState<Row>({})
  const [report, setReport] = useState<Row>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [adminEmail, setAdminEmail] = useState("")

  const load = async (mode: "initial" | "refresh" = "refresh") => {
    mode === "initial" ? setLoading(true) : setRefreshing(true)
    setError("")
    const [coreResult, modulesResult, platformResult, reportResult] = await Promise.allSettled([
      apiJson<Row>("/api/admin/data"),
      apiJson<Row>("/api/admin/modules"),
      apiJson<Row>("/api/admin/platform"),
      apiJson<Row>("/api/admin/reports"),
    ])
    const errors: string[] = []
    if (coreResult.status === "fulfilled") setCore({ ...defaultCore, ...coreResult.value })
    else errors.push(coreResult.reason?.message || "Nu am putut incarca datele principale.")
    if (modulesResult.status === "fulfilled") setModules({ ...defaultModules, ...modulesResult.value, settings: { ...defaultModules.settings, ...(modulesResult.value.settings || {}) } })
    else errors.push(modulesResult.reason?.message || "Nu am putut incarca modulele.")
    if (platformResult.status === "fulfilled") setPlatform(platformResult.value || {})
    else errors.push(platformResult.reason?.message || "Nu am putut incarca platforma.")
    if (reportResult.status === "fulfilled") setReport(reportResult.value.report || {})
    else errors.push(reportResult.reason?.message || "Nu am putut incarca raportul.")
    if (errors.length) {
      const unique = Array.from(new Set(errors.map((item) => item.replace(/^TypeError:\s*/i, "").trim()).filter(Boolean)))
      const offline = unique.every((item) => item.toLowerCase().includes("fetch failed") || item.toLowerCase().includes("nu a raspuns la timp"))
      setError(offline ? "API-urile admin locale nu au raspuns. Interfata ramane disponibila; datele live se incarca dupa ce mediul are acces la Supabase." : unique.join(" "))
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (!session?.access_token) {
        window.location.href = "/admin/login"
        return
      }
      setAdminEmail(session.user.email || "")
      load("initial")
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token) window.location.href = "/admin/login"
      else setAdminEmail(session.user.email || "")
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const filtered = useMemo(() => ({
    leads: core.leads.filter((row) => matches(row, query)),
    properties: core.properties.filter((row) => matches(row, query)),
    appointments: core.appointments.filter((row) => matches(row, query)),
    audit: [...core.audit, ...(platform.admin_audit_log || [])].filter((row) => matches(row, query)),
    paymentPlans: modules.payment_plans.filter((row) => matches(row, query)),
    projects: modules.projects.filter((row) => matches(row, query)),
    teamUsers: modules.team_users.filter((row) => matches(row, query)),
    owners: modules.owners.filter((row) => matches(row, query)),
    documents: modules.documents.filter((row) => matches(row, query)),
    notifications: modules.notifications.filter((row) => matches(row, query)),
    activities: modules.activities.filter((row) => matches(row, query)),
    maintenance: modules.activities.filter((row) => matches(row, query) && [row.entity, row.type, row.category, row.title].some((value) => String(value || "").toLowerCase().includes("maintenance"))),
    clients: (platform.client_profiles || []).filter((row: Row) => matches(row, query)),
    offers: (platform.property_offers || []).filter((row: Row) => matches(row, query)),
    slots: (platform.appointment_slots || []).filter((row: Row) => matches(row, query)),
    clientDocuments: (platform.client_documents || []).filter((row: Row) => matches(row, query)),
    documentVersions: (platform.admin_document_versions || []).filter((row: Row) => matches(row, query)),
    cms: (platform.cms_entries || []).filter((row: Row) => matches(row, query)),
    zones: (platform.zone_poi || []).filter((row: Row) => matches(row, query)),
    roles: (platform.admin_roles || []).filter((row: Row) => matches(row, query)),
    outbox: (platform.admin_notification_outbox || []).filter((row: Row) => matches(row, query)),
    media: (platform.property_media || []).filter((row: Row) => matches(row, query)),
    providerJobs: (platform.admin_provider_jobs || []).filter((row: Row) => matches(row, query)),
    providerEvents: (platform.admin_provider_events || []).filter((row: Row) => matches(row, query)),
    invoices: (platform.admin_invoices || []).filter((row: Row) => matches(row, query)),
    commissions: (platform.admin_commissions || []).filter((row: Row) => matches(row, query)),
    ownerReports: (platform.owner_reports || []).filter((row: Row) => matches(row, query)),
    attribution: (platform.analytics_attribution || []).filter((row: Row) => matches(row, query)),
    rateLimits: (platform.rate_limits || []).filter((row: Row) => matches(row, query)),
  }), [core, modules, platform, query])

  const metrics = useMemo(() => {
    const published = core.properties.filter((row) => row.status === "PUBLISHED")
    const activeLeads = core.leads.filter((row) => !["CLOSED", "LOST"].includes(row.status))
    const portfolio = published.reduce((sum, row) => sum + Number(row.price || 0), 0)
    const pipeline = (platform.property_offers || []).reduce((sum: number, row: Row) => sum + Number(row.counter_offer || row.offer_price || 0), 0)
    const occupied = core.properties.filter((row) => ["SOLD", "RENTED"].includes(String(row.status || "")))
    const scheduledTours = core.appointments.filter((row) => ["REQUESTED", "CONFIRMED"].includes(String(row.status || "")))
    const allDocuments = [...modules.documents, ...((platform.client_documents || []) as Row[])]
    const pendingContracts = allDocuments.filter((row) => {
      const label = `${row.type || ""} ${row.title || ""}`.toLowerCase()
      return label.includes("contract") && !["APPROVED", "SIGNED", "VALID"].includes(String(row.status || ""))
    })
    const monthlyRevenue = modules.payment_plans.reduce((sum, row) => sum + Number(row.advance || row.total || 0), 0)
    const occupancyRate = core.properties.length ? Math.round((occupied.length / core.properties.length) * 100) : 0
    return { published, activeLeads, portfolio, pipeline, occupied, occupancyRate, scheduledTours, pendingContracts, monthlyRevenue }
  }, [core, modules, platform])

  const save = async (id: string, action: () => Promise<void>, success: string) => {
    setSaving(id)
    setError("")
    setNotice("")
    try {
      await action()
      setNotice(success)
    } catch (err: any) {
      setError(err?.message || "Actiunea a esuat.")
    } finally {
      setSaving("")
    }
  }

  const patchLead = (lead: Row, status: string) => save(`lead-${lead.id}`, async () => {
    const data = await apiJson<Row>(`/api/admin/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    setCore((prev) => ({ ...prev, leads: prev.leads.map((row) => row.id === lead.id ? data.lead : row) }))
  }, "Lead actualizat.")

  const followUp = (lead: Row) => save(`follow-${lead.id}`, async () => {
    await apiJson("/api/admin/crm", { method: "POST", body: JSON.stringify({ lead_id: lead.id, phone: lead.phone, status: lead.status, note: `Follow-up programat pentru ${lead.name || lead.phone || "lead"}.` }) })
    await load()
  }, "Follow-up CRM adaugat.")

  const patchAppointment = (appointment: Row, status: string) => save(`appointment-${appointment.id}`, async () => {
    const data = await apiJson<Row>(`/api/admin/appointments/${appointment.id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    setCore((prev) => ({ ...prev, appointments: prev.appointments.map((row) => row.id === appointment.id ? data.appointment : row) }))
  }, "Programare actualizata.")

  const patchProperty = (property: Row, payload: Row) => save(`property-${property.id}`, async () => {
    const data = await apiJson<Row>(`/api/admin/properties/${property.id}`, { method: "PATCH", body: JSON.stringify(payload) })
    setCore((prev) => ({ ...prev, properties: prev.properties.map((row) => row.id === property.id ? data.property : row) }))
  }, "Proprietate actualizata.")

  const deleteProperty = (property: Row) => save(`delete-${property.id}`, async () => {
    await apiJson(`/api/admin/properties/${property.id}`, { method: "DELETE" })
    setCore((prev) => ({ ...prev, properties: prev.properties.filter((row) => row.id !== property.id) }))
  }, "Proprietate stearsa.")

  const createProperty = (payload: Row) => save("create-property", async () => {
    await apiJson("/api/admin/properties", { method: "POST", body: JSON.stringify({ ...payload, slug: payload.slug || slugify(payload.title || "proprietate") }) })
    await load()
  }, "Proprietate creata.")

  const saveModule = (type: ModuleType, payload: Row) => save(`${type}-save`, async () => {
    await apiJson("/api/admin/modules", { method: "POST", body: JSON.stringify({ type, payload }) })
    await load()
  }, "Modul salvat.")

  const deleteModule = (type: ModuleType, id: string) => save(`${type}-${id}`, async () => {
    await apiJson(`/api/admin/modules?type=${type}&id=${id}`, { method: "DELETE" })
    await load()
  }, "Intrare stearsa.")

  const platformAction = (id: string, body: Row, success: string) => save(id, async () => {
    await apiJson("/api/admin/platform", { method: "POST", body: JSON.stringify(body) })
    await load()
  }, success)

  const saveSettings = (payload: Row) => save("settings", async () => {
    await apiJson("/api/admin/modules", { method: "POST", body: JSON.stringify({ type: "settings", payload }) })
    setModules((prev) => ({ ...prev, settings: payload }))
  }, "Setari salvate.")

  const exportLocalCsv = () => {
    const rows = [
      ["tip", "nume", "status", "data", "detalii"],
      ...core.leads.map((row) => ["lead", row.name, row.status, row.created_at, row.phone || row.email || ""]),
      ...core.properties.map((row) => ["proprietate", row.title, row.status, row.created_at, `${row.city || ""} ${row.price || ""}`]),
      ...core.appointments.map((row) => ["programare", row.client_name, row.status || "REQUESTED", row.requested_at, row.property_title || ""]),
    ]
    const url = URL.createObjectURL(new Blob([csv(rows)], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "admin-export.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportServer = (format: "csv" | "json") => save(`export-${format}`, async () => {
    const body = await apiJson<any>(`/api/admin/export?format=${format}`)
    const content = typeof body === "string" ? body : JSON.stringify(body, null, 2)
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `hqs-export.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }, "Export generat.")
  const title = nav.flatMap((group) => group.items).find((item) => item.id === view)?.label || "Admin"

  const renderView = () => {
    if (loading) return <LoadingState />
    const props = { filtered, core, modules, platform, report, metrics, saving, setView, reload: load, patchLead, followUp, patchAppointment, patchProperty, deleteProperty, createProperty, saveModule, deleteModule, platformAction, saveSettings, exportLocalCsv, exportServer }
    if (view === "properties") return <PropertiesView {...props} />
    if (view === "listings") return <ListingsView {...props} />
    if (view === "media") return <MediaView {...props} />
    if (view === "crm") return <CrmView {...props} />
    if (view === "clients") return <ClientsView {...props} />
    if (view === "appointments") return <AppointmentsView {...props} />
    if (view === "calendar") return <CalendarOpsView {...props} />
    if (view === "agents") return <AgentsView {...props} />
    if (view === "transactions") return <TransactionsView {...props} />
    if (view === "accounting") return <AccountingView {...props} />
    if (view === "maintenance") return <MaintenanceView {...props} />
    if (view === "documents") return <DocumentsCenterView {...props} />
    if (view === "marketing") return <MarketingView {...props} />
    if (view === "operations") return <OperationsView {...props} />
    if (view === "bulk") return <BulkOpsView {...props} />
    if (view === "integrations") return <IntegrationsView {...props} />
    if (view === "content") return <ContentView {...props} />
    if (view === "reports") return <ReportsView {...props} />
    if (view === "analytics") return <AnalyticsOpsView {...props} />
    if (view === "marketData") return <MarketDataView {...props} />
    if (view === "ownerPortal") return <OwnerPortalAdminView {...props} />
    if (view === "compliance") return <ComplianceView {...props} />
    if (view === "users") return <UsersView {...props} />
    if (view === "tools") return <ToolsView {...props} />
    if (view === "settings") return <SettingsView {...props} />
    if (view === "audit") return <AuditView {...props} />
    return <Overview {...props} />
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <aside className="border-b border-bg-surface bg-bg-card/95 md:fixed md:inset-y-0 md:left-0 md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 p-4 md:p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent font-black text-bg-primary">H</span>
          <div><p className="font-black">HQS Admin</p><p className="text-xs text-text-muted">control panel</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-y border-bg-surface p-4">
          <MiniStat label="leaduri" value={core.leads.length} />
          <MiniStat label="active" value={metrics.activeLeads.length} />
          <MiniStat label="tasks" value={modules.activities.length} />
        </div>
        <nav className="flex gap-2 overflow-x-auto p-3 md:block md:space-y-6 md:p-4">
          {nav.map((group) => (
            <div key={group.group} className="flex shrink-0 gap-2 md:block md:space-y-2">
              <p className="hidden px-3 text-xs font-black uppercase text-text-muted md:block">{group.group}</p>
              {group.items.map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />)}
            </div>
          ))}
        </nav>
      </aside>

      <main className="md:ml-72">
        <header className="sticky top-0 z-20 border-b border-bg-surface bg-bg-card/95 backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-4 xl:flex-row xl:items-center xl:justify-between xl:px-6">
            <div><p className="text-xs font-black uppercase tracking-wide text-text-muted">HQS Imobiliare</p><h1 className="text-2xl font-black">{title}</h1></div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-0 flex-1 sm:min-w-[360px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">S</span>
                <input className="form-input h-10 w-full !pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cauta in admin..." />
              </label>
              <ThemeToggle />
              <Button variant="ghost" onClick={() => load()} disabled={refreshing}>{refreshing ? "Refresh..." : "Refresh"}</Button>
              <Button onClick={exportLocalCsv}>CSV</Button>
              {adminEmail && <span className="rounded-lg border border-bg-surface px-3 py-2 text-xs font-black text-text-muted">{adminEmail}</span>}
              <Button variant="ghost" onClick={() => fetch("/api/admin/session", { method: "DELETE" }).finally(() => supabase.auth.signOut().then(() => { window.location.href = "/admin/login" }))}>Logout</Button>
              <a className="inline-flex h-10 items-center rounded-lg border border-bg-surface px-3 text-sm font-bold" href="/">Site</a>
            </div>
          </div>
        </header>
        <div className="space-y-6 px-4 py-6 xl:px-6">
          {error && <Banner tone="error">{error}</Banner>}
          {notice && <Banner tone="success">{notice}</Banner>}
          {renderView()}
        </div>
      </main>
    </div>
  )
}
