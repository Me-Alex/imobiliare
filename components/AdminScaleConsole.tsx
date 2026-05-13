"use client"

import { useEffect, useMemo, useState } from "react"
import { scoreProperty } from "@/lib/experience"

const tabs = ["dashboard", "crm", "clienti", "cms", "programari", "oferte", "documente", "zone", "recomandari", "rapoarte", "notificari", "roluri", "audit"] as const
const stages = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "CLOSED"]

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}

export default function AdminScaleConsole() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("dashboard")
  const [admin, setAdmin] = useState<any>({ leads: [], properties: [], appointments: [] })
  const [platform, setPlatform] = useState<any>({})
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("")
  const [notice, setNotice] = useState({ user_id: "", title: "Reminder vizionare", body: "", due_at: "" })
  const [cms, setCms] = useState({ key: "home.hero", title: "Homepage hero", section: "home", headline: "", body: "", seo_title: "", seo_description: "" })

  async function load() {
    try {
      const [a, p] = await Promise.all([api("/api/admin/data"), api("/api/admin/platform")])
      setAdmin({ leads: a.leads || [], properties: a.properties || [], appointments: a.appointments || [] })
      setPlatform(p || {})
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  const report = useMemo(() => {
    const live = admin.properties.filter((p: any) => p.status === "PUBLISHED")
    const offers = platform.property_offers || []
    return {
      clients: platform.client_profiles?.length || 0,
      portfolio: live.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0),
      conversion: offers.length ? Math.round((offers.filter((o: any) => ["ACCEPTED", "CLOSED"].includes(o.status)).length / offers.length) * 100) : 0,
      blockedDocs: (platform.client_documents || []).filter((d: any) => !["APPROVED", "SIGNED"].includes(d.status)).length,
      activity: platform.client_activity?.length || 0,
    }
  }, [admin, platform])

  async function save(type: string, payload: any) {
    await api("/api/admin/platform", { method: "POST", body: JSON.stringify({ type, ...payload }) })
    await load()
  }

  const filteredLeads = admin.leads.filter((lead: any) => [lead.name, lead.email, lead.phone, lead.source].join(" ").toLowerCase().includes(filter.toLowerCase()))

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between dark:border-bg-surface"><div><h1 className="text-3xl font-black">Admin Operations 360</h1><p className="text-sm text-slate-500">CRM, CMS, programari, oferte, documente, zone, recomandari, rapoarte, notificari, roluri si audit.</p></div><button onClick={load} className="rounded-lg bg-accent px-4 py-2 text-sm font-black text-white">Refresh</button></header>
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <nav className="flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-black ${tab === item ? "border-accent bg-accent text-white" : "border-slate-200 dark:border-bg-surface"}`}>{item}</button>)}</nav>
      {tab === "dashboard" && <Grid><Metric label="Clienti" value={report.clients} /><Metric label="Portofoliu" value={`EUR ${report.portfolio.toLocaleString("ro-RO")}`} /><Metric label="Conversie" value={`${report.conversion}%`} /><Metric label="Documente blocate" value={report.blockedDocs} /><Metric label="Activitate client" value={report.activity} /></Grid>}
      {tab === "crm" && <Panel title="Pipeline CRM"><div className="mb-4 flex gap-2"><input className="form-input max-w-sm" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Cauta lead" /><button onClick={() => downloadCsv("crm.csv", filteredLeads)} className="rounded-lg border px-3 text-sm font-black">Export</button></div><div className="grid gap-3 xl:grid-cols-5">{stages.map((stage) => <Column key={stage} stage={stage} leads={filteredLeads} />)}</div></Panel>}
      {tab === "clienti" && <Grid>{(platform.client_profiles || []).map((x: any) => <Card key={x.id} title={x.full_name || x.email} meta={(x.preferred_zones || []).join(", ") || "orice"} value={`EUR ${Number(x.budget || 0).toLocaleString("ro-RO")}`} />)}</Grid>}
      {tab === "cms" && <Panel title="CMS live"><div className="grid gap-3 md:grid-cols-2"><Input label="Key" value={cms.key} onChange={(v) => setCms({ ...cms, key: v })} /><Input label="Titlu" value={cms.title} onChange={(v) => setCms({ ...cms, title: v })} /><Input label="Headline" value={cms.headline} onChange={(v) => setCms({ ...cms, headline: v })} /><Input label="SEO title" value={cms.seo_title} onChange={(v) => setCms({ ...cms, seo_title: v })} /></div><Textarea label="Body" value={cms.body} onChange={(v) => setCms({ ...cms, body: v })} /><button onClick={() => save("cms", { payload: { key: cms.key, title: cms.title, section: cms.section, content: { headline: cms.headline, body: cms.body }, seo: { title: cms.seo_title, description: cms.seo_description } } })} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white">Publica</button></Panel>}
      {tab === "programari" && <Grid>{admin.appointments.map((x: any) => <Card key={x.id} title={x.client_name} meta={new Date(x.requested_at).toLocaleString("ro-RO")} value={x.status || "REQUESTED"} />)}</Grid>}
      {tab === "oferte" && <Grid>{(platform.property_offers || []).map((x: any) => <Card key={x.id} title={x.property_title} meta={x.client_email || x.client_name || "client"} value={`${x.status} · EUR ${Number(x.offer_price).toLocaleString("ro-RO")}`} />)}</Grid>}
      {tab === "documente" && <Grid>{(platform.client_documents || []).map((x: any) => <Card key={x.id} title={x.title} meta={x.type || "document"} value={x.status} />)}</Grid>}
      {tab === "zone" && <Grid>{(platform.zone_poi || []).map((x: any) => <Card key={x.id} title={`${x.zone} · ${x.name}`} meta={`${x.category} · ${x.minutes} min`} value={`${x.score}/100`} />)}</Grid>}
      {tab === "recomandari" && <Grid>{(platform.client_profiles || []).slice(0, 8).map((client: any) => { const match = admin.properties.filter((p: any) => p.status === "PUBLISHED").map((p: any) => ({ p, ...scoreProperty(p, { budget: client.budget || 250000, area: client.preferred_zones?.[0] || "orice", rooms: client.rooms || 2, purpose: client.purpose || "locuire" }) })).sort((a: any, b: any) => b.score - a.score)[0]; return <Card key={client.id} title={client.full_name || client.email} meta={match?.p?.title || "fara potrivire"} value={`${match?.score || 0}/100`} /> })}</Grid>}
      {tab === "rapoarte" && <Panel title="Raport business"><Grid><Metric label="Portofoliu" value={`EUR ${report.portfolio.toLocaleString("ro-RO")}`} /><Metric label="Conversie oferte" value={`${report.conversion}%`} /><Metric label="Documente blocate" value={report.blockedDocs} /></Grid><button onClick={() => downloadCsv("business-report.csv", [report])} className="mt-4 rounded-lg border px-4 py-2 text-sm font-black">Export raport</button></Panel>}
      {tab === "notificari" && <Panel title="Reminder client"><Input label="User ID" value={notice.user_id} onChange={(v) => setNotice({ ...notice, user_id: v })} /><Input label="Titlu" value={notice.title} onChange={(v) => setNotice({ ...notice, title: v })} /><Textarea label="Mesaj" value={notice.body} onChange={(v) => setNotice({ ...notice, body: v })} /><button disabled={!notice.user_id} onClick={() => save("client_notification", { payload: notice })} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white disabled:opacity-50">Trimite</button></Panel>}
      {tab === "roluri" && <Grid>{(platform.admin_roles || []).map((x: any) => <Card key={x.id || x.email} title={x.email} meta={(x.permissions || []).join(", ")} value={x.role} />)}</Grid>}
      {tab === "audit" && <Grid>{(platform.admin_audit_log || []).map((x: any) => <Card key={x.id} title={x.action} meta={x.entity || "platform"} value={new Date(x.created_at).toLocaleString("ro-RO")} />)}</Grid>}
    </section>
  )
}

function Column({ stage, leads }: { stage: string; leads: any[] }) { const rows = leads.filter((x) => x.status === stage || (stage === "NEGOTIATION" && x.status === "QUALIFIED")); return <div className="rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><b>{stage}</b><p className="text-xs text-slate-500">{rows.length} lead-uri</p>{rows.slice(0, 5).map((x) => <Card key={x.id} title={x.name} meta={x.email || x.phone || x.source || "fara contact"} value={x.status} />)}</div> }
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-bg-surface dark:bg-bg-card"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</div> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-bg-surface dark:bg-bg-card"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div> }
function Card({ title, meta, value }: { title: string; meta: string; value: string | number }) { return <div className="my-2 rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><b>{title}</b><p className="text-sm text-slate-500">{meta}</p><p className="mt-2 font-black text-accent">{value}</p></div> }
function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><input className="form-input" value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><textarea className="form-input min-h-24" value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function downloadCsv(filename: string, rows: any[]) { const keys = Array.from(rows.reduce<Set<string>>((s, r) => { Object.keys(r || {}).forEach((k) => s.add(k)); return s }, new Set<string>())); const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => JSON.stringify(r?.[k] ?? "")).join(","))].join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }
