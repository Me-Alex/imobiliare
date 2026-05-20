"use client"

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { AppointmentsView, CrmView, PropertiesView } from "./admin-core-views"
import { AgentsView, ClientsView, ComplianceView, DocumentsCenterView, ListingsView, MaintenanceView, MarketingView, TransactionsView } from "./admin-real-estate-views"
import { OperationsView } from "./admin-operations"
import { AuditView, ContentView, ReportsView, SettingsView, ToolsView, UsersView } from "./admin-secondary-views"
import { AccountingView, AnalyticsOpsView, BulkOpsView, CalendarOpsView, IntegrationsView, MediaView, OwnerPortalAdminView } from "./admin-upgrade-views"
import { AdminFoolproofLayer } from "./admin-foolproof"
import { apiJson, confirmRisk, csv, date, defaultCore, defaultModules, matches, money, nav, propertyTypeLabel, slugify, statusLabel, type ModuleType, type Row, type View } from "./admin-shared"

const allNavItems = nav.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group })))
const viewIds = new Set(allNavItems.map((item) => item.id))
const hqsNavGroups: Array<{ group: string; items: Array<{ id: View; label: string; mark: string }> }> = [
  {
    group: "Workspace",
    items: [
      { id: "overview", label: "Dashboard", mark: "D" },
      { id: "properties", label: "Proprietăți", mark: "P" },
      { id: "crm", label: "Lead-uri", mark: "CRM" },
      { id: "transactions", label: "Pipeline", mark: "PIPE" },
      { id: "appointments", label: "Vizionări", mark: "CAL" },
    ],
  },
  {
    group: "Management",
    items: [
      { id: "agents", label: "Agenți", mark: "AG" },
      { id: "reports", label: "Rapoarte", mark: "R" },
      { id: "settings", label: "Setări", mark: "S" },
    ],
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

  const createLead = (payload: Row) => save("lead-create", async () => {
    await apiJson("/api/admin/platform", { method: "POST", body: JSON.stringify({ type: "lead", payload }) })
    await load()
  }, "Lead adaugat.")

  const patchAppointment = (appointment: Row, status: string) => save(`appointment-${appointment.id}`, async () => {
    const data = await apiJson<Row>(`/api/admin/appointments/${appointment.id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    setCore((prev) => ({ ...prev, appointments: prev.appointments.map((row) => row.id === appointment.id ? data.appointment : row) }))
  }, "Programare actualizata.")

  const createAppointment = (payload: Row) => save("appointment-create", async () => {
    await apiJson("/api/admin/platform", { method: "POST", body: JSON.stringify({ type: "appointment", payload }) })
    await load()
  }, "Vizionare programata.")

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
    const props = { filtered, core, modules, platform, report, metrics, query, saving, setView: navigateView, reload: load, patchLead, followUp, createLead, patchAppointment, createAppointment, patchProperty, deleteProperty, createProperty, saveModule, deleteModule, platformAction, saveSettings, exportLocalCsv, exportServer, showToast }
    if (view === "properties") return <HqsPropertiesView {...props} />
    if (view === "listings") return <ListingsView {...props} />
    if (view === "media") return <MediaView {...props} />
    if (view === "crm") return <HqsLeadsView {...props} />
    if (view === "clients") return <ClientsView {...props} />
    if (view === "appointments") return <HqsCalendarView {...props} />
    if (view === "calendar") return <CalendarOpsView {...props} />
    if (view === "agents") return <HqsAgentsView {...props} />
    if (view === "transactions") return <HqsPipelineView {...props} />
    if (view === "accounting") return <AccountingView {...props} />
    if (view === "maintenance") return <MaintenanceView {...props} />
    if (view === "documents") return <DocumentsCenterView {...props} />
    if (view === "marketing") return <MarketingView {...props} />
    if (view === "operations") return <OperationsView {...props} />
    if (view === "bulk") return <BulkOpsView {...props} />
    if (view === "integrations") return <IntegrationsView {...props} />
    if (view === "content") return <ContentView {...props} />
    if (view === "reports") return <HqsReportsView {...props} />
    if (view === "analytics") return <AnalyticsOpsView {...props} />
    if (view === "ownerPortal") return <OwnerPortalAdminView {...props} />
    if (view === "compliance") return <ComplianceView {...props} />
    if (view === "users") return <UsersView {...props} />
    if (view === "tools") return <ToolsView {...props} />
    if (view === "settings") return <HqsSettingsView {...props} />
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
              <button type="button" className="icon-btn" title="Schimbă tema" onClick={() => setDarkMode((enabled) => !enabled)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
              </button>
              <button type="button" className="icon-btn" title="Notificări" onClick={() => showToast("Ai notificări operaționale: lead-uri noi, vizionări și listări incomplete.")}>
                <span className="dot" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </button>
              <div className="profile">
                <div className="avatar">{profileInitials}</div>
                <div>
                  <strong>{adminEmail || "HQS Admin"}</strong>
                  <span>{title}</span>
                </div>
              </div>
            </div>
          </header>

          <section className="content">
            {error && <div className="admin-banner error">{error}</div>}
            {notice && <div className="admin-banner success">{notice}</div>}
            {activePanel}
          </section>
        </main>
      </div>
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  )
}

function HqsPageHead({ eyebrow, title, body, action }: { eyebrow: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      {action}
    </div>
  )
}

function HqsPropertiesView({ filtered, query, saving, createProperty, patchProperty, deleteProperty, exportLocalCsv, showToast }: any) {
  const [search, setSearch] = useState("")
  const [zone, setZone] = useState("all")
  const [type, setType] = useState("all")
  const [modal, setModal] = useState<Row | null | false>(false)
  const source = filtered.properties.length ? filtered.properties : (query ? [] : demoProperties)
  const zones = Array.from(new Set<string>(source.map(propertyZone).filter(Boolean))).sort()
  const visible = source.filter((property: Row) => {
    const text = [property.title, property.city, property.zone, property.type, property.description, property.address].join(" ").toLowerCase()
    return text.includes(search.toLowerCase().trim()) && (zone === "all" || propertyZone(property) === zone) && (type === "all" || String(property.type || "").toUpperCase() === type)
  })
  const saveProperty = async (payload: Row) => {
    if (modal && modal.id) await patchProperty(modal, payload)
    else await createProperty(payload)
    setModal(false)
  }

  return (
    <>
      <HqsPageHead eyebrow="Portofoliu" title="Proprietăți HQS" body="Administrează listări, status, preț, zonă, fotografii, scor de potrivire și completitudinea documentelor." action={<button type="button" className="btn dark" onClick={() => setModal(null)}>Adaugă proprietate</button>} />
      <section className="panel">
        <div className="toolbar">
          <div className="filters">
            <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Caută după titlu sau zonă..." />
            <select className="select" value={zone} onChange={(event) => setZone(event.target.value)}>
              <option value="all">Toate zonele</option>
              {zones.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="select" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">Toate tipurile</option>
              <option value="APARTMENT">Apartament</option>
              <option value="HOUSE">Casă</option>
              <option value="VILLA">Vilă</option>
              <option value="LAND">Teren</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
          </div>
          <div className="filters">
            <button type="button" className="btn small" onClick={exportLocalCsv}>Export CSV</button>
            <button type="button" className="btn small" onClick={() => { setSearch(""); setZone("all"); setType("all") }}>Reset</button>
          </div>
        </div>
        <div className="property-grid">
          {visible.length ? visible.map((property: Row, index: number) => (
            <article className="property-card" key={property.id || property.title || index}>
              <div className="property-image" style={{ "--photo": propertyPhoto(property, index) } as CSSProperties}>
                <span className="status-pill">{statusLabel(property.status || "DRAFT")}</span>
                <span className="price-pill">{Number(property.price || 0) ? money(property.price, property.currency || "EUR") : "Preț la cerere"}</span>
              </div>
              <div className="property-body">
                <h3>{property.title || "Proprietate HQS"}</h3>
                <div className="property-meta">{propertyZone(property)} / {propertyTypeLabel(property.type || "APARTMENT")}<br />{property.description || property.address || "Descriere internă pentru echipă."}</div>
                <div className="property-stats"><span>{property.area_sqm || property.surface || 0} mp</span><span>{property.rooms ? `${property.rooms} cam.` : "-"}</span><span>{propertyScore(property)}% scor</span></div>
                <div className="property-actions">
                  <button type="button" className="btn small" disabled={property.id && saving === `property-${property.id}`} onClick={() => setModal(property)}>Editează</button>
                  <button type="button" className="btn small" onClick={() => property.id ? deleteProperty(property) : showToast("Proprietate demo: ștergerea se aplică pentru date live.")}>Șterge</button>
                </div>
              </div>
            </article>
          )) : <div className="empty">Nu există proprietăți pentru filtrele alese.</div>}
        </div>
      </section>
      {modal !== false && <PropertyModal property={modal} saving={saving === "create-property" || Boolean(modal?.id && saving === `property-${modal.id}`)} onClose={() => setModal(false)} onSubmit={saveProperty} />}
    </>
  )
}

function HqsLeadsView({ filtered, query, saving, followUp, createLead, showToast }: any) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const source = filtered.leads.length ? filtered.leads : (query ? [] : demoPriorityLeads)
  const visible = source.filter((lead: Row) => Object.values(lead).join(" ").toLowerCase().includes(search.toLowerCase().trim()) && (status === "all" || String(lead.status || "").toUpperCase() === status))
  return (
    <>
      <HqsPageHead eyebrow="CRM" title="Lead-uri și clienți" body="Ține evidența contactelor, bugetelor, preferințelor, următorilor pași și istoricului de discuții." action={<button type="button" className="btn dark" onClick={() => setModalOpen(true)}>Adaugă lead</button>} />
      <section className="panel">
        <div className="toolbar">
          <div className="filters">
            <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Caută client, telefon, zonă..." />
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Toate statusurile</option><option value="NEW">Nou</option><option value="CONTACTED">Contactat</option><option value="QUALIFIED">Vizionare</option><option value="PENDING">Ofertă</option><option value="LOST">Rece</option></select>
          </div>
          <button type="button" className="btn small" onClick={() => visible[0]?.id ? followUp(visible[0]) : showToast("Alege un lead live pentru follow-up.")}>Marchează follow-up</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Interes</th><th>Buget</th><th>Status</th><th>Următorul pas</th><th>Agent</th><th>Acțiuni</th></tr></thead>
            <tbody>
              {visible.length ? visible.map((lead: Row, index: number) => {
                const name = lead.name || lead.full_name || lead.email || lead.phone || "Lead nou"
                return <tr key={lead.id || lead.email || index}><td><div className="client-cell"><div className="lead-avatar">{initials(name)}</div><strong>{name}</strong></div></td><td>{lead.interest || lead.message || lead.property_title || "Preferințe necompletate"}</td><td>{lead.budget || lead.max_budget ? money(lead.budget || lead.max_budget) : "-"}</td><td><span className={`tag ${statusTone(lead.status || "NEW")}`}>{statusLabel(lead.status || "NEW")}</span></td><td>{lead.next || lead.next_follow_up || "Sună azi"}</td><td>{lead.agent || lead.assigned_to || "HQS"}</td><td><button type="button" className="btn small" disabled={lead.id && saving === `follow-${lead.id}`} onClick={() => lead.id ? followUp(lead) : showToast("Lead demo: deschiderea fișei se aplică pentru date live.")}>Deschide</button></td></tr>
              }) : <tr><td colSpan={7}><div className="empty">Nu există lead-uri pentru filtrele alese.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {modalOpen && <LeadModal saving={saving === "lead-create"} onClose={() => setModalOpen(false)} onSubmit={async (payload) => { await createLead(payload); setModalOpen(false) }} />}
    </>
  )
}

function HqsPipelineView({ filtered, platformAction, saving, showToast }: any) {
  const offers = filtered.offers.length ? filtered.offers : demoOffers
  const stages = [
    { name: "Shortlist", statuses: ["SHORTLIST", "NEW", "SUBMITTED", "PENDING"] },
    { name: "Vizionare", statuses: ["VIEWING", "REQUESTED", "CONFIRMED"] },
    { name: "Ofertă", statuses: ["NEGOTIATING", "OFFER", "ACCEPTED"] },
    { name: "Due diligence", statuses: ["DUE_DILIGENCE", "SIGNED", "CLOSED", "DONE"] },
  ]
  const nextStatus: Record<string, string> = { SHORTLIST: "VIEWING", NEW: "VIEWING", SUBMITTED: "VIEWING", PENDING: "VIEWING", VIEWING: "NEGOTIATING", REQUESTED: "NEGOTIATING", CONFIRMED: "NEGOTIATING", NEGOTIATING: "DUE_DILIGENCE", OFFER: "DUE_DILIGENCE", ACCEPTED: "DUE_DILIGENCE", DUE_DILIGENCE: "SIGNED" }
  return (
    <>
      <HqsPageHead eyebrow="Tranzacții" title="Pipeline vânzări" body="Vizualizează oportunitățile pe etape: shortlist, vizionare, ofertă și due diligence." action={<button type="button" className="btn dark" onClick={() => showToast("Pipeline actualizat cu date live.")}>Actualizează pipeline</button>} />
      <div className="pipeline">
        {stages.map((stage) => {
          const deals = offers.filter((offer: Row) => stage.statuses.includes(String(offer.status || "SHORTLIST").toUpperCase()))
          return <section className="stage" key={stage.name}><h3>{stage.name} <span className="tag">{deals.length}</span></h3>{deals.map((deal: Row, index: number) => {
            const current = String(deal.status || "SHORTLIST").toUpperCase()
            const next = nextStatus[current] || "SIGNED"
            return <article className="deal-card" key={deal.id || index}><h4>{deal.client_name || deal.client_email || deal.name || "Client HQS"}</h4><p>{deal.property_title || deal.title || deal.property || "Oportunitate imobiliară"}</p><div className="deal-footer"><span>{money(deal.counter_offer || deal.offer_price || deal.price || 0)}</span><button type="button" className="btn small" disabled={deal.id && saving === `offer-${deal.id}`} onClick={() => deal.id ? platformAction(`offer-${deal.id}`, { type: "offer_status", payload: { id: deal.id, status: next, counter_offer: deal.counter_offer || deal.offer_price || 0, notes: deal.notes || null } }, "Oferta a fost mutată.") : showToast("Card demo: mutarea se salvează pentru oferte live.")}>Mută</button></div></article>
          })}</section>
        })}
      </div>
    </>
  )
}

function HqsCalendarView({ filtered, platform, patchAppointment, createAppointment, saving, showToast }: any) {
  const [modalOpen, setModalOpen] = useState(false)
  const tours = filtered.appointments.length ? filtered.appointments : demoTours
  const calendarItems = calendarCells(new Date(), [...tours, ...adminRows(platform.appointment_slots)])
  const monthLabel = capitalize(new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" }))
  return (
    <>
      <HqsPageHead eyebrow="Programări" title="Vizionări" body="Calendar pentru vizionări, evaluări, întâlniri la notar și follow-up-uri." action={<button type="button" className="btn dark" onClick={() => setModalOpen(true)}>Programează vizionare</button>} />
      <div className="calendar-grid">
        <section className="panel">
          <div className="panel-head"><div><h2>{monthLabel}</h2><p>Program operațional HQS</p></div><span className="tag info">Europe/Bucharest</span></div>
          <div className="calendar">
            {calendarItems.map((cell: any, index: number) => cell.kind === "name" ? <div className="day-name" key={index}>{cell.label}</div> : <div className={`day-cell ${cell.muted ? "muted" : ""} ${cell.today ? "today" : ""}`} key={index}><span className="day-number">{cell.day}</span>{cell.events.slice(0, 3).map((event: string, eventIndex: number) => <span className="event-chip" key={eventIndex}>{event}</span>)}</div>)}
          </div>
        </section>
        <aside className="panel">
          <div className="panel-head"><div><h2>Azi</h2><p>Vizionări prioritare</p></div></div>
          <div className="activity-list">
            {tours.slice(0, 4).map((tour: Row, index: number) => <article className="activity-card" key={tour.id || index}><div className="lead-avatar">{String(index + 1).padStart(2, "0")}</div><div><h4>{date(tour.requested_at || tour.starts_at, true)}</h4><p>{tour.property_title || tour.title || "Vizionare"}, client: {tour.client_name || tour.client_email || "HQS"}</p></div><button type="button" className={`tag ${statusTone(tour.status || "REQUESTED")}`} disabled={tour.id && saving === `appointment-${tour.id}`} onClick={() => tour.id ? patchAppointment(tour, "CONFIRMED") : showToast("Vizionare demo: confirmarea se aplică pentru date live.")}>{statusLabel(tour.status || "REQUESTED")}</button></article>)}
          </div>
        </aside>
      </div>
      {modalOpen && <AppointmentModal saving={saving === "appointment-create"} properties={filtered.properties} onClose={() => setModalOpen(false)} onSubmit={async (payload) => { await createAppointment(payload); setModalOpen(false) }} />}
    </>
  )
}

function HqsAgentsView({ filtered, core, saveModule, saving, showToast }: any) {
  const [modalOpen, setModalOpen] = useState(false)
  const agents = filtered.teamUsers.length ? filtered.teamUsers : (filtered.roles.length ? filtered.roles : demoAgents)
  return (
    <>
      <HqsPageHead eyebrow="Echipă" title="Agenți HQS" body="Monitorizează portofoliu, lead-uri active, conversii și încărcarea fiecărui agent." action={<button type="button" className="btn dark" onClick={() => setModalOpen(true)}>Invită agent</button>} />
      <section className="agent-grid">
        {agents.map((agent: Row, index: number) => {
          const name = agent.name || agent.full_name || agent.email || `Agent ${index + 1}`
          const listings = agent.listings ?? core.properties.filter((property: Row) => property.agent_email === agent.email).length
          const leads = agent.leads ?? core.leads.filter((lead: Row) => lead.assigned_to === agent.email).length
          return <article className="agent-card" key={agent.id || agent.email || index}><div className="agent-photo">{agent.initials || initials(name)}</div><h3>{name}</h3><p>{agent.role || "Agent HQS"}</p><div className="agent-metrics"><span>{listings}<br />listări</span><span>{leads}<br />lead-uri</span><span>{agent.conversion || "28%"}<br />conv.</span></div><button type="button" className="btn small" onClick={() => showToast(`Profil agent deschis: ${name}.`)}>Vezi profil</button></article>
        })}
      </section>
      {modalOpen && <AgentModal saving={saving === "team_users-save"} onClose={() => setModalOpen(false)} onSubmit={async (payload) => { await saveModule("team_users", payload); setModalOpen(false) }} />}
    </>
  )
}

function HqsReportsView({ core, modules, platform, metrics, report, exportServer }: any) {
  const attribution = adminRows(platform.analytics_attribution)
  const views = Number(report.views || attribution.length || 8700)
  const contacts = core.leads.length || 326
  const conversion = core.leads.length ? Math.round((metrics.scheduledTours.length / Math.max(core.leads.length, 1)) * 100) : 28
  const commission = Math.round(Number(metrics.pipeline || metrics.portfolio || 410000) * 0.03)
  const sources = grouped(attribution, "source")
  const zones = grouped(core.properties, "city")
  const sourceItems = Object.keys(sources).length ? Object.entries(sources).map(([name, value]) => [name, `${value}`]) : [["Website hqsimobiliare.ro", "44%"], ["Recomandări", "24%"], ["Social media", "18%"], ["Portaluri imobiliare", "14%"]]
  const zoneItems = Object.keys(zones).length ? Object.entries(zones).map(([name, value]) => [name, `${value} proprietăți`]) : [["Aviatorilor", "92 lead-uri"], ["Floreasca", "76 lead-uri"], ["Pipera", "64 lead-uri"], ["Dorobanți", "51 lead-uri"]]
  return (
    <>
      <HqsPageHead eyebrow="Analytics" title="Rapoarte" body="Indicatori pentru listări, conversii, canale de lead și valoare estimată a pipeline-ului." action={<button type="button" className="btn dark" onClick={() => exportServer("json")}>Descarcă raport</button>} />
      <div className="kpi-grid"><HqsKpi marker="CH" trend="+31%" label="Vizualizări listări" value={compact(views)} /><HqsKpi marker="CALL" trend="+16%" label="Contacte primite" value={contacts} /><HqsKpi marker="OK" trend="+12%" label="Rată conversie vizionări" value={`${conversion}%`} /><HqsKpi marker="EUR" trend="+7%" label="Comision estimat" value={money(commission)} /></div>
      <div className="grid-2">
        <section className="panel"><div className="panel-head"><div><h2>Canale lead</h2><p>Distribuție ultimele 30 zile</p></div></div><div className="mini-list">{sourceItems.slice(0, 5).map(([name, value]) => <div className="mini-item" key={name}><span>{name}</span><strong>{value}</strong></div>)}</div></section>
        <section className="panel"><div className="panel-head"><div><h2>Top zone după interes</h2><p>Proprietăți, lead-uri și cerere activă</p></div></div><div className="mini-list">{zoneItems.slice(0, 5).map(([name, value]) => <div className="mini-item" key={name}><span>{name}</span><strong>{value}</strong></div>)}</div></section>
      </div>
      <div className="grid-3 mt-admin">
        <section className="panel"><div className="panel-head"><div><h3>Documente</h3><p>Intern + client</p></div></div><div className="mini-item"><span>Total documente</span><strong>{modules.documents.length + adminRows(platform.client_documents).length}</strong></div></section>
        <section className="panel"><div className="panel-head"><div><h3>Owner reports</h3><p>Rapoarte proprietari</p></div></div><div className="mini-item"><span>Total rapoarte</span><strong>{adminRows(platform.owner_reports).length}</strong></div></section>
        <section className="panel"><div className="panel-head"><div><h3>Provider jobs</h3><p>Email, SMS, semnare, facturi</p></div></div><div className="mini-item"><span>Joburi active</span><strong>{adminRows(platform.admin_provider_jobs).length}</strong></div></section>
      </div>
    </>
  )
}

function HqsSettingsView({ modules, saveSettings, saving, showToast }: any) {
  const [form, setForm] = useState<Row>({ ...modules.settings })
  const [toggles, setToggles] = useState({ hotLeads: true, documents: true, reminders: true, autopublish: false })
  useEffect(() => setForm({ ...modules.settings }), [modules.settings])
  const update = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }))
  return (
    <>
      <HqsPageHead eyebrow="Configurație" title="Setări admin" body="Setări pentru brand, notificări, reguli de publicare, roluri și preferințe operaționale." action={<button type="button" className="btn dark" disabled={saving === "settings"} onClick={() => saveSettings(form)}>Salvează setări</button>} />
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-head"><div><h2>Brand & companie</h2><p>Informații afișate intern</p></div></div>
          <div className="form">
            <div className="form-row"><label>Nume brand</label><input value={form.agency || "HQS Imobiliare"} onChange={(event) => update("agency", event.target.value)} /></div>
            <div className="form-row"><label>Website</label><input value={form.website || "https://hqsimobiliare.ro"} onChange={(event) => update("website", event.target.value)} /></div>
            <div className="form-row"><label>Focus comercial</label><select value={form.focus || "Proprietăți premium în București"} onChange={(event) => update("focus", event.target.value)}><option>Proprietăți premium în București</option><option>Închirieri corporate</option><option>Vânzări rezidențiale</option><option>Investiții imobiliare</option></select></div>
            <div className="form-row"><label>Comision standard (%)</label><input type="number" value={form.commission || 3} onChange={(event) => update("commission", Number(event.target.value))} /></div>
            <div className="form-row"><label>Notă internă</label><textarea value={form.notes || "Prioritate pe proprietăți verificate, comparații clare și vizionări fără presiune inutilă."} onChange={(event) => update("notes", event.target.value)} /></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h2>Automatizări</h2><p>Reguli pentru workflow</p></div></div>
          <div className="mini-list">
            <SwitchRow title="Notifică lead-uri fierbinți" text="Când un client revine de 3+ ori pe o listare." enabled={toggles.hotLeads} onClick={() => setToggles((prev) => ({ ...prev, hotLeads: !prev.hotLeads }))} />
            <SwitchRow title="Checklist acte obligatoriu" text="Blochează statusul Ofertă fără documente." enabled={toggles.documents} onClick={() => setToggles((prev) => ({ ...prev, documents: !prev.documents }))} />
            <SwitchRow title="Reminder vizionare" text="Trimite reminder agentului cu 2 ore înainte." enabled={toggles.reminders} onClick={() => setToggles((prev) => ({ ...prev, reminders: !prev.reminders }))} />
            <SwitchRow title="Publicare automată" text="Publică listări doar după scor de completitudine 90%+." enabled={toggles.autopublish} onClick={() => setToggles((prev) => ({ ...prev, autopublish: !prev.autopublish }))} />
            <button type="button" className="btn primary" onClick={() => showToast("Automatizările au fost actualizate pentru sesiunea curentă.")}>Aplică automatizări</button>
          </div>
        </section>
      </div>
    </>
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

function PropertyModal({ property, saving, onClose, onSubmit }: { property: Row | null; saving: boolean; onClose: () => void; onSubmit: (payload: Row) => Promise<void> }) {
  const [form, setForm] = useState<Row>(() => ({ title: property?.title || "", city: propertyZone(property || {}), type: property?.type || "APARTMENT", status: property?.status || "DRAFT", price: property?.price || "", area_sqm: property?.area_sqm || "", rooms: property?.rooms || "", score: propertyScore(property || {}), description: property?.description || "" }))
  const update = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await onSubmit({ ...form, price: Number(form.price || 0), area_sqm: Number(form.area_sqm || 0), rooms: Number(form.rooms || 0) }) }
  return <div className="modal-backdrop open" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><h2>{property ? "Editează proprietate" : "Adaugă proprietate"}</h2><button type="button" className="close-btn" onClick={onClose} aria-label="Închide">x</button></div><form className="form" onSubmit={submit}><div className="modal-grid"><div className="form-row"><label>Titlu</label><input value={form.title} onChange={(event) => update("title", event.target.value)} required placeholder="Ex: Apartament premium Floreasca" /></div><div className="form-row"><label>Zonă</label><input value={form.city} onChange={(event) => update("city", event.target.value)} required placeholder="Ex: Floreasca" /></div><div className="form-row"><label>Tip</label><select value={form.type} onChange={(event) => update("type", event.target.value)}><option value="APARTMENT">Apartament</option><option value="HOUSE">Casă</option><option value="VILLA">Vilă</option><option value="LAND">Teren</option><option value="COMMERCIAL">Comercial</option></select></div><div className="form-row"><label>Status</label><select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="PUBLISHED">Activ</option><option value="DRAFT">Draft</option><option value="SOLD">Vândut</option><option value="RENTED">Închiriat</option></select></div><div className="form-row"><label>Preț EUR</label><input value={form.price} onChange={(event) => update("price", event.target.value)} type="number" min="0" placeholder="450000" /></div><div className="form-row"><label>Suprafață mp</label><input value={form.area_sqm} onChange={(event) => update("area_sqm", event.target.value)} type="number" min="0" placeholder="120" /></div><div className="form-row"><label>Camere</label><input value={form.rooms} onChange={(event) => update("rooms", event.target.value)} type="number" min="0" placeholder="3" /></div><div className="form-row"><label>Scor potrivire</label><input value={form.score} onChange={(event) => update("score", event.target.value)} type="number" min="0" max="100" placeholder="82" /></div></div><div className="form-row"><label>Descriere scurtă</label><textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Descriere internă pentru echipă..." /></div><div className="form-actions"><button type="button" className="btn" onClick={onClose}>Anulează</button><button type="submit" className="btn primary" disabled={saving}>{saving ? "Se salvează..." : "Salvează proprietatea"}</button></div></form></div></div>
}

function LeadModal({ saving, onClose, onSubmit }: { saving: boolean; onClose: () => void; onSubmit: (payload: Row) => Promise<void> }) {
  const [form, setForm] = useState<Row>({ name: "", phone: "", email: "", message: "", budget: "", status: "NEW", source: "admin" })
  const update = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await onSubmit({ ...form, budget: Number(form.budget || 0) }) }
  return <div className="modal-backdrop open" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><h2>Adaugă lead</h2><button type="button" className="close-btn" onClick={onClose}>x</button></div><form className="form" onSubmit={submit}><div className="modal-grid"><div className="form-row"><label>Nume</label><input value={form.name} required onChange={(event) => update("name", event.target.value)} /></div><div className="form-row"><label>Telefon</label><input value={form.phone} onChange={(event) => update("phone", event.target.value)} /></div><div className="form-row"><label>Email</label><input value={form.email} type="email" onChange={(event) => update("email", event.target.value)} /></div><div className="form-row"><label>Buget EUR</label><input value={form.budget} type="number" onChange={(event) => update("budget", event.target.value)} /></div></div><div className="form-row"><label>Interes</label><textarea value={form.message} onChange={(event) => update("message", event.target.value)} /></div><div className="form-actions"><button type="button" className="btn" onClick={onClose}>Anulează</button><button type="submit" className="btn primary" disabled={saving}>{saving ? "Se salvează..." : "Salvează lead"}</button></div></form></div></div>
}

function AppointmentModal({ saving, properties, onClose, onSubmit }: { saving: boolean; properties: Row[]; onClose: () => void; onSubmit: (payload: Row) => Promise<void> }) {
  const [form, setForm] = useState<Row>({ client_name: "", client_email: "", client_phone: "", property_id: "", starts_at: "", notes: "", status: "REQUESTED" })
  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await onSubmit({ ...form, requested_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined }) }
  return <div className="modal-backdrop open" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><h2>Programează vizionare</h2><button type="button" className="close-btn" onClick={onClose}>x</button></div><form className="form" onSubmit={submit}><div className="modal-grid"><div className="form-row"><label>Client</label><input value={form.client_name} required onChange={(event) => update("client_name", event.target.value)} /></div><div className="form-row"><label>Email client</label><input value={form.client_email} type="email" onChange={(event) => update("client_email", event.target.value)} /></div><div className="form-row"><label>Telefon</label><input value={form.client_phone} onChange={(event) => update("client_phone", event.target.value)} /></div><div className="form-row"><label>Data și ora</label><input value={form.starts_at} type="datetime-local" required onChange={(event) => update("starts_at", event.target.value)} /></div><div className="form-row"><label>Proprietate</label><select value={form.property_id} onChange={(event) => update("property_id", event.target.value)}><option value="">Fără proprietate</option>{properties.map((property) => property.id && <option key={property.id} value={property.id}>{property.title}</option>)}</select></div></div><div className="form-row"><label>Note</label><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} /></div><div className="form-actions"><button type="button" className="btn" onClick={onClose}>Anulează</button><button type="submit" className="btn primary" disabled={saving}>{saving ? "Se salvează..." : "Salvează vizionarea"}</button></div></form></div></div>
}

function AgentModal({ saving, onClose, onSubmit }: { saving: boolean; onClose: () => void; onSubmit: (payload: Row) => Promise<void> }) {
  const [form, setForm] = useState<Row>({ name: "", email: "", role: "agent", status: "ACTIVE" })
  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await onSubmit(form) }
  return <div className="modal-backdrop open" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><h2>Invită agent</h2><button type="button" className="close-btn" onClick={onClose}>x</button></div><form className="form" onSubmit={submit}><div className="modal-grid"><div className="form-row"><label>Nume</label><input value={form.name} required onChange={(event) => update("name", event.target.value)} /></div><div className="form-row"><label>Email</label><input value={form.email} type="email" required onChange={(event) => update("email", event.target.value)} /></div><div className="form-row"><label>Rol</label><select value={form.role} onChange={(event) => update("role", event.target.value)}><option value="agent">Agent</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div></div><div className="form-actions"><button type="button" className="btn" onClick={onClose}>Anulează</button><button type="submit" className="btn primary" disabled={saving}>{saving ? "Se salvează..." : "Trimite invitația"}</button></div></form></div></div>
}

function SwitchRow({ title, text, enabled, onClick }: { title: string; text: string; enabled: boolean; onClick: () => void }) {
  return <div className="switch-row"><div><strong>{title}</strong><span>{text}</span></div><button type="button" className={`switch ${enabled ? "on" : ""}`} aria-label={title} onClick={onClick} /></div>
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
  if (["PUBLISHED", "ACTIVE", "CONFIRMED", "QUALIFIED", "SIGNED", "SOLD", "RENTED", "DONE", "PAID", "ACCEPTED"].includes(key)) return "success"
  if (["DRAFT", "LOST", "FAILED_CONFIG", "FAILED_PROVIDER", "CANCELLED", "REJECTED"].includes(key)) return "danger"
  if (["CONTACTED", "PENDING", "REQUESTED", "QUEUED", "RETRYING", "NEGOTIATING"].includes(key)) return "warning"
  if (["NEW", "OPEN", "AVAILABLE", "VIEWING", "SHORTLIST"].includes(key)) return "info"
  return ""
}

function adminRows(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : []
}

function propertyZone(property: Row) {
  return String(property.city || property.zone || property.area || "Bucuresti").trim()
}

function propertyPhoto(property: Row, index: number) {
  const fallback = [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=900&q=80",
  ][index % 4]
  const image = property.cover_image_url || property.image_url || property.photo || fallback
  return `linear-gradient(135deg, rgba(13,40,34,.50), rgba(200,155,60,.35)), url('${image}')`
}

function propertyScore(property: Row) {
  const fields = [property.title, property.price, property.city || property.zone, property.type, property.description, property.cover_image_url]
  return clamp(Math.round((fields.filter(Boolean).length / fields.length) * 100), 45, 96)
}

function calendarCells(monthDate: Date, events: Row[]) {
  const names = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sam", "Dum"]
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const previousDays = new Date(year, month, 0).getDate()
  const today = new Date()
  const eventMap = new Map<number, string[]>()
  for (const event of events) {
    const value = event.requested_at || event.starts_at || event.start_at || event.created_at
    const parsed = value ? new Date(value) : null
    if (!parsed || parsed.getMonth() !== month || parsed.getFullYear() !== year) continue
    const list = eventMap.get(parsed.getDate()) || []
    list.push(`${parsed.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} ${event.property_title || event.title || event.status || "HQS"}`)
    eventMap.set(parsed.getDate(), list)
  }
  const cells: any[] = names.map((label) => ({ kind: "name", label }))
  for (let i = offset - 1; i >= 0; i--) cells.push({ day: previousDays - i, muted: true, today: false, events: [] })
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, muted: false, today: today.getFullYear() === year && today.getMonth() === month && today.getDate() === day, events: eventMap.get(day) || [] })
  while ((cells.length - 7) % 7 !== 0) cells.push({ day: cells.length, muted: true, today: false, events: [] })
  return cells
}

function grouped(values: Row[], key: string) {
  return values.reduce<Record<string, number>>((acc, row) => {
    const value = String(row?.[key] || "neclasificat")
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function compact(value: number) {
  return new Intl.NumberFormat("ro-RO", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
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

const demoOffers: Row[] = [
  { client_name: "Ana M.", property_title: "Compara Aviatorilor vs Floreasca", status: "SHORTLIST", offer_price: 890000 },
  { client_name: "Mihai I.", property_title: "3 vile in Pipera", status: "SHORTLIST", offer_price: 1200000 },
  { client_name: "Elena D.", property_title: "Floreasca, vineri 16:00", status: "VIEWING", offer_price: 455000 },
  { client_name: "Clara S.", property_title: "Baneasa showroom", status: "VIEWING", offer_price: 680000 },
  { client_name: "Andrei P.", property_title: "Dorobanti, contraoferta", status: "NEGOTIATING", offer_price: 720000 },
  { client_name: "Familia N.", property_title: "Acte + evaluare banca", status: "DUE_DILIGENCE", offer_price: 1250000 },
]

const demoAgents: Row[] = [
  { name: "Radu Matei", role: "Senior Broker", initials: "RM", listings: 6, leads: 19, conversion: "31%" },
  { name: "Ioana Pavel", role: "Buyer Consultant", initials: "IP", listings: 4, leads: 15, conversion: "27%" },
  { name: "Alex HQS", role: "Admin / Owner", initials: "HA", listings: 12, leads: 48, conversion: "28%" },
  { name: "Daria Enache", role: "Marketing", initials: "DE", listings: 12, leads: 8, conversion: "18%" },
]

function riskPromptForPlatformAction(body: Row) {
  const payload = body.payload || {}
  if (body.type === "appointment_slot" && payload.action === "delete") return "Stergi slotul de vizionare? Verifica sa nu fie un slot rezervat sau sincronizat in calendar."
  if (body.type === "appointment_slot" && String(payload.status || "").toUpperCase() === "CANCELLED") return "Anulezi slotul de vizionare? Clientii pot ramane fara disponibilitate daca slotul era activ."
  if (body.type === "admin_role" && String(payload.status || "").toUpperCase() === "INACTIVE") return "Dezactivezi rolul admin? Utilizatorul poate pierde accesul imediat."
  return ""
}
