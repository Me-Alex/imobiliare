"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"

type Lead = { id: string; name: string; phone: string | null; email: string | null; message: string | null; status: string; source: string | null; created_at: string }
type Property = { id: string; title: string; type: string; status: string; price: number; currency?: string | null; city: string; area_sqm: number; rooms: number; featured: boolean; slug: string }
type Appointment = { id: string; client_name: string; client_phone: string | null; client_email: string | null; requested_at: string; notes: string | null; status: string | null; property_title?: string | null; property_slug?: string | null; created_at: string }
type AuditLog = { id: string; action: string; entity: string; entity_id: string | null; details: Record<string, unknown>; created_at: string }
type PaymentPlan = { id: string; name: string; property: string | null; total: number; advance: number; months: number; status: string; notes: string | null }
type Project = { id: string; name: string; area: string | null; stage: string; progress: number; deadline: string | null; notes: string | null }
type TeamUser = { id: string; name: string; email: string | null; role: string; status: string }
type Owner = { id: string; name: string; phone: string | null; email: string | null; type: string; status: string; notes: string | null }
type DocumentItem = { id: string; title: string; owner_name: string | null; property: string | null; type: string; status: string; expires_at: string | null; url: string | null; notes: string | null }
type NotificationItem = { id: string; title: string; body: string | null; channel: string; status: string; due_at: string | null; target: string | null }
type ActivityItem = { id: string; title: string; entity: string; status: string; priority: string; due_at: string | null; notes: string | null }
type AdminSettings = { agency: string; commission: number; target: number; vat: number; theme: string }
type ModuleType = "payment_plans" | "projects" | "team_users" | "owners" | "documents" | "notifications" | "activities"

const views = [
  ["dashboard", "Dashboard"], ["properties", "Proprietati"], ["clients", "Clienti"], ["appointments", "Vizionari"],
  ["owners", "Proprietari"], ["documents", "Documente"], ["notifications", "Notificari"], ["activities", "Activitati"],
  ["payments", "Planuri plata"], ["projects", "Proiecte"], ["offplan", "Constructii"], ["commission", "Comisioane"],
  ["calculator", "Calculator"], ["evaluator", "Evaluator"], ["users", "Utilizatori"], ["audit", "Audit"], ["settings", "Setari"],
] as const
type View = (typeof views)[number][0]

const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"]
const appointmentStatuses = ["REQUESTED", "CONFIRMED", "DONE", "CANCELLED"]
const defaultSettings: AdminSettings = { agency: "HQS Imobiliare", commission: 3, target: 500000, vat: 19, theme: "system" }

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}

const money = (value: number, currency = "EUR") => `${currency} ${Number(value || 0).toLocaleString("ro-RO")}`
const rowSearch = <T extends Record<string, any>>(rows: T[], query: string) => {
  const q = query.trim().toLowerCase()
  return q ? rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q)) : rows
}

