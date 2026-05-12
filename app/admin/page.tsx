"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"

type Lead = { id: string; name: string; phone: string | null; email: string | null; message: string | null; status: string; source: string | null; created_at: string }
type Property = { id: string; title: string; type: string; status: string; price: number; currency?: string | null; city: string; area_sqm: number; rooms: number; featured: boolean; slug: string }
type PaymentPlan = { id: string; name: string; property: string | null; total: number; advance: number; months: number; status: string; notes: string | null }
type Project = { id: string; name: string; area: string | null; stage: string; progress: number; deadline: string | null; notes: string | null }
type TeamUser = { id: string; name: string; email: string | null; role: string; status: string }
type AdminSettings = { agency: string; commission: number; target: number; vat: number; theme: string }
type ModuleType = "payment_plans" | "projects" | "team_users"

const nav = ["dashboard", "properties", "clients", "payments", "projects", "offplan", "commission", "calculator", "evaluator", "users", "settings"] as const
const labels: Record<string, string> = { dashboard: "Dashboard", properties: "Proprietati", clients: "Clienti", payments: "Planuri plata", projects: "Proiecte", offplan: "Constructii", commission: "Comisioane", calculator: "Calculator", evaluator: "Evaluator", users: "Utilizatori", settings: "Setari" }
const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"]
const defaultSettings: AdminSettings = { agency: "HQS Imobiliare", commission: 3, target: 500000, vat: 19, theme: "system" }

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}
function money(value: number, currency = "EUR") { return `${currency} ${Number(value || 0).toLocaleString("ro-RO")}` }

