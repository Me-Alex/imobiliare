"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"

type Lead = { id: string; name: string; phone: string; source?: string | null; status: string; created_at: string }

export default function AdminLeadsPage(){
  const [leads, setLeads] = useState<Lead[]>([])
  const [status, setStatus] = useState("ALL")

  useEffect(() => {
    supabase.from("leads").select("id, name, phone, source, status, created_at").order("created_at", { ascending: false }).then(({ data }) => setLeads((data || []) as Lead[]))
  }, [])

  const filtered = leads.filter(l => status === "ALL" || l.status === status)

  return <AppShell><div className="space-y-6"><div className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6 shadow-[0_0_40px_rgba(0,0,0,0.12)]"><div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><div className="text-sm text-text-muted">Lead-uri</div><h1 className="text-3xl font-semibold">Pipeline de vânzări</h1></div><div className="text-sm text-text-muted">Noi, contactate, vizionări, negociere</div></div><div className="mt-6 flex flex-wrap gap-3"><select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5"><option value="ALL">Toate statusurile</option><option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="VISITING">VISITING</option><option value="NEGOTIATION">NEGOTIATION</option><option value="CLIENT">CLIENT</option><option value="LOST">LOST</option></select></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{['NEW','CONTACTED','VISITING','NEGOTIATION'].map(s => <div key={s} className="rounded-2xl border border-bg-surface bg-bg-secondary p-4"><div className="text-xs text-text-muted">{s}</div><div className="mt-2 text-2xl font-semibold">{leads.filter(l => l.status === s).length}</div></div>)}</div><div className="rounded-2xl border border-bg-surface bg-bg-secondary overflow-hidden shadow-[0_0_24px_rgba(0,0,0,0.08)]"><table className="w-full text-sm"><thead className="bg-bg-primary/50"><tr><th className="px-4 py-3 text-left">Nume</th><th className="px-4 py-3 text-left">Telefon</th><th className="px-4 py-3 text-left">Sursă</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Creat</th></tr></thead><tbody>{filtered.map(l => <tr key={l.id} className="border-t border-bg-surface hover:bg-bg-primary/40"><td className="px-4 py-3">{l.name}</td><td className="px-4 py-3">{l.phone}</td><td className="px-4 py-3">{l.source || '-'}</td><td className="px-4 py-3">{l.status}</td><td className="px-4 py-3 text-text-muted">{new Date(l.created_at).toLocaleDateString('ro-RO')}</td></tr>)}</tbody></table></div></div></AppShell>}
