"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"
import { supabase } from "@/lib/supabase"
import { AppointmentsView, CrmView, Overview, PropertiesView } from "./admin-core-views"
import { AgentsView, ClientsView, ComplianceView, DocumentsCenterView, ListingsView, MaintenanceView, MarketingView, TransactionsView } from "./admin-real-estate-views"
import { OperationsView } from "./admin-operations"
import { AuditView, ContentView, ReportsView, SettingsView, ToolsView, UsersView } from "./admin-secondary-views"
import { AccountingView, AnalyticsOpsView, BulkOpsView, CalendarOpsView, IntegrationsView, MarketDataView, MediaView, OwnerPortalAdminView } from "./admin-upgrade-views"
import { Banner, Button, LoadingState, MiniStat, NavButton } from "./admin-ui"
import { apiJson, csv, defaultCore, defaultModules, matches, nav, slugify, type ModuleType, type Row, type View } from "./admin-shared"

const allNavItems = nav.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group })))
const viewIds = new Set(allNavItems.map((item) => item.id))

function isView(value: string | null): value is View {
  return Boolean(value && viewIds.has(value as View))
}

export default function AdminCommandCenter() {
  const [view, setView] = useState<View>("overview")
  const [query, setQuery] = useState("")
  const [commandQuery, setCommandQuery] = useState("")
  const [commandOpen, setCommandOpen] = useState(false)
  const [core, setCore] = useState(defaultCore)
  const [modules, setModules] = useState(defaultModules)
  const [platform, setPlatform] = useState<Row>({})
  const [report, setReport] = useState<Row>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastLoadedAt, setLastLoadedAt] = useState("")
  const [saving, setSaving] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

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
    setLastLoadedAt(new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }))
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedView = params.get("view") || window.localStorage.getItem("hqs-admin-view")
    if (isView(requestedView)) setView(requestedView)

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen((open) => !open)
      } else if (event.key === "/" && !isTyping) {
        event.preventDefault()
        searchRef.current?.focus()
      } else if (event.key === "Escape") {
        setCommandOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const navigateView = (nextView: View, nextQuery?: string) => {
    setView(nextView)
    if (nextQuery !== undefined) setQuery(nextQuery)
    window.localStorage.setItem("hqs-admin-view", nextView)
    const url = new URL(window.location.href)
    url.searchParams.set("view", nextView)
    window.history.replaceState(null, "", url.toString())
    setCommandOpen(false)
  }

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
    ownerFeedback: (platform.owner_feedback || []).filter((row: Row) => matches(row, query)),
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

  const attention = useMemo(() => {
    const failedJobs = (platform.admin_provider_jobs || []).filter((row: Row) => String(row.status || "").includes("FAILED"))
    const draftProperties = core.properties.filter((row) => String(row.status || "") === "DRAFT")
    const missingCover = core.properties.filter((row) => !row.cover_image_url && !row.cover_image && String(row.status || "") !== "SOLD")
    const staleLeads = metrics.activeLeads.filter((row) => {
      const created = new Date(row.updated_at || row.created_at || 0).getTime()
      return created && Date.now() - created > 24 * 60 * 60 * 1000
    })
    const upcomingTours = metrics.scheduledTours.filter((row) => {
      const startsAt = new Date(row.start_at || row.requested_at || 0).getTime()
      return startsAt && startsAt >= Date.now() && startsAt <= Date.now() + 7 * 24 * 60 * 60 * 1000
    })
    return [
      { label: "Provider failures", value: failedJobs.length, view: "integrations" as View, query: "FAILED", tone: "danger" },
      { label: "Leaduri de sunat", value: staleLeads.length, view: "crm" as View, query: "NEW", tone: "warn" },
      { label: "Drafturi", value: draftProperties.length, view: "properties" as View, query: "DRAFT", tone: "neutral" },
      { label: "Fara cover", value: missingCover.length, view: "media" as View, query: "cover", tone: "warn" },
      { label: "Vizionari 7 zile", value: upcomingTours.length, view: "appointments" as View, query: "", tone: "neutral" },
    ].filter((item) => item.value > 0)
  }, [core.properties, metrics.activeLeads, metrics.scheduledTours, platform.admin_provider_jobs])

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

  const commands = useMemo(() => {
    const navCommands = allNavItems.map((item) => ({
      id: `view-${item.id}`,
      title: item.label,
      meta: `${item.group} / deschide sectiunea`,
      mark: item.mark,
      run: () => navigateView(item.id),
    }))
    const actionCommands = [
      { id: "refresh", title: "Refresh data", meta: "Reincarca toate API-urile admin", mark: "R", run: () => void load() },
      { id: "new-property", title: "Creeaza proprietate", meta: "Mergi la editorul de proprietati", mark: "P", run: () => navigateView("properties", "") },
      { id: "lead-followup", title: "Leaduri de sunat", meta: "Filtreaza CRM pe leaduri noi", mark: "CRM", run: () => navigateView("crm", "NEW") },
      { id: "drafts", title: "Proprietati draft", meta: "Filtreaza proprietatile nepublicate", mark: "D", run: () => navigateView("properties", "DRAFT") },
      { id: "provider-errors", title: "Erori integrari", meta: "Arata joburile provider esuate", mark: "ERR", run: () => navigateView("integrations", "FAILED") },
      { id: "bulk-import", title: "Import CSV proprietati", meta: "Deschide bulk operations", mark: "CSV", run: () => navigateView("bulk") },
      { id: "market-data", title: "Actualizeaza Market Data", meta: "Pret/mp, randament, risc zona", mark: "MD", run: () => navigateView("marketData") },
      { id: "export", title: "Export CSV local", meta: "Descarca snapshot leaduri/proprietati/programari", mark: "EX", run: exportLocalCsv },
    ]
    const q = commandQuery.trim().toLowerCase()
    return [...actionCommands, ...navCommands].filter((command) => !q || `${command.title} ${command.meta} ${command.mark}`.toLowerCase().includes(q)).slice(0, 14)
  }, [commandQuery, core.leads, core.properties, core.appointments, platform])

  const title = allNavItems.find((item) => item.id === view)?.label || "Admin"

  const renderView = () => {
    if (loading) return <LoadingState />
    const props = { filtered, core, modules, platform, report, metrics, saving, setView: navigateView, reload: load, patchLead, followUp, patchAppointment, patchProperty, deleteProperty, createProperty, saveModule, deleteModule, platformAction, saveSettings, exportLocalCsv, exportServer }
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
        <div className="border-t border-bg-surface px-4 pb-4">
          <button type="button" onClick={() => setCommandOpen(true)} className="flex h-11 w-full items-center justify-between rounded-lg border border-bg-surface bg-bg-secondary px-3 text-left text-sm font-bold text-text-muted transition hover:border-accent hover:text-accent">
            <span>Comenzi rapide</span>
            <kbd className="rounded border border-bg-surface bg-bg-card px-2 py-1 text-[10px] font-black">Ctrl K</kbd>
          </button>
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
              {group.items.map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => navigateView(item.id)} />)}
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
                <input ref={searchRef} className="form-input h-10 w-full !pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cauta in admin... apasa /" />
              </label>
              <Button variant="ghost" onClick={() => setCommandOpen(true)}>Ctrl K</Button>
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
          <AdminWorkbar attention={attention} lastLoadedAt={lastLoadedAt} refreshing={refreshing} navigateView={navigateView} clearSearch={() => setQuery("")} query={query} />
          {renderView()}
        </div>
      </main>
      {commandOpen && <CommandPalette commands={commands} query={commandQuery} setQuery={setCommandQuery} close={() => setCommandOpen(false)} />}
    </div>
  )
}