export default function AdminPage() {
  const [view, setView] = useState<(typeof nav)[number]>("dashboard")
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings)

  const load = async () => {
    setLoading(true); setError("")
    try {
      const [data, modules] = await Promise.all([api("/api/admin/data"), api("/api/admin/modules")])
      setLeads(data.leads || []); setProperties(data.properties || [])
      setPaymentPlans(modules.payment_plans || []); setProjects(modules.projects || []); setTeamUsers(modules.team_users || [])
      setSettings({ ...defaultSettings, ...(modules.settings || {}) })
    }
    catch (err: any) { setError(err.message || "Nu am putut incarca baza de date.") }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filteredLeads = useMemo(() => filterRows(leads, query), [leads, query])
  const filteredProperties = useMemo(() => filterRows(properties, query), [properties, query])
  const portfolio = properties.filter((p) => p.status === "PUBLISHED").reduce((sum, p) => sum + Number(p.price || 0), 0)
  const moduleRows = { payment_plans: paymentPlans, projects, team_users: teamUsers }
  const moduleSetters = { payment_plans: setPaymentPlans, projects: setProjects, team_users: setTeamUsers }

  const updateLead = async (id: string, status: string) => {
    setSavingId(id)
    try { const data = await api(`/api/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setLeads((rows) => rows.map((row) => row.id === id ? data.lead : row)) }
    catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }
  const updateProperty = async (id: string, payload: Record<string, unknown>) => {
    setSavingId(id)
    try { const data = await api(`/api/admin/properties/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); setProperties((rows) => rows.map((row) => row.id === id ? data.property : row)) }
    catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }
  const deleteProperty = async (id: string) => {
    if (!confirm("Sigur stergi aceasta proprietate?")) return
    setSavingId(id)
    try { await api(`/api/admin/properties/${id}`, { method: "DELETE" }); setProperties((rows) => rows.filter((row) => row.id !== id)) }
    catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }
  const saveModule = async (type: ModuleType, payload: Record<string, unknown>) => {
    setSavingId(String(payload.id || type))
    try {
      const data = await api("/api/admin/modules", { method: "POST", body: JSON.stringify({ type, payload }) })
      moduleSetters[type]((rows: any[]) => rows.some((row) => row.id === data.item.id) ? rows.map((row) => row.id === data.item.id ? data.item : row) : [data.item, ...rows])
    } catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }
  const deleteModule = async (type: ModuleType, id: string) => {
    if (!confirm("Sigur stergi acest element?")) return
    setSavingId(id)
    try { await api(`/api/admin/modules?type=${type}&id=${id}`, { method: "DELETE" }); moduleSetters[type]((rows: any[]) => rows.filter((row) => row.id !== id)) }
    catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }
  const saveSettings = async (payload: AdminSettings) => {
    setSavingId("settings")
    try { const data = await api("/api/admin/modules", { method: "POST", body: JSON.stringify({ type: "settings", payload }) }); setSettings({ ...defaultSettings, ...(data.settings || {}) }) }
    catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }
  const exportReport = () => {
    const rows = [["Tip", "Nume", "Status", "Valoare"], ...properties.map((p) => ["Proprietate", p.title, p.status, p.price]), ...leads.map((l) => ["Lead", l.name, l.status, l.phone || l.email || ""])]
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
        <nav className="space-y-1 p-3">{nav.map((key) => <button key={key} onClick={() => setView(key)} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold ${view === key ? "bg-accent text-white" : "text-slate-600 hover:bg-slate-100 dark:text-text-muted dark:hover:bg-bg-secondary"}`}>{labels[key]}</button>)}</nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-bg-surface dark:bg-bg-card/95">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-accent dark:border-bg-surface dark:bg-bg-secondary" placeholder="Cauta proprietati, clienti, status..." />
          <div className="flex items-center gap-2"><ThemeToggle /><button onClick={load} className="hidden rounded-lg border px-3 py-2 text-sm font-bold sm:block">Refresh</button><button onClick={exportReport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Raport</button><Link href="/" target="_blank" className="rounded-lg border px-3 py-2 text-sm font-bold">Site</Link></div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white p-3 lg:hidden dark:border-bg-surface dark:bg-bg-card">{nav.map((key) => <button key={key} onClick={() => setView(key)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-bold ${view === key ? "border-accent bg-accent text-white" : "border-slate-200 dark:border-bg-surface"}`}>{labels[key]}</button>)}</nav>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-8">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
          {view === "dashboard" && <Dashboard loading={loading} leads={leads} properties={properties} portfolio={portfolio} paymentPlans={paymentPlans} projects={projects} settings={settings} exportReport={exportReport} />}
          {view === "properties" && <Properties rows={filteredProperties} savingId={savingId} updateProperty={updateProperty} deleteProperty={deleteProperty} />}
          {view === "clients" && <Clients rows={filteredLeads} savingId={savingId} updateLead={updateLead} />}
          {view === "payments" && <PaymentPlans rows={moduleRows.payment_plans} savingId={savingId} save={(payload: any) => saveModule("payment_plans", payload)} remove={(id: string) => deleteModule("payment_plans", id)} />}
          {view === "projects" && <Projects rows={moduleRows.projects} savingId={savingId} save={(payload: any) => saveModule("projects", payload)} remove={(id: string) => deleteModule("projects", id)} />}
          {view === "offplan" && <Offplan rows={projects} />}
          {view === "users" && <Users rows={moduleRows.team_users} savingId={savingId} save={(payload: any) => saveModule("team_users", payload)} remove={(id: string) => deleteModule("team_users", id)} />}
          {view === "commission" && <Commission properties={properties} settings={settings} />}
          {view === "calculator" && <Calculator />}
          {view === "evaluator" && <Evaluator />}
          {view === "settings" && <Settings settings={settings} saving={savingId === "settings"} save={saveSettings} />}
        </main>
      </div>
    </div>
  )
}

