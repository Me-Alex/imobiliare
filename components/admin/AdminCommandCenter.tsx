"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { supabase } from "@/lib/supabase"
import { AppointmentsView, CrmView, PropertiesView } from "./admin-core-views"
import { AgentsView, ClientsView, ComplianceView, DocumentsCenterView, ListingsView, MaintenanceView, MarketingView, TransactionsView } from "./admin-real-estate-views"
import { OperationsView } from "./admin-operations"
import { AuditView, ContentView, ReportsView, SettingsView, ToolsView, UsersView } from "./admin-secondary-views"
import { AccountingView, AnalyticsOpsView, BulkOpsView, CalendarOpsView, IntegrationsView, MediaView, OwnerPortalAdminView } from "./admin-upgrade-views"
import { AdminFoolproofLayer } from "./admin-foolproof"
import { apiJson, confirmRisk, csv, date, defaultCore, defaultModules, matches, money, nav, slugify, statusLabel, type ModuleType, type Row, type View } from "./admin-shared"

const allNavItems = nav.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group })))
const viewIds = new Set(allNavItems.map((item) => item.id))
const hqsNavGroups: Array<{ group: string; items: Array<{ id: View; label: string; mark: string }> }> = [
  {
    group: "Workspace",
    items: [
      { id: "overview", label: "Dashboard", mark: "D" },
      { id: "properties", label: "Proprietati", mark: "P" },
      { id: "crm", label: "Lead-uri", mark: "CRM" },
      { id: "transactions", label: "Pipeline", mark: "PIPE" },
      { id: "appointments", label: "Vizionari", mark: "CAL" },
    ],
  },
  {
    group: "Management",
    items: [
      { id: "agents", label: "Agenti", mark: "AG" },
      { id: "reports", label: "Rapoarte", mark: "R" },
      { id: "settings", label: "Setari", mark: "S" },
    ],
  },
  {
    group: "Avansat",
    items: allNavItems
      .filter((item) => !["overview", "properties", "crm", "transactions", "appointments", "agents", "reports", "settings"].includes(item.id))
      .map((item) => ({ id: item.id, label: item.label, mark: item.mark })),
  },
]

function isView(value: string | null): value is View {
  return Boolean(value && viewIds.has(value as View))
}

