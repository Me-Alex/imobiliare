"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import {
  PageHeader,
  StatCard,
  DataTable,
  TableRow,
  Badge,
  Button,
  Input,
  Select,
  EmptyState,
  LoadingState,
} from "@/components/admin/ui"
import { apiJson, money, date, statusLabel, confirmRisk } from "@/components/admin/admin-shared"
import type { Row } from "@/components/admin/admin-shared"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ClientProfile {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  budget?: number | null
  purpose?: string | null
  financing_status?: string | null
  status: string
  created_at: string
  updated_at: string
}

interface ClientForm {
  full_name: string
  email: string
  phone: string
  budget: string
  purpose: string
  financing_status: string
  status: string
}

const emptyForm: ClientForm = {
  full_name: "",
  email: "",
  phone: "",
  budget: "",
  purpose: "",
  financing_status: "",
  status: "ACTIVE",
}

const statusColors: Record<string, "default" | "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  PENDING: "warning",
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminClientsPage() {
  const [rows, setRows] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  /* Slide-over */
  const [slideOpen, setSlideOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  /* ---- Fetch ---- */
  const fetchClients = useCallback(async () => {
    try {
      const data = await apiJson<{ client_profiles: ClientProfile[] }>("/api/admin/platform")
      setRows(data.client_profiles || [])
    } catch {
      /* silently fall back to empty */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  /* ---- Derived ---- */
  const filtered = useMemo(() => {
    let list = rows
    if (statusFilter) list = list.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.phone || "").toLowerCase().includes(q)
      )
    }
    return list
  }, [rows, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === "ACTIVE").length,
      withEmail: rows.filter((r) => r.email).length,
    }),
    [rows]
  )

  /* ---- Form helpers ---- */
  const openNew = () => {
    setEditId(null)
    setForm(emptyForm)
    setSlideOpen(true)
  }

  const openEdit = (row: ClientProfile) => {
    setEditId(row.id)
    setForm({
      full_name: row.full_name || "",
      email: row.email || "",
      phone: row.phone || "",
      budget: row.budget != null ? String(row.budget) : "",
      purpose: row.purpose || "",
      financing_status: row.financing_status || "",
      status: row.status || "ACTIVE",
    })
    setSlideOpen(true)
  }

  const set = (key: keyof ClientForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.full_name.trim()) return
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        type: "client_profile",
        full_name: form.full_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        purpose: form.purpose.trim() || undefined,
        financing_status: form.financing_status.trim() || undefined,
        status: form.status || "ACTIVE",
      }
      if (editId) payload.id = editId
      await apiJson("/api/admin/platform", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      setSlideOpen(false)
      setLoading(true)
      await fetchClients()
    } catch (err: any) {
      alert(err.message || "Eroare la salvare")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirmRisk("Sigur doriti sa stergeti acest client?")) return
    setDeleting(id)
    try {
      await apiJson("/api/admin/platform", {
        method: "POST",
        body: JSON.stringify({ type: "client_profile", id, action: "delete" }),
      })
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch {
      /* keep row on failure */
    } finally {
      setDeleting(null)
    }
  }

  /* ---- Status options ---- */
  const allStatuses = [...new Set(rows.map((r) => r.status).filter(Boolean))]

  /* ---- Render ---- */
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Clienti"
          title="Profiluri si preferinte"
          subtitle="Profiluri, preferinte si status pentru clientii din portal."
          actions={<Button onClick={openNew}>+ Client nou</Button>}
        >
          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Cauta dupa nume, email, telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Toate statusurile</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </div>
        </PageHeader>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total clienti" value={stats.total} />
          <StatCard label="Activi" value={stats.active} />
          <StatCard label="Cu email" value={stats.withEmail} />
        </section>

        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={[
              { label: "Nume" },
              { label: "Email" },
              { label: "Telefon" },
              { label: "Buget" },
              { label: "Status" },
              { label: "Actualizat" },
              { label: "" },
            ]}
            minWidth={820}
          >
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <td className="px-4 py-3 font-semibold">{row.full_name}</td>
                <td className="px-4 py-3 text-text-muted">{row.email || "-"}</td>
                <td className="px-4 py-3">{row.phone || "-"}</td>
                <td className="px-4 py-3">{row.budget != null ? money(row.budget) : "-"}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusColors[row.status] || "default"}>
                    {statusLabel(row.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-text-muted">{date(row.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" className="mr-1" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-rose-500 hover:text-rose-400"
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                  >
                    {deleting === row.id ? "..." : "Sterge"}
                  </Button>
                </td>
              </TableRow>
            ))}
            {!filtered.length && (
              <EmptyState
                message={search || statusFilter ? "Niciun client nu corespunde filtrelor." : "Nu exista clienti inca."}
                colSpan={7}
              />
            )}
          </DataTable>
        )}
      </div>

      {/* ---- Slide-over ---- */}
      {slideOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSlideOpen(false)} />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-bg-primary shadow-2xl">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-bg-surface px-6 py-4">
                <h2 className="text-lg font-semibold">{editId ? "Editeaza client" : "Client nou"}</h2>
                <Button variant="ghost" onClick={() => setSlideOpen(false)}>
                  &times;
                </Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Nume complet *
                  </span>
                  <Input value={form.full_name} onChange={set("full_name")} />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Email
                  </span>
                  <Input type="email" value={form.email} onChange={set("email")} />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Telefon
                  </span>
                  <Input type="tel" value={form.phone} onChange={set("phone")} />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Buget (EUR)
                  </span>
                  <Input type="number" value={form.budget} onChange={set("budget")} placeholder="0" />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Scop
                  </span>
                  <Input value={form.purpose} onChange={set("purpose")} placeholder="Cumparare, inchiriere..." />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Status finantare
                  </span>
                  <Select value={form.financing_status} onChange={set("financing_status")}>
                    <option value="">— nespecificat —</option>
                    <option value="PRE_APPROVED">Pre-aprobat</option>
                    <option value="APPROVED">Aprobat</option>
                    <option value="CASH">Cash</option>
                    <option value="PENDING">In asteptare</option>
                    <option value="REJECTED">Respins</option>
                  </Select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Status
                  </span>
                  <Select value={form.status} onChange={set("status")}>
                    <option value="ACTIVE">Activ</option>
                    <option value="INACTIVE">Inactiv</option>
                    <option value="PENDING">In asteptare</option>
                  </Select>
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-bg-surface px-6 py-4">
                <Button variant="secondary" onClick={() => setSlideOpen(false)}>
                  Anuleaza
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.full_name.trim()}>
                  {saving ? "Se salveaza..." : editId ? "Actualizeaza" : "Creeaza"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