export default function AdminPage() {
  const [view, setView] = useState<View>("dashboard")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings)

  const load = async () => {
    setLoading(true); setError("")
    try {
      const [data, modules] = await Promise.all([api("/api/admin/data"), api("/api/admin/modules")])
      setLeads(data.leads || []); setProperties(data.properties || []); setAppointments(data.appointments || []); setAudit(data.audit || [])
      setPaymentPlans(modules.payment_plans || []); setProjects(modules.projects || []); setTeamUsers(modules.team_users || [])
      setOwners(modules.owners || []); setDocuments(modules.documents || []); setNotifications(modules.notifications || []); setActivities(modules.activities || [])
      setSettings({ ...defaultSettings, ...(modules.settings || {}) })
    } catch (err: any) { setError(err.message || "Nu am putut incarca baza de date.") }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = {
    leads: useMemo(() => rowSearch(leads, query), [leads, query]),
    properties: useMemo(() => rowSearch(properties, query), [properties, query]),
    appointments: useMemo(() => rowSearch(appointments, query), [appointments, query]),
    owners: useMemo(() => rowSearch(owners, query), [owners, query]),
    documents: useMemo(() => rowSearch(documents, query), [documents, query]),
    notifications: useMemo(() => rowSearch(notifications, query), [notifications, query]),
    activities: useMemo(() => rowSearch(activities, query), [activities, query]),
    audit: useMemo(() => rowSearch(audit, query), [audit, query]),
  }
  const portfolio = properties.filter((p) => p.status === "PUBLISHED").reduce((sum, p) => sum + Number(p.price || 0), 0)

  const updateLead = async (id: string, status: string) => withSave(id, async () => {
    const data = await api(`/api/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    setLeads((rows) => rows.map((row) => row.id === id ? data.lead : row))
  })
  const updateAppointment = async (id: string, status: string) => withSave(id, async () => {
    const data = await api(`/api/admin/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    setAppointments((rows) => rows.map((row) => row.id === id ? { ...row, ...data.appointment } : row))
    load()
  })
  const updateProperty = async (id: string, payload: Record<string, unknown>) => withSave(id, async () => {
    const data = await api(`/api/admin/properties/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
    setProperties((rows) => rows.map((row) => row.id === id ? data.property : row))
  })
  const deleteProperty = async (id: string) => {
    if (!confirm("Sigur stergi aceasta proprietate?")) return
    await withSave(id, async () => { await api(`/api/admin/properties/${id}`, { method: "DELETE" }); setProperties((rows) => rows.filter((row) => row.id !== id)) })
  }
  const saveModule = async (type: ModuleType, payload: Record<string, unknown>) => withSave(String(payload.id || type), async () => {
    const data = await api("/api/admin/modules", { method: "POST", body: JSON.stringify({ type, payload }) })
    const setters = { payment_plans: setPaymentPlans, projects: setProjects, team_users: setTeamUsers, owners: setOwners, documents: setDocuments, notifications: setNotifications, activities: setActivities }
    setters[type]((rows: any[]) => rows.some((row) => row.id === data.item.id) ? rows.map((row) => row.id === data.item.id ? data.item : row) : [data.item, ...rows])
  })
  const deleteModule = async (type: ModuleType, id: string) => {
    if (!confirm("Sigur stergi acest element?")) return
    await withSave(id, async () => {
      await api(`/api/admin/modules?type=${type}&id=${id}`, { method: "DELETE" })
      const setters = { payment_plans: setPaymentPlans, projects: setProjects, team_users: setTeamUsers, owners: setOwners, documents: setDocuments, notifications: setNotifications, activities: setActivities }
      setters[type]((rows: any[]) => rows.filter((row) => row.id !== id))
    })
  }
  const saveSettings = async (payload: AdminSettings) => withSave("settings", async () => {
    const data = await api("/api/admin/modules", { method: "POST", body: JSON.stringify({ type: "settings", payload }) })
    setSettings({ ...defaultSettings, ...(data.settings || {}) })
  })
  async function withSave(id: string, fn: () => Promise<void>) {
    setSavingId(id); setError("")
    try { await fn() } catch (err: any) { setError(err.message || "Actiunea a esuat") } finally { setSavingId("") }
  }
  const exportReport = () => {
    const rows = [["Tip", "Nume", "Status", "Valoare"], ...properties.map((p) => ["Proprietate", p.title, p.status, p.price]), ...leads.map((l) => ["Lead", l.name, l.status, l.phone || l.email || ""]), ...appointments.map((a) => ["Vizionare", a.client_name, a.status || "", a.requested_at]), ...owners.map((o) => ["Proprietar", o.name, o.status, o.phone || o.email || ""]), ...documents.map((d) => ["Document", d.title, d.status, d.expires_at || ""]), ...notifications.map((n) => ["Notificare", n.title, n.status, n.due_at || ""]), ...activities.map((a) => ["Activitate", a.title, a.status, a.priority])]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    link.download = "hqs-raport.csv"
    link.click()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-bg-primary dark:text-text-primary">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-bg-surface dark:bg-bg-card">
        <div className="flex h-[68px] items-center gap-3 border-b border-slate-200 px-5 dark:border-bg-surface"><span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-white font-black">H</span><div><b>HQS Admin</b><p className="text-xs text-slate-500">Baza de date live</p></div></div>
        <nav className="space-y-1 p-3">{views.map(([key, label]) => <button key={key} onClick={() => setView(key)} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold ${view === key ? "bg-accent text-white" : "text-slate-600 hover:bg-slate-100 dark:text-text-muted dark:hover:bg-bg-secondary"}`}>{label}</button>)}</nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-bg-surface dark:bg-bg-card/95">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-accent dark:border-bg-surface dark:bg-bg-secondary" placeholder="Cauta proprietati, clienti, status..." />
          <div className="flex items-center gap-2"><ThemeToggle /><button onClick={load} className="hidden rounded-lg border px-3 py-2 text-sm font-bold sm:block">Refresh</button><button onClick={exportReport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Raport</button><Link href="/" target="_blank" className="rounded-lg border px-3 py-2 text-sm font-bold">Site</Link></div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white p-3 lg:hidden dark:border-bg-surface dark:bg-bg-card">{views.map(([key, label]) => <button key={key} onClick={() => setView(key)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-bold ${view === key ? "border-accent bg-accent text-white" : "border-slate-200 dark:border-bg-surface"}`}>{label}</button>)}</nav>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-8">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
          {view === "dashboard" && <Dashboard loading={loading} leads={leads} properties={properties} appointments={appointments} portfolio={portfolio} paymentPlans={paymentPlans} projects={projects} owners={owners} documents={documents} notifications={notifications} activities={activities} settings={settings} exportReport={exportReport} />}
          {view === "properties" && <Properties rows={filtered.properties} savingId={savingId} updateProperty={updateProperty} deleteProperty={deleteProperty} />}
          {view === "clients" && <Clients rows={filtered.leads} savingId={savingId} updateLead={updateLead} />}
          {view === "appointments" && <Appointments rows={filtered.appointments} savingId={savingId} updateAppointment={updateAppointment} />}
          {view === "owners" && <Owners rows={filtered.owners} savingId={savingId} save={(payload: any) => saveModule("owners", payload)} remove={(id: string) => deleteModule("owners", id)} />}
          {view === "documents" && <Documents rows={filtered.documents} savingId={savingId} save={(payload: any) => saveModule("documents", payload)} remove={(id: string) => deleteModule("documents", id)} />}
          {view === "notifications" && <Notifications rows={filtered.notifications} savingId={savingId} save={(payload: any) => saveModule("notifications", payload)} remove={(id: string) => deleteModule("notifications", id)} />}
          {view === "activities" && <Activities rows={filtered.activities} savingId={savingId} save={(payload: any) => saveModule("activities", payload)} remove={(id: string) => deleteModule("activities", id)} />}
          {view === "payments" && <PaymentPlans rows={paymentPlans} savingId={savingId} save={(payload: any) => saveModule("payment_plans", payload)} remove={(id: string) => deleteModule("payment_plans", id)} />}
          {view === "projects" && <Projects rows={projects} savingId={savingId} save={(payload: any) => saveModule("projects", payload)} remove={(id: string) => deleteModule("projects", id)} />}
          {view === "offplan" && <Offplan rows={projects} />}
          {view === "users" && <Users rows={teamUsers} savingId={savingId} save={(payload: any) => saveModule("team_users", payload)} remove={(id: string) => deleteModule("team_users", id)} />}
          {view === "audit" && <Audit rows={filtered.audit} />}
          {view === "commission" && <Commission properties={properties} settings={settings} />}
          {view === "calculator" && <Calculator />}
          {view === "evaluator" && <Evaluator />}
          {view === "settings" && <Settings settings={settings} saving={savingId === "settings"} save={saveSettings} />}
        </main>
      </div>
    </div>
  )
}

function Dashboard({ loading, leads, properties, appointments, portfolio, paymentPlans, projects, owners, documents, notifications, activities, settings, exportReport }: any) {
  const cards = [["Proprietati", properties.length], ["Clienti activi", leads.filter((l: Lead) => !["CLOSED", "LOST"].includes(l.status)).length], ["Sarcini deschise", activities.filter((a: ActivityItem) => a.status !== "DONE").length], ["Portofoliu", money(portfolio)]]
  return <Section title="Dashboard" subtitle="Overview pentru business, clienti si portofoliu." action={<button onClick={exportReport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Genereaza raport</button>}>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <Panel key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{loading ? "-" : value}</p><p className="mt-3 text-sm font-bold text-emerald-600">+12.5%</p></Panel>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><Panel><h2 className="mb-4 text-lg font-black">Evolutie vanzari</h2><SalesChart /></Panel><Panel><h2 className="mb-4 text-lg font-black">Tendinte piata</h2>{["Bucuresti Nord", "Pipera", "Corbeanca", "Floreasca"].map((area, i) => <Mini key={area} title={area} meta="Pret mediu" value={`EUR ${[2450, 2190, 1680, 3010][i]}/mp`} />)}</Panel></div>
    <div className="grid gap-5 xl:grid-cols-3"><Panel><h2 className="mb-3 font-black">Vizionari apropiate</h2>{appointments.slice(0, 4).map((a: Appointment) => <Mini key={a.id} title={a.client_name} meta={a.property_title || a.client_phone || "Vizionare"} value={new Date(a.requested_at).toLocaleDateString("ro-RO")} />)}</Panel><Panel><h2 className="mb-3 font-black">Proiecte active</h2>{projects.slice(0, 4).map((p: Project) => <Mini key={p.id} title={p.name} meta={`${p.area || "-"} - ${p.stage}`} value={`${p.progress}%`} />)}</Panel><Panel><h2 className="mb-3 font-black">Planuri plata</h2>{paymentPlans.slice(0, 4).map((p: PaymentPlan) => <Mini key={p.id} title={p.name} meta={p.property || "Portofoliu"} value={money(p.total - p.advance)} />)}<p className="mt-3 text-xs text-slate-500">Comision curent: {settings.commission}%</p></Panel></div>
    <div className="grid gap-5 xl:grid-cols-4"><Panel><h2 className="mb-3 font-black">Proprietari</h2>{owners.slice(0, 4).map((o: Owner) => <Mini key={o.id} title={o.name} meta={o.phone || o.email || o.type} value={o.status} />)}</Panel><Panel><h2 className="mb-3 font-black">Documente</h2>{documents.slice(0, 4).map((d: DocumentItem) => <Mini key={d.id} title={d.title} meta={d.owner_name || d.property || d.type} value={d.status} />)}</Panel><Panel><h2 className="mb-3 font-black">Notificari</h2>{notifications.slice(0, 4).map((n: NotificationItem) => <Mini key={n.id} title={n.title} meta={n.target || n.channel} value={n.status} />)}</Panel><Panel><h2 className="mb-3 font-black">Activitati</h2>{activities.slice(0, 4).map((a: ActivityItem) => <Mini key={a.id} title={a.title} meta={a.entity} value={a.priority} />)}</Panel></div>
  </Section>
}

function Properties({ rows, savingId, updateProperty, deleteProperty }: any) {
  return <Section title="Proprietati" subtitle="Listari reale din Supabase, cu actiuni functionale." action={<Link href="/admin/proprietate-noua" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white">Proprietate noua</Link>}><Panel tight><Table heads={["Titlu", "Tip", "Pret", "Suprafata", "Status", "Selectata", "Actiuni"]}>{rows.map((p: Property) => <tr key={p.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><b>{p.title}</b><p className="text-xs text-slate-500">{p.city}</p></Td><Td>{p.type}</Td><Td className="font-bold text-accent">{money(p.price, p.currency || "EUR")}</Td><Td>{p.area_sqm} mp</Td><Td><Badge>{p.status}</Badge></Td><Td><button disabled={savingId === p.id} onClick={() => updateProperty(p.id, { featured: !p.featured })} className="rounded-lg border px-3 py-1 text-xs font-bold">{p.featured ? "Da" : "Nu"}</button></Td><Td><div className="flex gap-2"><button disabled={savingId === p.id} onClick={() => updateProperty(p.id, { status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })} className="rounded-lg border px-3 py-1 text-xs font-bold">Status</button><Link href={`/proprietate/${p.slug}`} target="_blank" className="rounded-lg border px-3 py-1 text-xs font-bold">Vezi</Link><button disabled={savingId === p.id} onClick={() => deleteProperty(p.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600">Sterge</button></div></Td></tr>)}</Table></Panel></Section>
}

function Clients({ rows, savingId, updateLead }: any) {
  return <Section title="Clienti" subtitle="Lead-uri din site, cu status CRM salvabil."><Panel tight><Table heads={["Client", "Contact", "Mesaj", "Status", "Data"]}>{rows.map((l: Lead) => <tr key={l.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><b>{l.name}</b><p className="text-xs text-slate-500">{l.email || "fara email"}</p></Td><Td>{l.phone ? <a className="text-accent" href={`tel:${l.phone}`}>{l.phone}</a> : "-"}</Td><Td><p className="max-w-sm truncate">{l.message || "-"}</p></Td><Td><select value={l.status} disabled={savingId === l.id} onChange={(e) => updateLead(l.id, e.target.value)} className="rounded-lg border bg-white px-2 py-1 text-xs font-bold dark:bg-bg-secondary">{leadStatuses.map((s) => <option key={s}>{s}</option>)}</select></Td><Td>{new Date(l.created_at).toLocaleDateString("ro-RO")}</Td></tr>)}</Table></Panel></Section>
}

function Appointments({ rows, savingId, updateAppointment }: any) {
  return <Section title="Vizionari" subtitle="Cereri de vizionare primite din paginile proprietatilor."><Panel tight><Table heads={["Client", "Proprietate", "Data ceruta", "Status", "Note"]}>{rows.map((a: Appointment) => <tr key={a.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><b>{a.client_name}</b><p className="text-xs text-slate-500">{a.client_phone || a.client_email || "fara contact"}</p></Td><Td>{a.property_slug ? <Link className="text-accent font-bold" href={`/proprietate/${a.property_slug}`} target="_blank">{a.property_title || "Proprietate"}</Link> : a.property_title || "-"}</Td><Td>{new Date(a.requested_at).toLocaleString("ro-RO")}</Td><Td><select value={a.status || "REQUESTED"} disabled={savingId === a.id} onChange={(e) => updateAppointment(a.id, e.target.value)} className="rounded-lg border bg-white px-2 py-1 text-xs font-bold dark:bg-bg-secondary">{appointmentStatuses.map((s) => <option key={s}>{s}</option>)}</select></Td><Td><p className="max-w-sm truncate">{a.notes || "-"}</p></Td></tr>)}</Table></Panel></Section>
}

function PaymentPlans({ rows, savingId, save, remove }: any) { return <ModuleEditor title="Planuri plata" subtitle="Planuri reale salvate in Supabase." fields={["name", "property", "total", "advance", "months", "status", "notes"]} defaults={{ months: "24", status: "ACTIVE" }} rows={rows} savingId={savingId} save={save} remove={remove} render={(row: PaymentPlan) => <Mini key={row.id} title={row.name} meta={`${row.property || "Fara proprietate"} - ${row.months} luni`} value={money(row.total - row.advance)} onDelete={() => remove(row.id)} />} /> }
function Projects({ rows, savingId, save, remove }: any) { return <ModuleEditor title="Proiecte" subtitle="Urmarire operationala pentru etape si progres." fields={["name", "area", "stage", "progress", "deadline", "notes"]} defaults={{ stage: "Planificare", progress: "0" }} rows={rows} savingId={savingId} save={save} remove={remove} render={(row: Project) => <Mini key={row.id} title={row.name} meta={`${row.area || "-"} - ${row.stage}`} value={`${row.progress}%`} onDelete={() => remove(row.id)} />} /> }
function Users({ rows, savingId, save, remove }: any) { return <ModuleEditor title="Utilizatori" subtitle="Echipa operationala salvata in Supabase." fields={["name", "email", "role", "status"]} defaults={{ role: "Agent", status: "ACTIVE" }} rows={rows} savingId={savingId} save={save} remove={remove} render={(row: TeamUser) => <Mini key={row.id} title={row.name} meta={`${row.role} - ${row.email || "fara email"}`} value={row.status} onDelete={() => remove(row.id)} />} /> }
function Owners({ rows, savingId, save, remove }: any) { return <ModuleEditor title="Proprietari" subtitle="CRM pentru proprietari, vanzatori si parteneri." fields={["name", "phone", "email", "type", "status", "notes"]} defaults={{ type: "Persoana fizica", status: "ACTIVE" }} rows={rows} savingId={savingId} save={save} remove={remove} render={(row: Owner) => <Mini key={row.id} title={row.name} meta={`${row.type} - ${row.phone || row.email || "fara contact"}`} value={row.status} onDelete={() => remove(row.id)} />} /> }
function Documents({ rows, savingId, save, remove }: any) { return <ModuleEditor title="Documente" subtitle="Contracte, acte si termene importante pentru portofoliu." fields={["title", "owner_name", "property", "type", "status", "expires_at", "url", "notes"]} requiredKey="title" defaults={{ type: "Contract", status: "PENDING" }} rows={rows} savingId={savingId} save={save} remove={remove} render={(row: DocumentItem) => <Mini key={row.id} title={row.title} meta={`${row.owner_name || row.property || "Fara asociere"} - ${row.type}`} value={row.expires_at ? new Date(row.expires_at).toLocaleDateString("ro-RO") : row.status} onDelete={() => remove(row.id)} />} /> }
function Notifications({ rows, savingId, save, remove }: any) { return <ModuleEditor title="Notificari" subtitle="Reminder-e si mesaje planificate pentru clienti si echipa." fields={["title", "body", "channel", "status", "due_at", "target"]} requiredKey="title" defaults={{ channel: "EMAIL", status: "DRAFT" }} rows={rows} savingId={savingId} save={save} remove={remove} render={(row: NotificationItem) => <Mini key={row.id} title={row.title} meta={`${row.channel} - ${row.target || "fara destinatar"}`} value={row.status} onDelete={() => remove(row.id)} />} /> }
function Activities({ rows, savingId, save, remove }: any) { return <ModuleEditor title="Activitati" subtitle="Task-uri operationale pentru follow-up, documente si tranzactii." fields={["title", "entity", "status", "priority", "due_at", "notes"]} requiredKey="title" defaults={{ entity: "CRM", status: "OPEN", priority: "MEDIUM" }} rows={rows} savingId={savingId} save={save} remove={remove} render={(row: ActivityItem) => <Mini key={row.id} title={row.title} meta={`${row.entity} - ${row.status}`} value={row.priority} onDelete={() => remove(row.id)} />} /> }

function ModuleEditor({ title, subtitle, fields, defaults, rows, savingId, save, render, requiredKey = "name" }: any) {
  const blank = fields.reduce((acc: any, key: string) => ({ ...acc, [key]: defaults?.[key] || "" }), {})
  const [form, setForm] = useState(blank)
  const submit = () => { if (form[requiredKey]) { save(form); setForm(blank) } }
  return <Section title={title} subtitle={subtitle}><Panel><FormGrid>{fields.filter((f: string) => !["notes", "body"].includes(f)).map((key: string) => <Input key={key} label={key} value={form[key]} setValue={(v: string) => setForm({ ...form, [key]: v })} />)}</FormGrid>{fields.includes("body") && <Textarea label="body" value={form.body} setValue={(v: string) => setForm({ ...form, body: v })} />}{fields.includes("notes") && <Textarea label="notes" value={form.notes} setValue={(v: string) => setForm({ ...form, notes: v })} />}<button onClick={submit} disabled={!form[requiredKey] || savingId === title} className="mt-4 rounded-lg bg-accent px-4 py-3 font-bold text-white disabled:opacity-50">Adauga</button><div className="mt-5 grid gap-3 lg:grid-cols-2">{rows.map(render)}</div></Panel></Section>
}

function Offplan({ rows }: any) { return <Section title="Constructii" subtitle="Status off-plan si santiere active conectate la proiecte."><div className="grid gap-4 lg:grid-cols-2">{rows.map((row: Project) => <Panel key={row.id}><div className="flex items-start justify-between gap-4"><div><h2 className="font-black">{row.name}</h2><p className="text-sm text-slate-500">{row.area || "Zona necompletata"} - {row.stage}</p></div><Badge>{row.deadline ? new Date(row.deadline).toLocaleDateString("ro-RO") : "fara termen"}</Badge></div><div className="mt-5 h-3 rounded-full bg-slate-100 dark:bg-bg-secondary"><div className="h-3 rounded-full bg-accent" style={{ width: `${row.progress}%` }} /></div><p className="mt-3 text-sm text-slate-500">{row.notes || "Fara note."}</p></Panel>)}</div></Section> }
function Audit({ rows }: any) { return <Section title="Audit" subtitle="Istoric actiuni importante din admin si formulare."><Panel tight><Table heads={["Actiune", "Entitate", "Detalii", "Data"]}>{rows.map((row: AuditLog) => <tr key={row.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><Badge>{row.action}</Badge></Td><Td>{row.entity}</Td><Td><p className="max-w-lg truncate">{JSON.stringify(row.details || {})}</p></Td><Td>{new Date(row.created_at).toLocaleString("ro-RO")}</Td></tr>)}</Table></Panel></Section> }
function Commission({ properties, settings }: any) { const rate = Number(settings.commission || 3); const total = properties.filter((p: Property) => p.status === "PUBLISHED").reduce((s: number, p: Property) => s + p.price * (rate / 100), 0); return <Section title="Comisioane" subtitle={`Estimare comision agentie la ${rate}%.`}><Panel><p className="text-sm text-slate-500">Total estimat</p><p className="text-3xl font-black">{money(total)}</p><p className="mt-3 text-sm text-slate-500">Tinta curenta: {money(settings.target || 0)}</p></Panel></Section> }
function Calculator() { const [price, setPrice] = useState("180000"), [advance, setAdvance] = useState("20"), [years, setYears] = useState("25"); const loan = Number(price) * (1 - Number(advance) / 100), monthly = loan / (Number(years) * 12); return <Section title="Calculator" subtitle="Credit si rata lunara orientativa."><Panel><div className="grid gap-3 md:grid-cols-3"><Input label="Pret" value={price} setValue={setPrice} /><Input label="Avans %" value={advance} setValue={setAdvance} /><Input label="Ani" value={years} setValue={setYears} /></div><Result label="Rata lunara estimata" value={money(monthly)} /></Panel></Section> }
function Evaluator() { const [area, setArea] = useState("85"), [mp, setMp] = useState("2200"); return <Section title="Evaluator" subtitle="Estimare rapida dupa suprafata si pret/mp."><Panel><div className="grid gap-3 md:grid-cols-2"><Input label="Suprafata mp" value={area} setValue={setArea} /><Input label="EUR/mp" value={mp} setValue={setMp} /></div><Result label="Valoare estimata" value={money(Number(area) * Number(mp))} /></Panel></Section> }
function Settings({ settings, saving, save }: any) { const [form, setForm] = useState(settings); useEffect(() => setForm(settings), [settings]); return <Section title="Setari" subtitle="Configurari rapide salvate in baza de date."><Panel><div className="grid gap-3 md:grid-cols-4"><Input label="Agentie" value={form.agency} setValue={(v: string) => setForm({ ...form, agency: v })} /><Input label="Comision %" value={String(form.commission)} setValue={(v: string) => setForm({ ...form, commission: Number(v) })} /><Input label="Tinta EUR" value={String(form.target)} setValue={(v: string) => setForm({ ...form, target: Number(v) })} /><Input label="TVA %" value={String(form.vat)} setValue={(v: string) => setForm({ ...form, vat: Number(v) })} /></div><button onClick={() => save(form)} disabled={saving} className="mt-4 rounded-lg bg-accent px-4 py-3 font-bold text-white disabled:opacity-50">Salveaza setari</button></Panel></Section> }

function Section({ title, subtitle, action, children }: any) { return <section className="space-y-6"><div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between dark:border-bg-surface"><div><h1 className="text-3xl font-black">{title}</h1><p className="text-sm text-slate-500 dark:text-text-muted">{subtitle}</p></div>{action}</div>{children}</section> }
function Panel({ children, tight = false }: any) { return <div className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-bg-surface dark:bg-bg-card ${tight ? "overflow-hidden" : "p-5"}`}>{children}</div> }
function Table({ heads, children }: any) { return <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead><tr>{heads.map((h: string) => <th key={h} className="bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500 dark:bg-bg-secondary">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div> }
function Td({ children, className = "" }: any) { return <td className={`px-5 py-4 align-middle ${className}`}>{children}</td> }
function Input({ label, value, setValue }: any) { return <label><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><input className="form-input" value={value} onChange={(e) => setValue(e.target.value)} /></label> }
function Textarea({ label, value, setValue }: any) { return <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><textarea className="form-input min-h-24" value={value} onChange={(e) => setValue(e.target.value)} /></label> }
function FormGrid({ children }: any) { return <div className="grid gap-3 md:grid-cols-3">{children}</div> }
function Result({ label, value }: any) { return <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-bg-secondary"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-black">{value}</p></div> }
function Mini({ title, meta, value, onDelete }: any) { return <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><div><b>{title}</b><p className="text-sm text-slate-500">{meta}</p></div><div className="text-right"><b className="text-accent">{value}</b>{onDelete && <button onClick={onDelete} className="block text-xs font-bold text-rose-500">Sterge</button>}</div></div> }
function Badge({ children }: any) { return <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black dark:border-bg-surface dark:bg-bg-secondary">{children}</span> }
function SalesChart() { const points = [40, 48, 43, 57, 54, 72, 66, 82, 79, 91, 85, 100].map((v, i) => `${i * 72},${120 - v}`); return <svg viewBox="0 0 800 180" className="h-72 w-full"><polyline points={points.join(" ")} fill="none" stroke="rgb(var(--color-accent))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{points.map((p) => { const [x, y] = p.split(","); return <circle key={p} cx={x} cy={y} r="5" fill="white" stroke="rgb(var(--color-accent))" strokeWidth="3" /> })}</svg> }