function AdminWorkbar({ attention, lastLoadedAt, refreshing, navigateView, clearSearch, query }: { attention: Array<{ label: string; value: number; view: View; query: string; tone: string }>; lastLoadedAt: string; refreshing: boolean; navigateView: (view: View, query?: string) => void; clearSearch: () => void; query: string }) {
  const toneClass: Record<string, string> = {
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-500",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    neutral: "border-bg-surface bg-bg-secondary text-text-primary",
  }

  return (
    <div className="rounded-lg border border-bg-surface bg-bg-card p-3 shadow-card">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-accent/12 px-3 py-2 text-xs font-black uppercase text-accent">Focus</span>
          {attention.length ? attention.map((item) => (
            <button key={item.label} type="button" onClick={() => navigateView(item.view, item.query)} className={`rounded-lg border px-3 py-2 text-sm font-black ${toneClass[item.tone] || toneClass.neutral}`}>
              {item.label}: {item.value}
            </button>
          )) : <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-black text-emerald-600">Nu exista alerte active</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-text-muted">
          {query && <button type="button" onClick={clearSearch} className="rounded-lg border border-bg-surface px-3 py-2 text-text-primary hover:border-accent hover:text-accent">Clear search: {query}</button>}
          <span className="rounded-lg border border-bg-surface px-3 py-2">{refreshing ? "Refreshing..." : lastLoadedAt ? `Actualizat ${lastLoadedAt}` : "In curs de incarcare"}</span>
          <span className="rounded-lg border border-bg-surface px-3 py-2">/: cautare</span>
          <span className="rounded-lg border border-bg-surface px-3 py-2">Ctrl+K: comenzi</span>
        </div>
      </div>
    </div>
  )
}

function CommandPalette({ commands, query, setQuery, close }: { commands: Array<{ id: string; title: string; meta: string; mark: string; run: () => void }>; query: string; setQuery: (value: string) => void; close: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary/70 px-4 py-10 backdrop-blur-sm" onMouseDown={close}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-bg-surface bg-bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="border-b border-bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-accent">Command palette</p>
              <h2 className="text-xl font-black">Unde vrei sa mergi?</h2>
            </div>
            <button type="button" onClick={close} className="rounded-lg border border-bg-surface px-3 py-2 text-sm font-black text-text-muted hover:text-text-primary">Esc</button>
          </div>
          <input ref={inputRef} className="form-input mt-4 h-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cauta sectiuni sau actiuni: leaduri, media, import, erori..." />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {commands.length ? commands.map((command) => (
            <button key={command.id} type="button" onClick={command.run} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-bg-secondary">
              <span className="grid h-9 min-w-9 place-items-center rounded-lg border border-bg-surface bg-bg-secondary px-2 text-[11px] font-black text-accent">{command.mark}</span>
              <span>
                <span className="block font-black text-text-primary">{command.title}</span>
                <span className="text-sm text-text-muted">{command.meta}</span>
              </span>
            </button>
          )) : <div className="p-8 text-center text-sm text-text-muted">Nu exista comenzi pentru cautarea curenta.</div>}
        </div>
      </div>
    </div>
  )
}
