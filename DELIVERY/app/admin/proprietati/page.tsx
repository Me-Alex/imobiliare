"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { AppShell } from "@/components/admin/app-shell"
import { PageHeader, StatCard, DataTable, TableRow, Badge, EmptyState, LoadingState, Button, Input, Select } from "@/components/admin/ui"
import { supabase } from "@/lib/supabase"
import {
  apiJson,
  confirmRisk,
  statusLabel,
  propertyTypeLabel,
  money,
  slugify,
  propertyStatuses,
  propertyTypes,
} from "@/components/admin/admin-shared"

type Property = Record<string, any>

const statusVariant: Record<string, "default" | "success" | "warning" | "danger"> = {
  PUBLISHED: "success",
  DRAFT: "default",
  SOLD: "warning",
  RENTED: "warning",
}

const coverUrl = (p: Property) =>
  p.cover_image_url || (p.gallery_urls?.length ? p.gallery_urls[0] : null)

export default function AdminPropertiesPage() {
  const [rows, setRows] = useState<Property[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Property | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500)
      setRows((data as Property[] | null) ?? [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRows() }, [fetchRows])

  useEffect(() => {
    if (editing) {
      setForm({
        title: String(editing.title || ""),
        description: String(editing.description || ""),
        type: String(editing.type || "APARTMENT"),
        transaction_type: String(editing.transaction_type || "SALE"),
        price: String(editing.price ?? ""),
        city: String(editing.city || ""),
        zone: String(editing.zone || ""),
        address: String(editing.address || ""),
        rooms: String(editing.rooms ?? ""),
        bathrooms: String(editing.bathrooms ?? ""),
        floor: String(editing.floor ?? ""),
        year_built: String(editing.year_built ?? ""),
        meta_title: String(editing.meta_title || ""),
        meta_description: String(editing.meta_description || ""),
        status: String(editing.status || "DRAFT"),
        featured: editing.featured ? "true" : "",
      })
      setSaveError("")
    }
  }, [editing])

  const filtered = rows.filter((row) => {
    const matchStatus = status === "ALL" || row.status === status
    const q = query.trim().toLowerCase()
    const matchQuery =
      !q ||
      [row.title, row.city, row.zone, row.address, row.type, row.transaction_type]
        .join(" ")
        .toLowerCase()
        .includes(q)
    return matchStatus && matchQuery
  })

  const stats = {
    total: rows.length,
    published: rows.filter((r) => r.status === "PUBLISHED").length,
    draft: rows.filter((r) => r.status === "DRAFT").length,
    sold: rows.filter((r) => r.status === "SOLD" || r.status === "RENTED").length,
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await apiJson<{ property: Property }>(`/api/admin/properties/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      )
    } catch (err: any) {
      alert("Eroare la schimbarea statusului: " + err.message)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirmRisk(`Sigur vrei sa stergi proprietatea "${title}"? Actiunea este ireversibila.`)) return
    try {
      await apiJson(`/api/admin/properties/${id}`, { method: "DELETE" })
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (err: any) {
      alert("Eroare la stergere: " + err.message)
    }
  }

  async function handleEditSave() {
    if (!editing) return
    if (!form.title.trim()) {
      setSaveError("Titlul este obligatoriu.")
      return
    }
    setSaving(true)
    setSaveError("")
    try {
      const payload: Record<string, any> = {
        title: form.title.trim(),
        slug: slugify(form.title),
        description: form.description || null,
        type: form.type,
        transaction_type: form.transaction_type,
        price: form.price ? Number(form.price) : 0,
        city: form.city || null,
        zone: form.zone || null,
        address: form.address || null,
        rooms: form.rooms ? Number(form.rooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        floor: form.floor ? Number(form.floor) : null,
        year_built: form.year_built ? Number(form.year_built) : null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        status: form.status,
        featured: form.featured === "true",
      }
      const result = await apiJson<{ property: Property }>(`/api/admin/properties/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      setRows((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ...result.property } : r))
      )
      setEditing(null)
    } catch (err: any) {
      setSaveError(err.message || "Salvarea a esuat.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Proprietati"
          title="Management proprietati"
          subtitle="Lista, filtre si editare rapida pentru portofoliul publicat sau in pregatire."
          actions={
            <Link href="/admin/proprietate-noua">
              <Button>Adauga proprietate</Button>
            </Link>
          }
        >
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Publicat" value={stats.published} />
            <StatCard label="Draft" value={stats.draft} />
            <StatCard label="Vandut / Inchiriat" value={stats.sold} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cauta proprietate..."
              className="sm:w-72"
            />
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">Toate statusurile</option>
              {propertyStatuses.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </Select>
          </div>
        </PageHeader>

        {loading ? (
          <LoadingState message="Se incarca proprietatile..." />
        ) : (
          <DataTable
            columns={[
              { label: "Imagine" },
              { label: "Titlu" },
              { label: "Zona / Oras" },
              { label: "Tip" },
              { label: "Pret" },
              { label: "Status" },
              { label: "Actiuni" },
            ]}
            minWidth={900}
          >
            {filtered.map((p) => {
              const cover = coverUrl(p)
              return (
                <TableRow key={p.id}>
                  <td className="px-4 py-3">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-10 w-14 rounded-lg object-cover border border-bg-surface"
                      />
                    ) : (
                      <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-bg-surface bg-bg-primary text-xs text-text-muted">-</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold max-w-[200px] truncate">{p.title || "-"}</td>
                  <td className="px-4 py-3 text-text-muted">{[p.zone, p.city].filter(Boolean).join(", ") || "-"}</td>
                  <td className="px-4 py-3">{propertyTypeLabel(p.type)}</td>
                  <td className="px-4 py-3 font-semibold">{p.price ? money(p.price, p.currency || "EUR") : "-"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status || "DRAFT"}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      className={`rounded-full border px-2 py-1 text-xs font-semibold outline-none transition-colors cursor-pointer ${
                        statusVariant[p.status] === "success"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                          : statusVariant[p.status] === "warning"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                          : "border-bg-surface text-text-muted"
                      }`}
                    >
                      {propertyStatuses.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => setEditing(p)}>
                        Editeaza
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-rose-500 hover:text-rose-400"
                        onClick={() => handleDelete(p.id, p.title)}
                      >
                        Sterge
                      </Button>
                    </div>
                  </td>
                </TableRow>
              )
            })}
            {!filtered.length && <EmptyState message="Nu exista proprietati pentru filtrul ales." colSpan={7} />}
          </DataTable>
        )}
      </div>

      {/* ─── Edit Slide-Over ─── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60"
          onClick={() => setEditing(null)}
        >
          <div
            className="h-full w-full max-w-lg overflow-y-auto border-l border-bg-surface bg-bg-secondary p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Editeaza proprietate</h2>
              <button onClick={() => setEditing(null)} className="text-text-muted hover:text-text-primary">
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Titlu *</span>
                <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} />
              </label>

              {/* Description */}
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Descriere</span>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent"
                />
              </label>

              {/* Type + Transaction */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Tip</span>
                  <Select value={form.type} onChange={(e) => updateForm("type", e.target.value)} className="w-full">
                    {propertyTypes.map((t) => (
                      <option key={t} value={t}>{propertyTypeLabel(t)}</option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Tranzactie</span>
                  <Select value={form.transaction_type} onChange={(e) => updateForm("transaction_type", e.target.value)} className="w-full">
                    <option value="SALE">Vanzare</option>
                    <option value="RENT">Inchiriere</option>
                  </Select>
                </label>
              </div>

              {/* Price */}
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Pret (EUR)</span>
                <Input type="number" value={form.price} onChange={(e) => updateForm("price", e.target.value)} />
              </label>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Oras</span>
                  <Input value={form.city} onChange={(e) => updateForm("city", e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Zona</span>
                  <Input value={form.zone} onChange={(e) => updateForm("zone", e.target.value)} />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Adresa</span>
                <Input value={form.address} onChange={(e) => updateForm("address", e.target.value)} />
              </label>

              {/* Details row */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Camere</span>
                  <Input type="number" value={form.rooms} onChange={(e) => updateForm("rooms", e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Bai</span>
                  <Input type="number" value={form.bathrooms} onChange={(e) => updateForm("bathrooms", e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Etaj</span>
                  <Input type="number" value={form.floor} onChange={(e) => updateForm("floor", e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">An constructie</span>
                  <Input type="number" value={form.year_built} onChange={(e) => updateForm("year_built", e.target.value)} />
                </label>
              </div>

              {/* Status + Featured */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">Status</span>
                  <Select value={form.status} onChange={(e) => updateForm("status", e.target.value)} className="w-full">
                    {propertyStatuses.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </Select>
                </label>
                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={form.featured === "true"}
                    onChange={(e) => updateForm("featured", e.target.checked ? "true" : "")}
                    className="h-4 w-4 rounded border-bg-surface accent-accent"
                  />
                  <span className="text-sm text-text-primary">Promovat</span>
                </label>
              </div>

              {/* SEO */}
              <div className="border-t border-bg-surface pt-4 mt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">SEO</p>
                <label className="block">
                  <span className="mb-1 block text-xs text-text-muted">Meta Title</span>
                  <Input value={form.meta_title} onChange={(e) => updateForm("meta_title", e.target.value)} placeholder="Titlu SEO" />
                </label>
                <label className="block mt-3">
                  <span className="mb-1 block text-xs text-text-muted">Meta Description</span>
                  <textarea
                    value={form.meta_description}
                    onChange={(e) => updateForm("meta_description", e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent"
                    placeholder="Descriere SEO"
                  />
                </label>
              </div>

              {saveError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-500">
                  {saveError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleEditSave} disabled={saving}>
                  {saving ? "Se salveaza..." : "Salveaza"}
                </Button>
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Renunta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
