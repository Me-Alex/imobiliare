"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"

type Lead = { id: string; name: string; phone: string | null; email: string | null; message: string | null; status: string; source: string | null; created_at: string }
type Property = { id: string; title: string; type: string; status: string; price: number; currency?: string | null; city: string; area_sqm: number; rooms: number; featured: boolean; slug: string }
type LocalItem = { id: string; name: string; meta: string; value: string }

const nav = ["dashboard", "properties", "clients", "payments", "projects", "offplan", "commission", "calculator", "evaluator", "users", "settings"] as const
const labels: Record<string, string> = { dashboard: "Dashboard", properties: "Proprietati", clients: "Clienti", payments: "Planuri plata", projects: "Proiecte", offplan: "Constructii", commission: "Comisioane", calculator: "Calculator", evaluator: "Evaluator", users: "Utilizatori", settings: "Setari" }
const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"]

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}
function money(value: number, currency = "EUR") { return `${currency} ${Number(value || 0).toLocaleString("ro-RO")}` }
function useStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState(fallback)
  useEffect(() => { const saved = localStorage.getItem(key); if (saved) setValue(JSON.parse(saved)) }, [key])
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue] as const
}

export default function AdminPage() {
  const [view, setView] = useState<(typeof nav)[number]>("dashboard")
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [items, setItems] = useStore<LocalItem[]>("hqs-admin-items", [
    { id: "1", name: "HQS Nord Residence", meta: "Proiect - Pipera", value: "62%" },
    { id: "2", name: "Plan 24 luni", meta: "Avans 30.000 EUR", value: "6.458 EUR/luna" },
    { id: "3", name: "HQS Admin", meta: "Utilizator administrator", value: "activ" },
  ])

  const load = async () => {
    setLoading(true); setError("")
    try { const data = await api("/api/admin/data"); setLeads(data.leads || []); setProperties(data.properties || []) }
    catch (err: any) { setError(err.message || "Nu am putut incarca baza de date.") }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filteredLeads = useMemo(() => filterRows(leads, query), [leads, query])
  const filteredProperties = useMemo(() => filterRows(properties, query), [properties, query])
  const portfolio = properties.filter((p) => p.status === "PUBLISHED").reduce((sum, p) => sum + Number(p.price || 0), 0)

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
          {view === "dashboard" && <Dashboard loading={loading} leads={leads} properties={properties} portfolio={portfolio} exportReport={exportReport} />}
          {view === "properties" && <Properties rows={filteredProperties} savingId={savingId} updateProperty={updateProperty} deleteProperty={deleteProperty} />}
          {view === "clients" && <Clients rows={filteredLeads} savingId={savingId} updateLead={updateLead} />}
          {["payments", "projects", "offplan", "users"].includes(view) && <LocalManager title={labels[view]} items={items} setItems={setItems} mode={view} />}
          {view === "commission" && <Commission properties={properties} />}
          {view === "calculator" && <Calculator />}
          {view === "evaluator" && <Evaluator />}
          {view === "settings" && <Settings />}
        </main>
      </div>
    </div>
  )
}

