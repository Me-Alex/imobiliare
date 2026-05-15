"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"

type Property = { id: string; title: string; status: string; price?: number | null; zone?: string | null; agent_id?: string | null }

export default function AdminPropertiesPage(){
  const [rows, setRows] = useState<Property[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("ALL")
  const [editing, setEditing] = useState<Property | null>(null)
  const [title, setTitle] = useState("")

  useEffect(() => {
    supabase.from("properties").select("id, title, status, price, zone, agent_id").order("created_at", { ascending: false }).then(({ data }) => setRows((data || []) as Property[]))
  }, [])

  useEffect(() => {
    if (!editing) return
    setTitle(editing.title)
  }, [editing])

  const filtered = rows.filter(r => (status === "ALL" || r.status === status) && [r.title, r.zone || ""].join(" ").toLowerCase().includes(query.toLowerCase()))

  return <AppShell><div className="space-y-6"><div className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6 shadow-[0_0_40px_rgba(0,0,0,0.12)]"><div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><div className="text-sm text-text-muted">Proprietăți</div><h1 className="text-3xl font-semibold">Management proprietăți</h1></div><div className="text-sm text-text-muted">Listă, filtre și editare rapidă</div></div><div className="mt-6 flex flex-wrap gap-3"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Caută proprietate" className="min-w-64 rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5" /><select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5"><option value="ALL">Toate statusurile</option><option value="PUBLISHED">PUBLISHED</option><option value="DRAFT">DRAFT</option><option value="SOLD">SOLD</option><option value="RENTED">RENTED</option></select></div></div><div className="rounded-2xl border border-bg-surface bg-bg-secondary overflow-hidden shadow-[0_0_24px_rgba(0,0,0,0.08)]"><table className="w-full text-sm"><thead className="bg-bg-primary/50"><tr><th className="px-4 py-3 text-left">Titlu</th><th className="px-4 py-3 text-left">Zonă</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Preț</th><th className="px-4 py-3 text-left">Acțiuni</th></tr></thead><tbody>{filtered.map(p => <tr key={p.id} className="border-t border-bg-surface hover:bg-bg-primary/40"><td className="px-4 py-3">{p.title}</td><td className="px-4 py-3">{p.zone || '-'}</td><td className="px-4 py-3">{p.status}</td><td className="px-4 py-3">{p.price ? `${p.price} €` : '-'}</td><td className="px-4 py-3"><button onClick={() => setEditing(p)} className="rounded-lg border border-bg-surface px-3 py-1.5">Editează</button></td></tr>)}</tbody></table></div>{editing && <div className="fixed inset-0 z-50 bg-black/60 flex justify-end" onClick={() => setEditing(null)}><div className="w-full max-w-md h-full bg-bg-secondary border-l border-bg-surface p-6 overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold">Editează proprietate</h3><button onClick={() => setEditing(null)} className="text-text-muted">Închide</button></div><div className="space-y-4"><div><label className="block text-text-muted mb-1">Titlu</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border border-bg-surface bg-bg-primary px-3 py-2" /></div><div className="flex gap-2"><button onClick={async () => { await supabase.from("properties").update({ title }).eq("id", editing.id); setRows(prev => prev.map(r => r.id === editing.id ? { ...r, title } : r)); setEditing(null) }} className="rounded-lg bg-accent px-4 py-2 text-bg-primary font-semibold">Salvează</button><button onClick={() => setEditing(null)} className="rounded-lg border border-bg-surface px-4 py-2">Renunță</button></div></div></div></div>}</div></AppShell>}
