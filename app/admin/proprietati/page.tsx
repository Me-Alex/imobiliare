"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"

type Property = { id: string; title: string; status: string; price?: number | null; zone?: string | null; agent_id?: string | null }

export default function AdminPropertiesPage() {
  const [rows, setRows] = useState<Property[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("ALL")
  const [editing, setEditing] = useState<Property | null>(null)
  const [title, setTitle] = useState("")

  useEffect(() => {
    supabase
      .from("properties")
      .select("id, title, status, price, zone, agent_id")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as Property[] | null) ?? []))
  }, [])

  useEffect(() => {
    if (editing) setTitle(editing.title)
  }, [editing])

  const filtered = rows.filter((row) => (status === "ALL" || row.status === status) && [row.title, row.zone || ""].join(" ").toLowerCase().includes(query.toLowerCase()))

  async function saveTitle() {
    if (!editing) return
    await supabase.from("properties").update({ title } as Partial<Property>).eq("id", editing.id)
    setRows((prev) => prev.map((row) => row.id === editing.id ? { ...row, title } : row))
    setEditing(null)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6 shadow-[0_0_40px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm text-text-muted">Proprietati</div>
              <h1 className="text-3xl font-semibold">Management proprietati</h1>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">Lista, filtre si editare rapida pentru portofoliul publicat sau in pregatire.</p>
            </div>
            <div className="text-sm text-text-muted">{filtered.length} rezultate</div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cauta proprietate" className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 sm:w-72" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 sm:w-auto">
              <option value="ALL">Toate statusurile</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SOLD">SOLD</option>
              <option value="RENTED">RENTED</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-bg-surface bg-bg-secondary shadow-[0_0_24px_rgba(0,0,0,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-bg-primary/50"><tr><th className="px-4 py-3 text-left">Titlu</th><th className="px-4 py-3 text-left">Zona</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Pret</th><th className="px-4 py-3 text-left">Actiuni</th></tr></thead>
              <tbody>
                {filtered.map((property) => <tr key={property.id} className="border-t border-bg-surface hover:bg-bg-primary/40"><td className="px-4 py-3 font-semibold">{property.title}</td><td className="px-4 py-3">{property.zone || "-"}</td><td className="px-4 py-3">{property.status}</td><td className="px-4 py-3">{property.price ? `EUR ${property.price.toLocaleString("ro-RO")}` : "-"}</td><td className="px-4 py-3"><button onClick={() => setEditing(property)} className="rounded-lg border border-bg-surface px-3 py-1.5">Editeaza</button></td></tr>)}
                {!filtered.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-text-muted">Nu exista proprietati pentru filtrul ales.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {editing && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setEditing(null)}>
            <div className="h-full w-full max-w-md overflow-y-auto border-l border-bg-surface bg-bg-secondary p-6" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Editeaza proprietate</h2><button onClick={() => setEditing(null)} className="text-text-muted">Inchide</button></div>
              <label className="block text-sm text-text-muted">Titlu</label>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-lg border border-bg-surface bg-bg-primary px-3 py-2" />
              <div className="mt-5 flex gap-2"><button onClick={saveTitle} className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg-primary">Salveaza</button><button onClick={() => setEditing(null)} className="rounded-lg border border-bg-surface px-4 py-2">Renunta</button></div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