function Dashboard({ loading, leads, properties, portfolio, paymentPlans, projects, settings, exportReport }: any) {
  const cards = [["Proprietati", properties.length], ["Clienti activi", leads.filter((l: Lead) => !["CLOSED", "LOST"].includes(l.status)).length], ["Portofoliu", money(portfolio)], ["Cereri noi", leads.filter((l: Lead) => l.status === "NEW").length]]
  return <Section title="Dashboard" subtitle="Overview pentru business, clienti si portofoliu." action={<button onClick={exportReport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Genereaza raport</button>}>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <Panel key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{loading ? "-" : value}</p><p className="mt-3 text-sm font-bold text-emerald-600">+12.5%</p></Panel>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><Panel><h2 className="mb-4 text-lg font-black">Evolutie vanzari</h2><SalesChart /></Panel><Panel><h2 className="mb-4 text-lg font-black">Tendinte piata</h2>{["Bucuresti Nord", "Pipera", "Corbeanca", "Floreasca"].map((area, i) => <Mini key={area} title={area} meta="Pret mediu" value={`EUR ${[2450, 2190, 1680, 3010][i]}/mp`} />)}</Panel></div>
    <div className="grid gap-5 xl:grid-cols-3"><Panel><h2 className="mb-3 font-black">Proprietati recente</h2>{properties.slice(0, 4).map((p: Property) => <Mini key={p.id} title={p.title} meta={`${p.city} - ${p.area_sqm} mp`} value={money(p.price)} />)}</Panel><Panel><h2 className="mb-3 font-black">Proiecte active</h2>{projects.slice(0, 4).map((p: Project) => <Mini key={p.id} title={p.name} meta={`${p.area || "-"} - ${p.stage}`} value={`${p.progress}%`} />)}</Panel><Panel><h2 className="mb-3 font-black">Planuri plata</h2>{paymentPlans.slice(0, 4).map((p: PaymentPlan) => <Mini key={p.id} title={p.name} meta={p.property || "Portofoliu"} value={money(p.total - p.advance)} />)}<p className="mt-3 text-xs text-slate-500">Comision curent: {settings.commission}%</p></Panel></div>
  </Section>
}

function Properties({ rows, savingId, updateProperty, deleteProperty }: any) {
  return <Section title="Proprietati" subtitle="Listari reale din Supabase, cu actiuni functionale." action={<Link href="/admin/proprietate-noua" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white">Proprietate noua</Link>}><Panel tight><Table heads={["Titlu", "Tip", "Pret", "Suprafata", "Status", "Selectata", "Actiuni"]}>{rows.map((p: Property) => <tr key={p.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><b>{p.title}</b><p className="text-xs text-slate-500">{p.city}</p></Td><Td>{p.type}</Td><Td className="font-bold text-accent">{money(p.price, p.currency || "EUR")}</Td><Td>{p.area_sqm} mp</Td><Td><Badge>{p.status}</Badge></Td><Td><button disabled={savingId === p.id} onClick={() => updateProperty(p.id, { featured: !p.featured })} className="rounded-lg border px-3 py-1 text-xs font-bold">{p.featured ? "Da" : "Nu"}</button></Td><Td><div className="flex gap-2"><button disabled={savingId === p.id} onClick={() => updateProperty(p.id, { status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })} className="rounded-lg border px-3 py-1 text-xs font-bold">Status</button><Link href={`/proprietate/${p.slug}`} target="_blank" className="rounded-lg border px-3 py-1 text-xs font-bold">Vezi</Link><button disabled={savingId === p.id} onClick={() => deleteProperty(p.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600">Sterge</button></div></Td></tr>)}</Table></Panel></Section>
}