function Dashboard({ loading, leads, properties, portfolio, exportReport }: any) {
  const cards = [["Proprietati", properties.length], ["Clienti activi", leads.filter((l: Lead) => !["CLOSED", "LOST"].includes(l.status)).length], ["Portofoliu", money(portfolio)], ["Cereri noi", leads.filter((l: Lead) => l.status === "NEW").length]]
  return <Section title="Dashboard" subtitle="Overview pentru business, clienti si portofoliu." action={<button onClick={exportReport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Genereaza raport</button>}>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <Panel key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{loading ? "-" : value}</p><p className="mt-3 text-sm font-bold text-emerald-600">+12.5%</p></Panel>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><Panel><h2 className="mb-4 text-lg font-black">Evolutie vanzari</h2><SalesChart /></Panel><Panel><h2 className="mb-4 text-lg font-black">Tendinte piata</h2>{["Bucuresti Nord", "Pipera", "Corbeanca", "Floreasca"].map((area, i) => <Mini key={area} title={area} meta="Pret mediu" value={`EUR ${[2450, 2190, 1680, 3010][i]}/mp`} />)}</Panel></div>
    <div className="grid gap-5 xl:grid-cols-2"><Panel><h2 className="mb-3 font-black">Proprietati recente</h2>{properties.slice(0, 4).map((p: Property) => <Mini key={p.id} title={p.title} meta={`${p.city} - ${p.area_sqm} mp`} value={money(p.price)} />)}</Panel><Panel><h2 className="mb-3 font-black">Clienti recenti</h2>{leads.slice(0, 4).map((l: Lead) => <Mini key={l.id} title={l.name} meta={l.phone || l.email || "Fara contact"} value={l.status} />)}</Panel></div>
  </Section>
}

function Properties({ rows, savingId, updateProperty, deleteProperty }: any) {
  return <Section title="Proprietati" subtitle="Listari reale din Supabase, cu actiuni functionale." action={<Link href="/admin/proprietate-noua" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white">Proprietate noua</Link>}><Panel tight><Table heads={["Titlu", "Tip", "Pret", "Suprafata", "Status", "Selectata", "Actiuni"]}>{rows.map((p: Property) => <tr key={p.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><b>{p.title}</b><p className="text-xs text-slate-500">{p.city}</p></Td><Td>{p.type}</Td><Td className="font-bold text-accent">{money(p.price, p.currency || "EUR")}</Td><Td>{p.area_sqm} mp</Td><Td><Badge>{p.status}</Badge></Td><Td><button disabled={savingId === p.id} onClick={() => updateProperty(p.id, { featured: !p.featured })} className="rounded-lg border px-3 py-1 text-xs font-bold">{p.featured ? "Da" : "Nu"}</button></Td><Td><div className="flex gap-2"><button disabled={savingId === p.id} onClick={() => updateProperty(p.id, { status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })} className="rounded-lg border px-3 py-1 text-xs font-bold">Status</button><Link href={`/proprietate/${p.slug}`} target="_blank" className="rounded-lg border px-3 py-1 text-xs font-bold">Vezi</Link><button disabled={savingId === p.id} onClick={() => deleteProperty(p.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600">Sterge</button></div></Td></tr>)}</Table></Panel></Section>
}

function Clients({ rows, savingId, updateLead }: any) {
  return <Section title="Clienti" subtitle="Lead-uri din site, cu status CRM salvabil."><Panel tight><Table heads={["Client", "Contact", "Mesaj", "Status", "Data"]}>{rows.map((l: Lead) => <tr key={l.id} className="border-t border-slate-100 dark:border-bg-surface"><Td><b>{l.name}</b><p className="text-xs text-slate-500">{l.email || "fara email"}</p></Td><Td>{l.phone ? <a className="text-accent" href={`tel:${l.phone}`}>{l.phone}</a> : "-"}</Td><Td><p className="max-w-sm truncate">{l.message || "-"}</p></Td><Td><select value={l.status} disabled={savingId === l.id} onChange={(e) => updateLead(l.id, e.target.value)} className="rounded-lg border bg-white px-2 py-1 text-xs font-bold dark:bg-bg-secondary">{leadStatuses.map((s) => <option key={s}>{s}</option>)}</select></Td><Td>{new Date(l.created_at).toLocaleDateString("ro-RO")}</Td></tr>)}</Table></Panel></Section>
}

function LocalManager({ title, items, setItems, mode }: any) {
  const [name, setName] = useState(""), [meta, setMeta] = useState(""), [value, setValue] = useState("")
  const add = () => { if (name) { setItems([{ id: String(Date.now()), name, meta: meta || mode, value: value || "activ" }, ...items]); setName(""); setMeta(""); setValue("") } }
  return <Section title={title} subtitle="Modul operational, functional imediat si salvat local in browser."><Panel><div className="grid gap-3 md:grid-cols-4"><Input label="Nume" value={name} setValue={setName} /><Input label="Detalii" value={meta} setValue={setMeta} /><Input label="Valoare" value={value} setValue={setValue} /><button onClick={add} className="mt-6 rounded-lg bg-accent px-4 py-3 font-bold text-white">Adauga</button></div><div className="mt-5">{items.map((item: LocalItem) => <Mini key={item.id} title={item.name} meta={item.meta} value={item.value} onDelete={() => setItems(items.filter((x: LocalItem) => x.id !== item.id))} />)}</div></Panel></Section>
}

