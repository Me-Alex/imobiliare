"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import ThemeToggle from "@/components/ThemeToggle"

type Lead = { id: string; name: string; phone: string | null; email: string | null; message: string | null; status: string; source: string | null; created_at: string }
type Property = { id: string; title: string; type: string; status: string; price: number; city: string; area_sqm: number; featured: boolean; slug: string }

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-accent/20 text-accent border-accent/30",
  CONTACTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  QUALIFIED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  LOST: "bg-red-500/20 text-red-400 border-red-500/30",
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}

export default function AdminPage() {
  const [tab, setTab] = useState<"leads" | "properties">("leads")
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await api("/api/admin/data")
      setLeads(data.leads || [])
      setProperties(data.properties || [])
    } catch (err: any) {
      setError(err.message || "Nu am putut incarca datele din baza.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateLead = async (id: string, status: string) => {
    setSavingId(id)
    try {
      const data = await api(`/api/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
      setLeads((rows) => rows.map((row) => row.id === id ? data.lead : row))
    } catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }

  const updateProperty = async (id: string, payload: Record<string, unknown>) => {
    setSavingId(id)
    try {
      const data = await api(`/api/admin/properties/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
      setProperties((rows) => rows.map((row) => row.id === id ? data.property : row))
    } catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }

  const deleteProperty = async (id: string) => {
    if (!confirm("Sigur stergi aceasta proprietate?")) return
    setSavingId(id)
    try {
      await api(`/api/admin/properties/${id}`, { method: "DELETE" })
      setProperties((rows) => rows.filter((row) => row.id !== id))
    } catch (err: any) { setError(err.message) }
    finally { setSavingId("") }
  }

  const stats = [
    ["Lead-uri", leads.length, "text-accent"],
    ["De contactat", leads.filter((lead) => lead.status === "NEW").length, "text-yellow-400"],
    ["Live", properties.filter((property) => property.status === "PUBLISHED").length, "text-green-400"],
    ["Proprietati", properties.length, "text-blue-400"],
  ] as const

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-50 bg-bg-secondary border-b border-bg-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold"><span className="text-accent">HQS</span> Admin</span>
          <span className="bg-accent/10 text-accent border border-accent/20 text-xs px-2 py-0.5 rounded-full">Baza de date live</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/admin/proprietate-noua" className="bg-accent text-bg-primary text-sm px-4 py-2 rounded-lg font-bold hover:opacity-90">Proprietate noua</Link>
          <a href="/" target="_blank" className="text-sm text-text-muted hover:text-accent">Site</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(([label, value, color]) => <div key={label} className="bg-bg-card border border-bg-surface rounded-lg p-5"><div className={`text-3xl font-bold ${color}`}>{loading ? "-" : value}</div><div className="text-text-muted text-sm mt-1">{label}</div></div>)}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setTab("leads")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold border ${tab === "leads" ? "bg-accent text-bg-primary border-accent" : "bg-bg-card text-text-muted border-bg-surface"}`}>Leads ({leads.length})</button>
          <button onClick={() => setTab("properties")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold border ${tab === "properties" ? "bg-accent text-bg-primary border-accent" : "bg-bg-card text-text-muted border-bg-surface"}`}>Proprietati ({properties.length})</button>
          <button onClick={load} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-bg-surface text-text-muted hover:text-accent">Refresh</button>
        </div>

        {loading ? <div className="py-20 text-center text-text-muted">Se incarca...</div> : tab === "leads" ? (
          <Table headers={["Nume", "Telefon", "Email", "Mesaj", "Sursa", "Status", "Data"]}>
            {leads.map((lead) => <tr key={lead.id} className="border-b border-bg-surface hover:bg-bg-secondary">
              <td className="px-5 py-4 font-medium whitespace-nowrap">{lead.name}</td>
              <td className="px-5 py-4">{lead.phone ? <a className="text-accent" href={`tel:${lead.phone}`}>{lead.phone}</a> : "-"}</td>
              <td className="px-5 py-4 text-text-muted">{lead.email || "-"}</td>
              <td className="px-5 py-4 text-text-muted max-w-xs truncate" title={lead.message || ""}>{lead.message || "-"}</td>
              <td className="px-5 py-4 text-text-muted">{lead.source || "website"}</td>
              <td className="px-5 py-4"><select disabled={savingId === lead.id} value={lead.status} onChange={(e) => updateLead(lead.id, e.target.value)} className={`text-xs font-semibold px-2 py-1 rounded-lg border bg-transparent ${STATUS_COLORS[lead.status] || STATUS_COLORS.NEW}`}>{["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"].map((status) => <option key={status} value={status} className="bg-bg-card text-text-primary">{status}</option>)}</select></td>
              <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
            </tr>)}
          </Table>
        ) : (
          <Table headers={["Titlu", "Tip", "Pret", "Suprafata", "Oras", "Selectata", "Status", "Actiuni"]}>
            {properties.map((property) => <tr key={property.id} className="border-b border-bg-surface hover:bg-bg-secondary">
              <td className="px-5 py-4 font-medium max-w-[240px] truncate">{property.title}</td>
              <td className="px-5 py-4 text-text-muted">{property.type}</td>
              <td className="px-5 py-4 text-accent font-semibold whitespace-nowrap">EUR {Number(property.price || 0).toLocaleString("ro-RO")}</td>
              <td className="px-5 py-4 text-text-muted whitespace-nowrap">{property.area_sqm || 0} mp</td>
              <td className="px-5 py-4 text-text-muted">{property.city}</td>
              <td className="px-5 py-4"><button disabled={savingId === property.id} onClick={() => updateProperty(property.id, { featured: !property.featured })} className={`text-xs px-3 py-1 rounded-lg border ${property.featured ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-bg-surface text-text-muted border-bg-surface"}`}>{property.featured ? "Selectata" : "Seteaza"}</button></td>
              <td className="px-5 py-4"><button disabled={savingId === property.id} onClick={() => updateProperty(property.id, { status: property.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })} className={`text-xs px-3 py-1 rounded-lg border font-semibold ${property.status === "PUBLISHED" ? "bg-accent/20 text-accent border-accent/30" : "bg-bg-surface text-text-muted border-bg-surface"}`}>{property.status === "PUBLISHED" ? "Live" : "Draft"}</button></td>
              <td className="px-5 py-4"><div className="flex gap-2"><Link href={`/proprietate/${property.slug}`} target="_blank" className="text-xs px-2 py-1 border border-bg-surface rounded-lg hover:text-accent">Vezi</Link><button disabled={savingId === property.id} onClick={() => deleteProperty(property.id)} className="text-xs text-red-400 px-2 py-1 border border-bg-surface rounded-lg">Sterge</button></div></td>
            </tr>)}
          </Table>
        )}
      </div>
    </div>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="bg-bg-card border border-bg-surface rounded-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-bg-surface text-text-muted text-xs uppercase tracking-wider">{headers.map((header) => <th key={header} className="text-left px-5 py-3">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div></div>
}
