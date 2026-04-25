"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Lead = {
  id: string; name: string; phone: string; email: string | null
  message: string | null; status: string; source: string
  property_id: string | null; created_at: string
}
type Property = {
  id: string; title: string; type: string; status: string
  price: number; city: string; area_sqm: number; rooms: number; featured: boolean
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-accent/20 text-accent border-accent/30",
  CONTACTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  LOST: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function AdminPage() {
  const [tab, setTab] = useState<"leads" | "proprietati">("leads")
  const [leads, setLeads] = useState<Lead[]>([])
  const [props, setProps] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
    ]).then(([l, p]) => {
      setLeads(l.data || [])
      setProps(p.data || [])
      setLoading(false)
    })
  }, [])

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from("properties").update({ featured: !featured }).eq("id", id)
    setProps(prev => prev.map(p => p.id === id ? { ...p, featured: !featured } : p))
  }

  const togglePublished = async (id: string, status: string) => {
    const newStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    await supabase.from("properties").update({ status: newStatus }).eq("id", id)
    setProps(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
  }

  const stats = [
    { label: "Total leads", val: leads.length, color: "text-accent" },
    { label: "Leads noi", val: leads.filter(l => l.status === "NEW").length, color: "text-yellow-400" },
    { label: "Proprietăți live", val: props.filter(p => p.status === "PUBLISHED").length, color: "text-green-400" },
    { label: "Total proprietăți", val: props.length, color: "text-blue-400" },
  ]

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold"><span className="text-accent">HQS</span> Admin</span>
          <span className="bg-accent/10 text-accent border border-accent/20 text-xs px-2 py-0.5 rounded-full">Dashboard</span>
        </div>
        <a href="/" className="text-sm text-text-muted hover:text-accent transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Vezi site
        </a>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-bg-card border border-bg-surface rounded-2xl p-5">
              <div className={`text-3xl font-bold ${s.color}`}>{loading ? "—" : s.val}</div>
              <div className="text-text-muted text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "leads", label: `Leads (${leads.length})` },
            { key: "proprietati", label: `Proprietăți (${props.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${tab === t.key ? "bg-accent text-bg-primary border-accent" : "bg-bg-card text-text-muted border-bg-surface hover:border-accent"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "leads" ? (
          <div className="bg-bg-card border border-bg-surface rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bg-surface text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Nume</th>
                    <th className="text-left px-5 py-3">Telefon</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Mesaj</th>
                    <th className="text-left px-5 py-3">Sursă</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={l.id} className={`border-b border-bg-surface hover:bg-bg-secondary transition-colors ${i % 2 === 0 ? "" : "bg-bg-primary/30"}`}>
                      <td className="px-5 py-4 font-medium text-text-primary">{l.name}</td>
                      <td className="px-5 py-4">
                        <a href={`tel:${l.phone}`} className="text-accent hover:underline">{l.phone}</a>
                      </td>
                      <td className="px-5 py-4 text-text-muted">{l.email || "—"}</td>
                      <td className="px-5 py-4 text-text-muted max-w-xs truncate" title={l.message || ""}>{l.message || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="bg-bg-surface text-text-muted text-xs px-2 py-1 rounded-lg">{l.source}</span>
                      </td>
                      <td className="px-5 py-4">
                        <select value={l.status}
                          onChange={e => updateLeadStatus(l.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer bg-transparent ${STATUS_COLORS[l.status] || STATUS_COLORS.NEW}`}>
                          {["NEW", "CONTACTED", "CLOSED", "LOST"].map(s => <option key={s} value={s} className="bg-bg-card text-text-primary">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">
                        {new Date(l.created_at).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-text-muted">Niciun lead încă.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-bg-card border border-bg-surface rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bg-surface text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Titlu</th>
                    <th className="text-left px-5 py-3">Tip</th>
                    <th className="text-left px-5 py-3">Preț</th>
                    <th className="text-left px-5 py-3">Suprafață</th>
                    <th className="text-left px-5 py-3">Oraș</th>
                    <th className="text-left px-5 py-3">Featured</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map((p, i) => (
                    <tr key={p.id} className={`border-b border-bg-surface hover:bg-bg-secondary transition-colors ${i % 2 === 0 ? "" : "bg-bg-primary/30"}`}>
                      <td className="px-5 py-4 font-medium text-text-primary max-w-xs truncate">{p.title}</td>
                      <td className="px-5 py-4 text-text-muted capitalize">{p.type}</td>
                      <td className="px-5 py-4 text-accent font-semibold">€{p.price?.toLocaleString("ro-RO")}</td>
                      <td className="px-5 py-4 text-text-muted">{p.area_sqm} mp</td>
                      <td className="px-5 py-4 text-text-muted">{p.city}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleFeatured(p.id, p.featured)}
                          className={`text-xs px-3 py-1 rounded-lg border transition-all ${p.featured ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-bg-surface text-text-muted border-bg-surface hover:border-yellow-500/30"}`}>
                          {p.featured ? "⭐ Featured" : "Setează featured"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => togglePublished(p.id, p.status)}
                          className={`text-xs px-3 py-1 rounded-lg border transition-all font-semibold ${p.status === "PUBLISHED" ? "bg-accent/20 text-accent border-accent/30" : "bg-bg-surface text-text-muted border-bg-surface hover:border-accent/30"}`}>
                          {p.status === "PUBLISHED" ? "✓ Live" : "Draft"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
