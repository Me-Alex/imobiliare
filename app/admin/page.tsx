"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import AdminChecklist from "@/components/AdminChecklist"

type Lead = { id: string; name: string; phone: string; email: string | null; message: string | null; status: string; source: string; property_id: string | null; created_at: string }
type Property = { id: string; title: string; type: string; status: string; price: number; city: string; area_sqm: number; rooms: number; featured: boolean; slug: string; address?: string; description?: string; county?: string; published_at?: string | null }
type Audit = { id: string; table_name: string; action: string; created_at: string }

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [props, setProps] = useState<Property[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"overview" | "leads" | "proprietati" | "audit">("overview")
  const [drawer, setDrawer] = useState<Property | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(null) }
    window.addEventListener("keydown", onKey)
    Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(10),
    ]).then(([l, p, a]) => {
      if (l.error || p.error || a.error) setError(l.error?.message || p.error?.message || a.error?.message || "Eroare la încărcare.")
      setLeads(l.data || [])
      setProps(p.data || [])
      setAudit(a.data || [])
    })
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const filteredLeads = useMemo(() => leads.filter(l => [l.name, l.phone, l.email || "", l.source || "", l.message || ""].join(" ").toLowerCase().includes(search.toLowerCase())), [leads, search])
  const filteredProps = useMemo(() => props.filter(p => [p.title, p.city, p.slug, p.type].join(" ").toLowerCase().includes(search.toLowerCase())), [props, search])
  const liveCount = props.filter(p => p.status === "PUBLISHED").length

  const saveProperty = async (id: string, data: Partial<Property>) => {
    await supabase.from("properties").update(data).eq("id", id)
    setProps(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    setDrawer(prev => prev && prev.id === id ? { ...prev, ...data } : prev)
  }

  const deleteProp = async (id: string) => {
    if (!confirm("Sigur ștergi această proprietate?")) return
    await supabase.from("properties").delete().eq("id", id)
    setProps(prev => prev.filter(p => p.id !== id))
  }

  const stats = [
    { label: "Leads", value: leads.length },
    { label: "Noi", value: leads.filter(l => l.status === "NEW").length },
    { label: "Proprietăți live", value: liveCount },
    { label: "Audit events", value: audit.length },
  ]

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block min-h-screen border-r border-bg-surface bg-bg-secondary p-6 sticky top-0">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold">Admin HQS</p>
          <h2 className="mt-2 text-2xl font-bold">Panou</h2>
          <nav className="mt-8 space-y-2 text-sm">
            <button onClick={() => setTab("overview")} className={`block w-full text-left rounded-lg px-3 py-2 ${tab === "overview" ? "bg-bg-primary/70 text-accent" : "hover:bg-bg-primary/70 hover:text-accent"}`}>Overview</button>
            <button onClick={() => setTab("leads")} className={`block w-full text-left rounded-lg px-3 py-2 ${tab === "leads" ? "bg-bg-primary/70 text-accent" : "hover:bg-bg-primary/70 hover:text-accent"}`}>Lead-uri</button>
            <button onClick={() => setTab("proprietati")} className={`block w-full text-left rounded-lg px-3 py-2 ${tab === "proprietati" ? "bg-bg-primary/70 text-accent" : "hover:bg-bg-primary/70 hover:text-accent"}`}>Proprietăți</button>
            <button onClick={() => setTab("audit")} className={`block w-full text-left rounded-lg px-3 py-2 ${tab === "audit" ? "bg-bg-primary/70 text-accent" : "hover:bg-bg-primary/70 hover:text-accent"}`}>Audit</button>
          </nav>
          <div className="mt-8 rounded-2xl border border-bg-surface bg-bg-primary/60 p-4">
            <p className="text-sm font-semibold mb-2">Build</p>
            <p className="text-xs text-text-muted">Cloudflare + Supabase</p>
          </div>
        </aside>
        <main className="min-h-screen">
          <header className="bg-bg-secondary border-b border-bg-surface px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Panou administrare</h1>
              <p className="text-sm text-text-muted">Gestionare leads și proprietăți</p>
            </div>
            <Link href="/" className="text-sm text-accent hover:underline">Înapoi pe site</Link>
          </header>
          <section className="max-w-7xl mx-auto px-6 pt-8">
            <div className="rounded-2xl border border-accent/20 bg-accent/10 p-5 mb-8">
              <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-2">Noutăți admin</p>
              <h2 className="text-xl font-semibold mb-2">Taburi, filtre, drawer de editare și audit real.</h2>
              <p className="text-sm text-text-muted max-w-3xl">Build-ul rulează pe Cloudflare, iar datele vin din Supabase.</p>
            </div>
            {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
            <AdminChecklist />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map(s => <div key={s.label} className="bg-bg-secondary border border-bg-surface rounded-xl p-5"><p className="text-sm text-text-muted mb-2">{s.label}</p><p className="text-3xl font-bold text-accent">{s.value}</p></div>)}
            </div>
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <button onClick={() => setTab("overview")} className="rounded-lg border border-bg-surface px-3 py-2 text-sm">Overview</button>
              <button onClick={() => setTab("leads")} className="rounded-lg border border-bg-surface px-3 py-2 text-sm">Lead-uri</button>
              <button onClick={() => setTab("proprietati")} className="rounded-lg border border-bg-surface px-3 py-2 text-sm">Proprietăți</button>
              <button onClick={() => setTab("audit")} className="rounded-lg border border-bg-surface px-3 py-2 text-sm">Audit</button>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută..." className="ml-auto min-w-[240px] rounded-lg border border-bg-surface bg-bg-secondary px-3 py-2 text-sm" />
            </div>
            {(tab === "overview" || tab === "leads") && <section className="mb-10"><h3 className="text-xl font-semibold mb-4">Lead-uri recente</h3><div className="grid gap-3">{filteredLeads.slice(0,5).map(l => <div key={l.id} className="rounded-xl border border-bg-surface bg-bg-secondary p-4 flex items-center justify-between gap-3"><div><p className="font-medium">{l.name}</p><p className="text-sm text-text-muted">{l.phone} · {l.source}</p></div><select value={l.status} onChange={e => supabase.from("leads").update({ status: e.target.value }).eq("id", l.id).then(() => setLeads(prev => prev.map(x => x.id === l.id ? { ...x, status: e.target.value } : x)))} className="rounded-lg border border-bg-surface bg-bg-primary px-3 py-2 text-sm"><option>NEW</option><option>CONTACTED</option><option>CLOSED</option><option>LOST</option></select></div>)}</div></section>}
            {(tab === "overview" || tab === "proprietati") && <section className="mb-10"><h3 className="text-xl font-semibold mb-4">Proprietăți live</h3><div className="grid gap-3">{filteredProps.slice(0,6).map(p => <div key={p.id} className="rounded-xl border border-bg-surface bg-bg-secondary p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="font-medium">{p.title}</p><p className="text-sm text-text-muted">{p.city} · {p.rooms} camere · {p.area_sqm} mp · {p.status}</p></div><div className="flex gap-2 flex-wrap"><button onClick={() => setDrawer(p)} className="rounded-lg border border-bg-surface px-3 py-2 text-sm">Deschide</button><button onClick={() => saveProperty(p.id, { featured: !p.featured })} className="rounded-lg border border-bg-surface px-3 py-2 text-sm">{p.featured ? 'Unfeature' : 'Featured'}</button><button onClick={() => saveProperty(p.id, { status: p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED', published_at: p.status === 'PUBLISHED' ? null : new Date().toISOString() })} className="rounded-lg border border-bg-surface px-3 py-2 text-sm">{p.status === 'PUBLISHED' ? 'Draft' : 'Publish'}</button><button onClick={() => deleteProp(p.id)} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">Șterge</button></div></div>)}</div></section>}
            {(tab === "overview" || tab === "audit") && <section><h3 className="text-xl font-semibold mb-4">Audit recent</h3><div className="grid gap-3">{audit.map(a => <div key={a.id} className="rounded-xl border border-bg-surface bg-bg-secondary p-4 flex items-center justify-between"><p>{a.table_name} · {a.action}</p><span className="text-sm text-text-muted">{new Date(a.created_at).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}</span></div>)}</div></section>}
          </section>
          {drawer && <div className="fixed inset-0 z-50 bg-black/60 flex justify-end" onClick={() => setDrawer(null)}><div className="w-full max-w-lg h-full bg-bg-secondary border-l border-bg-surface p-6 overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold">{drawer.title}</h3><button onClick={() => setDrawer(null)} className="text-text-muted">Închide</button></div><div className="space-y-4 text-sm"><div><label className="block text-text-muted mb-1">Titlu</label><input value={drawer.title} onChange={e => setDrawer({ ...drawer, title: e.target.value })} className="w-full rounded-lg border border-bg-surface bg-bg-primary px-3 py-2" /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-text-muted mb-1">Preț</label><input type="number" value={drawer.price} onChange={e => setDrawer({ ...drawer, price: Number(e.target.value) })} className="w-full rounded-lg border border-bg-surface bg-bg-primary px-3 py-2" /></div><div><label className="block text-text-muted mb-1">Status</label><select value={drawer.status} onChange={e => setDrawer({ ...drawer, status: e.target.value })} className="w-full rounded-lg border border-bg-surface bg-bg-primary px-3 py-2"><option>PUBLISHED</option><option>DRAFT</option><option>SOLD</option><option>RENTED</option></select></div></div><label className="flex items-center gap-2"><input type="checkbox" checked={drawer.featured} onChange={e => setDrawer({ ...drawer, featured: e.target.checked })} /> Featured</label><button onClick={() => saveProperty(drawer.id, { title: drawer.title, price: drawer.price, status: drawer.status, featured: drawer.featured })} className="rounded-lg bg-accent px-4 py-2 text-bg-primary font-semibold">Salvează</button><p className="text-text-muted">{drawer.address || ""}</p><p>{drawer.description || ""}</p></div></div></div>}
        </main>
      </div>
    </div>
  )
}