function Clients({ rows, savingId, updateLead }: any) {
  return <Section title="Clienti" subtitle="Lead-uri din site, cu status CRM salvabil."><Panel tight><Table heads={["Client", "Contact", "Mesaj", "Status", "Data"]}>{rows.map((l: Lead) => <tr key={l.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><b>{l.name}</b><p className="text-xs text-slate-500">{l.email || "fara email"}</p></Td><Td>{l.phone ? <a className="text-accent" href={`tel:${l.phone}`}>{l.phone}</a> : "-"}</Td><Td><p className="max-w-sm truncate">{l.message || "-"}</p></Td><Td><select value={l.status} disabled={savingId === l.id} onChange={(e) => updateLead(l.id, e.target.value)} className="rounded-lg border bg-white px-2 py-1 text-xs font-bold dark:bg-bg-secondary">{leadStatuses.map((s) => <option key={s}>{s}</option>)}</select></Td><Td>{new Date(l.created_at).toLocaleDateString("ro-RO")}</Td></tr>)}</Table></Panel></Section>
}

function PaymentPlans({ rows, savingId, save, remove }: any) {
  const empty = { name: "", property: "", total: "", advance: "", months: "24", status: "ACTIVE", notes: "" }
  const [form, setForm] = useState(empty)
  const submit = () => { if (form.name) { save(form); setForm(empty) } }
  return <Section title="Planuri plata" subtitle="Planuri reale salvate in Supabase pentru clienti si proprietati."><Panel><FormGrid><Input label="Nume" value={form.name} setValue={(v: string) => setForm({ ...form, name: v })} /><Input label="Proprietate" value={form.property} setValue={(v: string) => setForm({ ...form, property: v })} /><Input label="Total EUR" value={form.total} setValue={(v: string) => setForm({ ...form, total: v })} /><Input label="Avans EUR" value={form.advance} setValue={(v: string) => setForm({ ...form, advance: v })} /><Input label="Luni" value={form.months} setValue={(v: string) => setForm({ ...form, months: v })} /><Input label="Status" value={form.status} setValue={(v: string) => setForm({ ...form, status: v })} /></FormGrid><Textarea label="Note" value={form.notes} setValue={(v: string) => setForm({ ...form, notes: v })} /><button onClick={submit} disabled={!form.name || savingId === "payment_plans"} className="mt-4 rounded-lg bg-accent px-4 py-3 font-bold text-white disabled:opacity-50">Adauga plan</button><div className="mt-5 grid gap-3 lg:grid-cols-2">{rows.map((row: PaymentPlan) => <Mini key={row.id} title={row.name} meta={`${row.property || "Fara proprietate"} - ${row.months} luni`} value={money(row.total - row.advance)} onDelete={() => remove(row.id)} />)}</div></Panel></Section>
}

function Projects({ rows, savingId, save, remove }: any) {
  const empty = { name: "", area: "", stage: "Planificare", progress: "0", deadline: "", notes: "" }
  const [form, setForm] = useState(empty)
  const submit = () => { if (form.name) { save(form); setForm(empty) } }
  return <Section title="Proiecte" subtitle="Urmarire operationala pentru proiecte, etape si progres."><Panel><FormGrid><Input label="Nume" value={form.name} setValue={(v: string) => setForm({ ...form, name: v })} /><Input label="Zona" value={form.area} setValue={(v: string) => setForm({ ...form, area: v })} /><Input label="Etapa" value={form.stage} setValue={(v: string) => setForm({ ...form, stage: v })} /><Input label="Progres %" value={form.progress} setValue={(v: string) => setForm({ ...form, progress: v })} /><Input label="Deadline" value={form.deadline} setValue={(v: string) => setForm({ ...form, deadline: v })} /></FormGrid><Textarea label="Note" value={form.notes} setValue={(v: string) => setForm({ ...form, notes: v })} /><button onClick={submit} disabled={!form.name || savingId === "projects"} className="mt-4 rounded-lg bg-accent px-4 py-3 font-bold text-white disabled:opacity-50">Adauga proiect</button><div className="mt-5 grid gap-3 lg:grid-cols-2">{rows.map((row: Project) => <Mini key={row.id} title={row.name} meta={`${row.area || "-"} - ${row.stage}`} value={`${row.progress}%`} onDelete={() => remove(row.id)} />)}</div></Panel></Section>
}

function Offplan({ rows }: any) {
  return <Section title="Constructii" subtitle="Status off-plan si santiere active conectate la proiecte."><div className="grid gap-4 lg:grid-cols-2">{rows.map((row: Project) => <Panel key={row.id}><div className="flex items-start justify-between gap-4"><div><h2 className="font-black">{row.name}</h2><p className="text-sm text-slate-500">{row.area || "Zona necompletata"} - {row.stage}</p></div><Badge>{row.deadline ? new Date(row.deadline).toLocaleDateString("ro-RO") : "fara termen"}</Badge></div><div className="mt-5 h-3 rounded-full bg-slate-100 dark:bg-bg-secondary"><div className="h-3 rounded-full bg-accent" style={{ width: `${row.progress}%` }} /></div><p className="mt-3 text-sm text-slate-500">{row.notes || "Fara note."}</p></Panel>)}</div></Section>
}

function Users({ rows, savingId, save, remove }: any) {
  const empty = { name: "", email: "", role: "Agent", status: "ACTIVE" }
  const [form, setForm] = useState(empty)
  const submit = () => { if (form.name) { save(form); setForm(empty) } }
  return <Section title="Utilizatori" subtitle="Echipa operationala din admin, salvata in Supabase."><Panel><FormGrid><Input label="Nume" value={form.name} setValue={(v: string) => setForm({ ...form, name: v })} /><Input label="Email" value={form.email} setValue={(v: string) => setForm({ ...form, email: v })} /><Input label="Rol" value={form.role} setValue={(v: string) => setForm({ ...form, role: v })} /><Input label="Status" value={form.status} setValue={(v: string) => setForm({ ...form, status: v })} /></FormGrid><button onClick={submit} disabled={!form.name || savingId === "team_users"} className="mt-4 rounded-lg bg-accent px-4 py-3 font-bold text-white disabled:opacity-50">Adauga utilizator</button><div className="mt-5 grid gap-3 lg:grid-cols-2">{rows.map((row: TeamUser) => <Mini key={row.id} title={row.name} meta={`${row.role} - ${row.email || "fara email"}`} value={row.status} onDelete={() => remove(row.id)} />)}</div></Panel></Section>
}

function Commission({ properties, settings }: any) { const rate = Number(settings.commission || 3); const total = properties.filter((p: Property) => p.status === "PUBLISHED").reduce((s: number, p: Property) => s + p.price * (rate / 100), 0); return <Section title="Comisioane" subtitle={`Estimare comision agentie la ${rate}%.`}><Panel><p className="text-sm text-slate-500">Total estimat</p><p className="text-3xl font-black">{money(total)}</p><p className="mt-3 text-sm text-slate-500">Tinta curenta: {money(settings.target || 0)}</p></Panel></Section> }
function Calculator() { const [price, setPrice] = useState("180000"), [advance, setAdvance] = useState("20"), [years, setYears] = useState("25"); const loan = Number(price) * (1 - Number(advance) / 100), monthly = loan / (Number(years) * 12); return <Section title="Calculator" subtitle="Credit si rata lunara orientativa."><Panel><div className="grid gap-3 md:grid-cols-3"><Input label="Pret" value={price} setValue={setPrice} /><Input label="Avans %" value={advance} setValue={setAdvance} /><Input label="Ani" value={years} setValue={setYears} /></div><Result label="Rata lunara estimata" value={money(monthly)} /></Panel></Section> }
function Evaluator() { const [area, setArea] = useState("85"), [mp, setMp] = useState("2200"); return <Section title="Evaluator" subtitle="Estimare rapida dupa suprafata si pret/mp."><Panel><div className="grid gap-3 md:grid-cols-2"><Input label="Suprafata mp" value={area} setValue={setArea} /><Input label="EUR/mp" value={mp} setValue={setMp} /></div><Result label="Valoare estimata" value={money(Number(area) * Number(mp))} /></Panel></Section> }
function Settings({ settings, saving, save }: any) {
  const [form, setForm] = useState(settings)
  useEffect(() => setForm(settings), [settings])
  return <Section title="Setari" subtitle="Configurari rapide salvate in baza de date."><Panel><div className="grid gap-3 md:grid-cols-4"><Input label="Agentie" value={form.agency} setValue={(v: string) => setForm({ ...form, agency: v })} /><Input label="Comision %" value={String(form.commission)} setValue={(v: string) => setForm({ ...form, commission: Number(v) })} /><Input label="Tinta EUR" value={String(form.target)} setValue={(v: string) => setForm({ ...form, target: Number(v) })} /><Input label="TVA %" value={String(form.vat)} setValue={(v: string) => setForm({ ...form, vat: Number(v) })} /></div><button onClick={() => save(form)} disabled={saving} className="mt-4 rounded-lg bg-accent px-4 py-3 font-bold text-white disabled:opacity-50">Salveaza setari</button></Panel></Section>
}

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
function filterRows<T extends Record<string, any>>(rows: T[], query: string) { const q = query.trim().toLowerCase(); return q ? rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q)) : rows }
function SalesChart() { const points = [40, 48, 43, 57, 54, 72, 66, 82, 79, 91, 85, 100].map((v, i) => `${i * 72},${120 - v}`); return <svg viewBox="0 0 800 180" className="h-72 w-full"><polyline points={points.join(" ")} fill="none" stroke="rgb(var(--color-accent))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{points.map((p) => { const [x, y] = p.split(","); return <circle key={p} cx={x} cy={y} r="5" fill="white" stroke="rgb(var(--color-accent))" strokeWidth="3" /> })}</svg> }