function Commission({ properties }: any) { const total = properties.filter((p: Property) => p.status === "PUBLISHED").reduce((s: number, p: Property) => s + p.price * 0.03, 0); return <Section title="Comisioane" subtitle="Estimare comision agentie la 3%."><Panel><p className="text-sm text-slate-500">Total estimat</p><p className="text-3xl font-black">{money(total)}</p></Panel></Section> }
function Calculator() { const [price, setPrice] = useState("180000"), [advance, setAdvance] = useState("20"), [years, setYears] = useState("25"); const loan = Number(price) * (1 - Number(advance) / 100), monthly = loan / (Number(years) * 12); return <Section title="Calculator" subtitle="Credit si rata lunara orientativa."><Panel><div className="grid gap-3 md:grid-cols-3"><Input label="Pret" value={price} setValue={setPrice} /><Input label="Avans %" value={advance} setValue={setAdvance} /><Input label="Ani" value={years} setValue={setYears} /></div><Result label="Rata lunara estimata" value={money(monthly)} /></Panel></Section> }
function Evaluator() { const [area, setArea] = useState("85"), [mp, setMp] = useState("2200"); return <Section title="Evaluator" subtitle="Estimare rapida dupa suprafata si pret/mp."><Panel><div className="grid gap-3 md:grid-cols-2"><Input label="Suprafata mp" value={area} setValue={setArea} /><Input label="EUR/mp" value={mp} setValue={setMp} /></div><Result label="Valoare estimata" value={money(Number(area) * Number(mp))} /></Panel></Section> }
function Settings() { return <Section title="Setari" subtitle="Configurari rapide pentru operare."><Panel><div className="grid gap-3 md:grid-cols-3"><Input label="Agentie" value="HQS Imobiliare" setValue={() => undefined} /><Input label="Comision %" value="3" setValue={() => undefined} /><Input label="TVA %" value="19" setValue={() => undefined} /></div></Panel></Section> }

function Section({ title, subtitle, action, children }: any) { return <section className="space-y-6"><div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between dark:border-bg-surface"><div><h1 className="text-3xl font-black">{title}</h1><p className="text-sm text-slate-500 dark:text-text-muted">{subtitle}</p></div>{action}</div>{children}</section> }
function Panel({ children, tight = false }: any) { return <div className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-bg-surface dark:bg-bg-card ${tight ? "overflow-hidden" : "p-5"}`}>{children}</div> }
function Table({ heads, children }: any) { return <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead><tr>{heads.map((h: string) => <th key={h} className="bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500 dark:bg-bg-secondary">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div> }
function Td({ children, className = "" }: any) { return <td className={`px-5 py-4 align-middle ${className}`}>{children}</td> }
function Input({ label, value, setValue }: any) { return <label><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><input className="form-input" value={value} onChange={(e) => setValue(e.target.value)} /></label> }
function Result({ label, value }: any) { return <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-bg-secondary"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-black">{value}</p></div> }
function Mini({ title, meta, value, onDelete }: any) { return <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><div><b>{title}</b><p className="text-sm text-slate-500">{meta}</p></div><div className="text-right"><b className="text-accent">{value}</b>{onDelete && <button onClick={onDelete} className="block text-xs font-bold text-rose-500">Sterge</button>}</div></div> }
function Badge({ children }: any) { return <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black dark:border-bg-surface dark:bg-bg-secondary">{children}</span> }
function filterRows<T extends Record<string, any>>(rows: T[], query: string) { const q = query.trim().toLowerCase(); return q ? rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q)) : rows }
function SalesChart() { const points = [40, 48, 43, 57, 54, 72, 66, 82, 79, 91, 85, 100].map((v, i) => `${i * 72},${120 - v}`); return <svg viewBox="0 0 800 180" className="h-72 w-full"><polyline points={points.join(" ")} fill="none" stroke="rgb(var(--color-accent))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{points.map((p) => { const [x, y] = p.split(","); return <circle key={p} cx={x} cy={y} r="5" fill="white" stroke="rgb(var(--color-accent))" strokeWidth="3" /> })}</svg> }