export default function AdminCommandCenter() {
  const [view, setView] = useState<View>("overview")
  const [query, setQuery] = useState("")
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
  const [guidedMode, setGuidedMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [toast, setToast] = useState("")

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
    setGuidedMode(window.localStorage.getItem("hqs-admin-guided") !== "off")

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
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const navigateView = (nextView: View, nextQuery?: string) => {
    setView(nextView)
    if (nextQuery !== undefined) setQuery(nextQuery)
    setSidebarOpen(false)
    window.localStorage.setItem("hqs-admin-view", nextView)
    const url = new URL(window.location.href)
    url.searchParams.set("view", nextView)
    window.history.replaceState(null, "", url.toString())
  }

  const showToast = (message: string) => setToast(message)

  const toggleGuidedMode = () => {
    setGuidedMode((enabled) => {
      const next = !enabled
      window.localStorage.setItem("hqs-admin-guided", next ? "on" : "off")
      return next
    })
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
    invoices: (platform.admin_invoices || []).filter((row: Row) => matches(row, query)),
    commissions: (platform.admin_commissions || []).filter((row: Row) => matches(row, query)),
    ownerReports: (platform.owner_reports || []).filter((row: Row) => matches(row, query)),
    attribution: (platform.analytics_attribution || []).filter((row: Row) => matches(row, query)),
    marketData: (platform.market_data || []).filter((row: Row) => matches(row, query)),
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

  const deleteProperty = (property: Row) => {
    if (!confirmRisk(`Stergi definitiv proprietatea "${property.title || property.slug || property.id}"? Actiunea nu poate fi anulata din admin.`)) return
    return save(`delete-${property.id}`, async () => {
      await apiJson(`/api/admin/properties/${property.id}`, { method: "DELETE" })
      setCore((prev) => ({ ...prev, properties: prev.properties.filter((row) => row.id !== property.id) }))
    }, "Proprietate stearsa.")
  }

  const createProperty = (payload: Row) => save("create-property", async () => {
    await apiJson("/api/admin/properties", { method: "POST", body: JSON.stringify({ ...payload, slug: payload.slug || slugify(payload.title || "proprietate") }) })
    await load()
  }, "Proprietate creata.")

  const saveModule = (type: ModuleType, payload: Row) => save(`${type}-save`, async () => {
    await apiJson("/api/admin/modules", { method: "POST", body: JSON.stringify({ type, payload }) })
    await load()
  }, "Modul salvat.")

  const deleteModule = (type: ModuleType, id: string) => {
    if (!confirmRisk(`Stergi intrarea din ${type}? Verifica inainte ca filtrul si randul sunt corecte.`)) return
    return save(`${type}-${id}`, async () => {
      await apiJson(`/api/admin/modules?type=${type}&id=${id}`, { method: "DELETE" })
      await load()
    }, "Intrare stearsa.")
  }

  const platformAction = (id: string, body: Row, success: string) => {
    const prompt = riskPromptForPlatformAction(body)
    if (prompt && !confirmRisk(prompt)) return
    return save(id, async () => {
      await apiJson("/api/admin/platform", { method: "POST", body: JSON.stringify(body) })
      await load()
    }, success)
  }

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
  const title = allNavItems.find((item) => item.id === view)?.label || "Admin"

  const renderView = () => {
    if (loading) return <HqsLoadingState />
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
    if (view === "ownerPortal") return <OwnerPortalAdminView {...props} />
    if (view === "compliance") return <ComplianceView {...props} />
    if (view === "users") return <UsersView {...props} />
    if (view === "tools") return <ToolsView {...props} />
    if (view === "settings") return <SettingsView {...props} />
    if (view === "audit") return <AuditView {...props} />
    return <HqsOverview core={core} modules={modules} platform={platform} report={report} metrics={metrics} saving={saving} lastLoadedAt={lastLoadedAt} setView={navigateView} exportServer={exportServer} exportLocalCsv={exportLocalCsv} reload={load} patchLead={patchLead} followUp={followUp} patchAppointment={patchAppointment} patchProperty={patchProperty} showToast={showToast} />
  }

  const activePanel = renderView()
  const profileInitials = adminEmail ? adminEmail.split("@")[0].slice(0, 2).toUpperCase() : "HA"

  return (
    <div className={`hqs-admin ${darkMode ? "hqs-admin-dark" : ""}`}>
      <div className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className="app">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="brand">
            <div className="brand-mark">HQS</div>
            <div className="brand-text">
              <strong>HQS Imobiliare</strong>
              <span>Admin Control Center</span>
            </div>
          </div>

          <nav className="nav-section" aria-label="Navigare admin">
            {hqsNavGroups.map((group) => (
              <div key={group.group}>
                <div className="nav-kicker">{group.group}</div>
                {group.items.map((item) => (
                  <button key={item.id} type="button" className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => navigateView(item.id)}>
                    <span className="nav-mark">{item.mark}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-card">
            <h4>Scor HQS AI</h4>
            <p>Primești sugestii despre proprietățile cu șanse mari de conversie și lead-urile care trebuie sunate azi.</p>
            <button type="button" className="btn primary small" onClick={() => navigateView("overview", "")}>Generează sumar</button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <button type="button" className="mobile-toggle" aria-label="Deschide meniul" onClick={() => setSidebarOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <label className="searchbar" aria-label="Caută în admin">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Caută proprietăți, clienți, zone..." />
            </label>

            <div className="top-actions">
              <button type="button" className="btn small" onClick={toggleGuidedMode}>{guidedMode ? "Ghid on" : "Ghid off"}</button>
              <button type="button" className="icon-btn" title="Schimbă tema" onClick={() => setDarkMode((enabled) => !enabled)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
              </button>
              <button type="button" className="icon-btn" title="Notificări" onClick={() => showToast("Ai notificări operaționale: lead-uri noi, vizionări și listări incomplete.")}>
                <span className="dot" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </button>
              <button type="button" className="icon-btn" title="Reîncarcă" disabled={refreshing} onClick={() => load()}>{refreshing ? "..." : "R"}</button>
              <button type="button" className="icon-btn" title="Export CSV" onClick={exportLocalCsv}>CSV</button>
              <div className="profile">
                <div className="avatar">{profileInitials}</div>
                <div>
                  <strong>{adminEmail || "HQS Admin"}</strong>
                  <span>{title}</span>
                </div>
              </div>
              <button type="button" className="icon-btn" title="Ieșire" onClick={() => fetch("/api/admin/session", { method: "DELETE" }).finally(() => supabase.auth.signOut().then(() => { window.location.href = "/admin/login" }))}>OUT</button>
            </div>
          </header>

          <section className="content">
            {error && <div className="admin-banner error">{error}</div>}
            {notice && <div className="admin-banner success">{notice}</div>}
            {!loading && <div className="admin-legacy"><AdminFoolproofLayer enabled={guidedMode} view={view} core={core} modules={modules} platform={platform} metrics={metrics} lastLoadedAt={lastLoadedAt} navigateView={navigateView} toggle={toggleGuidedMode} /></div>}
            {view === "overview" || loading ? activePanel : <div className="admin-legacy">{activePanel}</div>}
          </section>
        </main>
      </div>
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  )
}

function HqsLoadingState() {
  return (
    <section className="panel loading-panel">
      <div>
        <div className="loading-spinner" />
        <p className="eyebrow">HQS Admin</p>
        <h2>Se încarcă panoul operațional</h2>
        <p style={{ marginTop: 8, color: "var(--hqs-muted)" }}>Citim simultan CRM, proprietăți, programări, module și rapoarte.</p>
      </div>
    </section>
  )
}

function HqsOverview({ core, modules, platform, metrics, saving, lastLoadedAt, setView, exportServer, exportLocalCsv, reload, followUp, patchAppointment, patchProperty, showToast }: any) {
  const docs = [...modules.documents, ...((platform.client_documents || []) as Row[])]
  const publishedRate = core.properties.length ? Math.round((metrics.published.length / core.properties.length) * 100) : 77
  const contactedRate = core.leads.length ? Math.round((core.leads.filter((lead: Row) => !["NEW", "LOST"].includes(String(lead.status || ""))).length / core.leads.length) * 100) : 84
  const score = clamp(Math.round((publishedRate + contactedRate + clamp(metrics.scheduledTours.length * 12, 40, 100)) / 3), 45, 98)
  const scoreStyle = { "--hqs-score": `${score}%` } as CSSProperties
  const chartData = weeklyChart(core.leads, core.appointments)
  const priorityLeads = core.leads.length ? core.leads.slice(0, 4) : demoPriorityLeads
  const publishedLabel = core.properties.length ? `${metrics.published.length} / ${core.properties.length}` : "12 / 15"
  const activeLeadCount = metrics.activeLeads.length || priorityLeads.length
  const scheduledTours = metrics.scheduledTours.length || 9
  const pipelineValue = Number(metrics.pipeline || metrics.portfolio || 2450000)
  const attentionProperties = (core.properties.length ? core.properties : demoProperties)
    .filter((property: Row) => String(property.status || "DRAFT").toUpperCase() !== "SOLD")
    .slice(0, 4)
  const tours = core.appointments.length ? core.appointments.slice(0, 4) : demoTours
  const providerJobs = ((platform.admin_provider_jobs || []) as Row[]).slice(0, 4)
  const notificationCount = modules.notifications.length + ((platform.admin_notification_outbox || []) as Row[]).length

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Bun venit în HQS Admin</p>
          <h1>Control complet pentru proprietăți premium.</h1>
          <p>Admin page pentru listări, lead-uri, vizionări, agenți, rapoarte și setări. UI-ul este conectat la datele live când API-urile admin răspund și rămâne utilizabil cu fallback sigur când lipsesc credențiale.</p>
        </div>
        <button type="button" className="btn dark" onClick={() => setView("properties")}>Adaugă rapid</button>
      </div>

      <div className="hero-grid">
        <section className="hero-card">
          <p className="eyebrow">HQS Smart Focus</p>
          <h2>{activeLeadCount} lead-uri active și {metrics.published.length || 2} listări merită verificate azi.</h2>
          <p>Prioritizează lead-urile cu buget validat, proprietățile nepublicate și vizionările confirmate. Ultima sincronizare: {lastLoadedAt || "în curs"}.</p>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={() => setView("crm")}>Vezi lead-uri</button>
            <button type="button" className="btn ghost" onClick={() => setView("reports")}>Deschide raport</button>
            <button type="button" className="btn ghost" disabled={saving === "export-json"} onClick={() => exportServer("json")}>Export JSON</button>
            <button type="button" className="btn ghost" onClick={() => reload()}>Reîncarcă date</button>
          </div>
        </section>

        <aside className="ai-card">
          <h3>Scor portofoliu</h3>
          <p style={{ margin: 0, color: "var(--hqs-muted)", lineHeight: 1.5 }}>Calcul după status, lead-uri contactate, vizionări și completitudinea proprietăților.</p>
          <div className="score-ring" style={scoreStyle}><strong>{score}<span>%</span></strong></div>
          <div className="mini-list">
            <div className="mini-item"><span>Listări verificate</span><strong>{publishedLabel}</strong></div>
            <div className="mini-item"><span>Lead-uri contactate</span><strong>{contactedRate}%</strong></div>
            <div className="mini-item"><span>Vizionări active</span><strong>{scheduledTours}</strong></div>
          </div>
        </aside>
      </div>

      <div className="kpi-grid">
        <HqsKpi marker="PROP" trend="+18%" label="Proprietăți active" value={metrics.published.length || core.properties.length || 12} />
        <HqsKpi marker="CRM" trend="+24%" label="Lead-uri active" value={activeLeadCount} />
        <HqsKpi marker="CAL" trend="+9%" label="Vizionări programate" value={scheduledTours} />
        <HqsKpi marker="EUR" trend="-3%" down label="Valoare pipeline EUR" value={money(pipelineValue)} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Performanță săptămânală</h2>
              <p>Lead-uri și vizionări pe ultimele 7 zile</p>
            </div>
            <span className="tag success">Live</span>
          </div>
          <div className="chart">
            {chartData.map((item) => (
              <div className="bar-wrap" key={item.label}>
                <div className="bar" title={`${item.value}%`} style={{ height: `${item.value}%` }} />
                <div className="bar-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Lead-uri prioritare</h2>
              <p>Următoarele contacte recomandate</p>
            </div>
            <button type="button" className="btn small" onClick={() => setView("crm")}>Toate</button>
          </div>
          <div className="lead-list">
            {priorityLeads.map((lead: Row, index: number) => (
              <HqsLeadCard
                key={lead.id || lead.email || index}
                lead={lead}
                saving={saving === `follow-${lead.id}`}
                onFollow={() => lead.id ? followUp(lead) : showToast("Lead demo: follow-up-ul va funcționa când există lead în backend.")}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="grid-3" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-head"><div><h3>Documente</h3><p>Contracte, acte și versiuni</p></div><span className="tag warning">{docs.length}</span></div>
          <div className="mini-list">
            {docs.slice(0, 4).map((doc: Row, index: number) => <div className="mini-item" key={doc.id || index}><span>{doc.title || doc.type || "Document"}</span><strong>{statusLabel(doc.status || "PENDING")}</strong></div>)}
            {!docs.length && <div className="mini-item"><span>Nu există documente încă</span><strong>0</strong></div>}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h3>Top proprietăți</h3><p>Portofoliu activ</p></div><button type="button" className="btn small" onClick={() => setView("properties")}>Editor</button></div>
          <div className="mini-list">
            {attentionProperties.map((property: Row, index: number) => (
              <button
                type="button"
                className="mini-item"
                key={property.id || property.title || index}
                onClick={() => property.id ? patchProperty(property, { featured: !property.featured }) : showToast("Proprietate demo: promovarea se salvează când există ID în backend.")}
                disabled={property.id && saving === `property-${property.id}`}
              >
                <span>{property.title || "Proprietate"}</span>
                <strong>{property.featured ? "Promovat" : money(property.price || 0, property.currency || "EUR")}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h3>Acțiuni rapide</h3><p>Workflow-uri cu risc redus</p></div></div>
          <div className="mini-list">
            <button type="button" className="mini-item" onClick={() => setView("appointments")}><span>Programează vizionare</span><strong>CAL</strong></button>
            <button type="button" className="mini-item" onClick={() => setView("media")}><span>Încarcă media</span><strong>IMG</strong></button>
            <button type="button" className="mini-item" onClick={exportLocalCsv}><span>Export CSV backend</span><strong>CSV</strong></button>
          </div>
        </section>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-head">
            <div><h2>Vizionări conectate</h2><p>Statusuri și confirmări salvate prin API-ul admin.</p></div>
            <button type="button" className="btn small" onClick={() => setView("appointments")}>Calendar</button>
          </div>
          <div className="lead-list">
            {tours.map((tour: Row, index: number) => {
              const key = tour.id || `${tour.client_name || "tour"}-${index}`
              const canConfirm = tour.id && !["CONFIRMED", "DONE", "CANCELLED"].includes(String(tour.status || "").toUpperCase())
              return (
                <article className="activity-card" key={key}>
                  <div className="lead-avatar">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <h4>{date(tour.requested_at || tour.starts_at, true)}</h4>
                    <p>{tour.property_title || tour.title || "Vizionare"} · {tour.client_name || tour.client_email || tour.client_phone || "client"}</p>
                  </div>
                  <button
                    type="button"
                    className={`tag ${statusTone(tour.status || "REQUESTED")}`}
                    disabled={tour.id && saving === `appointment-${tour.id}`}
                    onClick={() => canConfirm ? patchAppointment(tour, "CONFIRMED") : showToast(tour.id ? "Vizionarea este deja într-un status final sau confirmat." : "Vizionare demo: confirmarea se salvează când există ID în backend.")}
                  >
                    {statusLabel(tour.status || "REQUESTED")}
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2>Backend live</h2><p>Semnale citite din API-uri și tabele platformă.</p></div>
            <span className="tag success">Conectat</span>
          </div>
          <div className="mini-list">
            <div className="mini-item"><span>Notificări / outbox</span><strong>{notificationCount}</strong></div>
            <div className="mini-item"><span>Joburi provider</span><strong>{providerJobs.length}</strong></div>
            <div className="mini-item"><span>Media proprietăți</span><strong>{((platform.property_media || []) as Row[]).length}</strong></div>
            <div className="mini-item"><span>Facturi admin</span><strong>{((platform.admin_invoices || []) as Row[]).length}</strong></div>
            {providerJobs.map((job: Row, index: number) => (
              <button type="button" className="mini-item" key={job.id || index} onClick={() => setView("integrations")}>
                <span>{job.provider || job.type || "provider job"}</span>
                <strong>{statusLabel(job.status || "QUEUED")}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

function HqsKpi({ marker, trend, label, value, down = false }: { marker: string; trend: string; label: string; value: any; down?: boolean }) {
  return (
    <article className="kpi">
      <div className="kpi-top"><div className="kpi-icon">{marker}</div><span className={`trend ${down ? "down" : ""}`}>{trend}</span></div>
      <h3>{value}</h3>
      <p>{label}</p>
    </article>
  )
}

function HqsLeadCard({ lead, saving, onFollow }: { lead: Row; saving: boolean; onFollow: () => void }) {
  const name = lead.name || lead.full_name || lead.client_name || lead.email || lead.phone || "Lead nou"
  const meta = lead.interest || lead.message || lead.property_title || lead.zone || lead.phone || lead.email || "Preferințe necompletate"
  const budget = lead.budget || lead.max_budget || lead.price
  const status = String(lead.status || "NEW")
  return (
    <article className="lead-card">
      <div className="lead-avatar">{initials(name)}</div>
      <div>
        <h4>{name}</h4>
        <p>{meta}{budget ? ` • ${money(budget)}` : ""}</p>
      </div>
      <button type="button" className={`tag ${statusTone(status)}`} disabled={saving} onClick={onFollow}>{saving ? "..." : statusLabel(status)}</button>
    </article>
  )
}

function weeklyChart(leads: Row[], appointments: Row[]) {
  const fallback = [62, 48, 86, 72, 94, 57, 40]
  const labels = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"]
  const counts = new Array(7).fill(0)
  for (const row of [...leads, ...appointments]) {
    const value = row.created_at || row.requested_at || row.starts_at
    const day = value ? new Date(value).getDay() : -1
    if (day >= 0) counts[(day + 6) % 7] += 1
  }
  const max = Math.max(...counts)
  return labels.map((label, index) => ({ label, value: max > 0 ? Math.max(20, Math.round((counts[index] / max) * 94)) : fallback[index] }))
}

function initials(value: string) {
  const parts = value.split(/[\\s@._-]+/).filter(Boolean)
  return (parts[0]?.[0] || "H").toUpperCase() + (parts[1]?.[0] || parts[0]?.[1] || "Q").toUpperCase()
}

function statusTone(status: string) {
  const key = status.toUpperCase()
  if (["PUBLISHED", "ACTIVE", "CONFIRMED", "QUALIFIED", "SIGNED", "SOLD", "RENTED", "DONE", "PAID"].includes(key)) return "success"
  if (["DRAFT", "LOST", "FAILED_CONFIG", "FAILED_PROVIDER", "CANCELLED"].includes(key)) return "danger"
  if (["CONTACTED", "PENDING", "REQUESTED", "QUEUED", "RETRYING"].includes(key)) return "warning"
  if (["NEW", "OPEN", "AVAILABLE"].includes(key)) return "info"
  return ""
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const demoPriorityLeads: Row[] = [
  { name: "Ana Marinescu", interest: "Aviatorilor, 4 camere", budget: 900000, status: "QUALIFIED" },
  { name: "Mihai Ionescu", interest: "Pipera, vilă", budget: 1200000, status: "CONTACTED" },
  { name: "Elena Dobre", interest: "Floreasca, 3 camere", budget: 450000, status: "NEW" },
  { name: "Andrei Pop", interest: "Dorobanți, casă", budget: 720000, status: "PENDING" },
]

const demoProperties: Row[] = [
  { title: "Penthouse cu terasă în Aviatorilor", price: 890000, currency: "EUR", type: "APARTMENT" },
  { title: "Vilă individuală cu grădină", price: 1250000, currency: "EUR", type: "VILLA" },
  { title: "Apartament elegant în Floreasca", price: 455000, currency: "EUR", type: "APARTMENT" },
  { title: "Casă boutique în Dorobanți", price: 740000, currency: "EUR", type: "HOUSE" },
]

const demoTours: Row[] = [
  { client_name: "Ana M.", property_title: "Penthouse Aviatorilor", requested_at: new Date().toISOString(), status: "CONFIRMED" },
  { client_name: "Mihai I.", property_title: "Vilă Pipera", requested_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), status: "REQUESTED" },
  { client_name: "Elena D.", property_title: "Apartament Floreasca", requested_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), status: "PENDING" },
]

function riskPromptForPlatformAction(body: Row) {
  const payload = body.payload || {}
  if (body.type === "appointment_slot" && payload.action === "delete") return "Stergi slotul de vizionare? Verifica sa nu fie un slot rezervat sau sincronizat in calendar."
  if (body.type === "appointment_slot" && String(payload.status || "").toUpperCase() === "CANCELLED") return "Anulezi slotul de vizionare? Clientii pot ramane fara disponibilitate daca slotul era activ."
  if (body.type === "admin_role" && String(payload.status || "").toUpperCase() === "INACTIVE") return "Dezactivezi rolul admin? Utilizatorul poate pierde accesul imediat."
  return ""
}
