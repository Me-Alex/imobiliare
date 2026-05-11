"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@supabase/supabase-js"

type Lead = { id: string; name: string; phone: string; email?: string | null; source?: string | null; status: string; message?: string | null; created_at: string }
type Property = { id: string; title: string; status: string; created_at: string }
type Audit = { id: string; action: string; created_at: string }
type LeadNote = { id: string; lead_id: string; note: string; created_at: string }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [leadDrawer, setLeadDrawer] = useState<Lead | null>(null)
  const [leadNote, setLeadNote] = useState("")
  const [leadNotes, setLeadNotes] = useState<LeadNote[]>([])
  const [search, setSearch] = useState("")
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL")
  const [propStatusFilter, setPropStatusFilter] = useState("ALL")
  const [lastNoteFilter, setLastNoteFilter] = useState("ALL")
  const [leadNoteCounts, setLeadNoteCounts] = useState<Record<string, number>>({})
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [lastNoteAt, setLastNoteAt] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("lead_notes").select("id, lead_id, note, created_at").order("created_at", { ascending: false }),
    ]).then(([l, p, a, n]) => {
      const noteRows = (n.data || []) as LeadNote[]
      setLeads((l.data || []) as Lead[])
      setProperties((p.data || []) as Property[])
      setAudit((a.data || []) as Audit[])
      setLeadNotes(noteRows)
      const counts: Record<string, number> = {}
      const latest: Record<string, string> = {}
      for (const row of noteRows) { counts[row.lead_id] = (counts[row.lead_id] || 0) + 1; if (!latest[row.lead_id] || new Date(row.created_at).getTime() > new Date(latest[row.lead_id]).getTime()) latest[row.lead_id] = row.created_at }
      setLeadNoteCounts(counts)
      setLastNoteAt(latest)
    })
  }, [])

  useEffect(() => {
    if (!leadDrawer) return
    setLeadNotes(prev => prev.filter(n => n.lead_id === leadDrawer.id))
  }, [leadDrawer])

  const filteredLeads = useMemo(() => leads.filter(l => {
    if (leadStatusFilter !== "ALL" && l.status !== leadStatusFilter) return false
    if (lastNoteFilter !== "ALL") {
      const hasNotes = (leadNoteCounts[l.id] || 0) > 0
      if (lastNoteFilter === "HAS_NOTES" && !hasNotes) return false
      if (lastNoteFilter === "NO_NOTES" && hasNotes) return false
    }
    return [l.name, l.phone, l.email || "", l.source || "", l.message || ""].join(" ").toLowerCase().includes(search.toLowerCase())
  }).sort((a, b) => (new Date(lastNoteAt[b.id] || 0).getTime()) - (new Date(lastNoteAt[a.id] || 0).getTime()) || (leadNoteCounts[b.id] || 0) - (leadNoteCounts[a.id] || 0)), [leads, search, leadStatusFilter, lastNoteFilter, leadNoteCounts, lastNoteAt])

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Admin</h1>
            <p className="text-text-muted text-sm mt-1">Lead-uri, proprietăți și audit.</p>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută lead..." className="rounded-lg border border-bg-surface bg-bg-secondary px-3 py-2 text-sm w-64" />
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)} className="rounded-lg border border-bg-surface bg-bg-secondary px-3 py-2"><option value="ALL">Toate lead-urile</option><option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="CLOSED">CLOSED</option><option value="LOST">LOST</option></select>
          <select value={lastNoteFilter} onChange={e => setLastNoteFilter(e.target.value)} className="rounded-lg border border-bg-surface bg-bg-secondary px-3 py-2"><option value="ALL">Toate notițele</option><option value="HAS_NOTES">Cu notițe</option><option value="NO_NOTES">Fără notițe</option></select>
          <select value={propStatusFilter} onChange={e => setPropStatusFilter(e.target.value)} className="rounded-lg border border-bg-surface bg-bg-secondary px-3 py-2"><option value="ALL">Toate proprietățile</option><option value="PUBLISHED">PUBLISHED</option><option value="DRAFT">DRAFT</option><option value="SOLD">SOLD</option><option value="RENTED">RENTED</option></select>
        </div>

        <section className="rounded-2xl border border-bg-surface bg-bg-secondary overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-surface flex items-center justify-between"><h2 className="font-semibold">Lead-uri</h2><span className="text-sm text-text-muted">{filteredLeads.length}</span></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-primary/50">
                <tr>
                  <th className="px-3 py-2 text-left">Nume</th><th className="px-3 py-2 text-left">Telefon</th><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2 text-left">Sursă</th><th className="px-3 py-2 text-center">Notițe</th><th className="px-3 py-2 text-left">Ultima notiță</th><th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(l => <tr key={l.id} className="border-t border-bg-surface hover:bg-bg-primary/40 cursor-pointer" onClick={() => setLeadDrawer(l)}><td className="px-3 py-2">{l.name}</td><td className="px-3 py-2">{l.phone}</td><td className="px-3 py-2">{l.email || '-'}</td><td className="px-3 py-2">{l.source || '-'}</td><td className="px-3 py-2 text-center">{leadNoteCounts[l.id] || 0}</td><td className="px-3 py-2 text-xs text-text-muted">{lastNoteAt[l.id] ? new Date(lastNoteAt[l.id]).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td><td className="px-3 py-2">{l.status}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        {leadDrawer && <div className="fixed inset-0 z-50 bg-black/60 flex justify-end" onClick={() => setLeadDrawer(null)}><div role="dialog" aria-modal="true" aria-label="Detalii lead" tabIndex={-1} className="w-full max-w-md h-full bg-bg-secondary border-l border-bg-surface p-6 overflow-y-auto outline-none" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') setLeadDrawer(null) }}><div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold">Lead detail</h3><button onClick={() => setLeadDrawer(null)} className="text-text-muted">Închide</button></div><div className="space-y-4 text-sm"><p><span className="text-text-muted">Nume:</span> {leadDrawer.name}</p><p><span className="text-text-muted">Telefon:</span> {leadDrawer.phone}</p><p><span className="text-text-muted">Email:</span> {leadDrawer.email || '-'}</p><p><span className="text-text-muted">Sursă:</span> {leadDrawer.source}</p><p><span className="text-text-muted">Status:</span> {leadDrawer.status}</p><div><label className="block text-text-muted mb-1">Mesaj</label><textarea readOnly value={leadDrawer.message || ''} className="w-full min-h-32 rounded-lg border border-bg-surface bg-bg-primary px-3 py-2" /></div><div><label className="block text-text-muted mb-1">Notiță internă</label><textarea value={leadNote} onChange={e => setLeadNote(e.target.value)} className="w-full min-h-24 rounded-lg border border-bg-surface bg-bg-primary px-3 py-2" placeholder="Ex: a cerut callback mâine la 11" /></div><div className="flex gap-2"><button onClick={async () => { if (!leadNote.trim()) return; await supabase.from("lead_notes").insert({ lead_id: leadDrawer.id, note: leadNote.trim() }); setLeadNotes(prev => [{ id: crypto.randomUUID(), lead_id: leadDrawer.id, note: leadNote.trim(), created_at: new Date().toISOString() }, ...prev]); setLeadNote("") }} className="rounded-lg bg-accent px-4 py-2 text-bg-primary font-semibold">Salvează notița</button><button onClick={() => supabase.from("leads").update({ status: "CONTACTED" }).eq("id", leadDrawer.id).then(() => setLeads(prev => prev.map(l => l.id === leadDrawer.id ? { ...l, status: "CONTACTED" } : l)))} className="rounded-lg border border-bg-surface px-4 py-2">Marchează contacted</button><button onClick={() => setLeadDrawer(null)} className="rounded-lg border border-bg-surface px-4 py-2">Închide</button></div><div className="pt-4 border-t border-bg-surface"><p className="text-text-muted mb-2">Istoric notițe</p><div className="space-y-2">{leadNotes.filter(n => n.lead_id === leadDrawer.id).map(n => <div key={n.id} className="rounded-lg border border-bg-surface bg-bg-primary p-3 text-xs text-text-muted"><div className="mb-1">{new Date(n.created_at).toLocaleString('ro-RO')}</div><div>{n.note}</div></div>)}</div></div></div></div></div>}
        {editingProperty && <div className="fixed inset-0 z-50 bg-black/60 flex justify-end" onClick={() => setEditingProperty(null)}><div role="dialog" aria-modal="true" aria-label="Editează proprietatea" className="w-full max-w-md h-full bg-bg-secondary border-l border-bg-surface p-6 overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold">Editează proprietate</h3><button onClick={() => setEditingProperty(null)} className="text-text-muted">Închide</button></div><div className="space-y-4"><div><label className="block text-text-muted mb-1">Titlu</label><input defaultValue={editingProperty.title} className="w-full rounded-lg border border-bg-surface bg-bg-primary px-3 py-2" /></div><div><label className="block text-text-muted mb-1">Status</label><select defaultValue={editingProperty.status} className="w-full rounded-lg border border-bg-surface bg-bg-primary px-3 py-2"><option value="PUBLISHED">PUBLISHED</option><option value="DRAFT">DRAFT</option><option value="SOLD">SOLD</option><option value="RENTED">RENTED</option></select></div><div className="flex gap-2"><button className="rounded-lg bg-accent px-4 py-2 text-bg-primary font-semibold">Salvează</button><button onClick={() => setEditingProperty(null)} className="rounded-lg border border-bg-surface px-4 py-2">Renunță</button></div></div></div></div>}
      </div>
    </main>
  )
}
