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
import { apiJson, date, statusLabel, confirmRisk } from "@/components/admin/admin-shared"
import type { Row } from "@/components/admin/admin-shared"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Appointment {
  id: string
  lead_id?: string | null
  client_id?: string | null
  property_id?: string | null
  client_name?: string | null
  client_email?: string | null
  client_phone?: string | null
  start_at: string
  end_at: string
  status: string
  notes?: string | null
  property_title?: string | null
  property_city?: string | null
  agent_email?: string | null
  slot_id?: string | null
  created_at: string
  updated_at: string
}

interface AppointmentForm {
  client_name: string
  client_email: string
  client_phone: string
  property_id: string
  start_at: string
  end_at: string
  notes: string
  status: string
}

const emptyForm: AppointmentForm = {
  client_name: "",
  client_email: "",
  client_phone: "",
  property_id: "",
  start_at: "",
  end_at: "",
  notes: "",
  status: "REQUESTED",
}

const ALL_STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"]

const statusColors: Record<string, "default" | "success" | "warning" | "danger"> = {
  REQUESTED: "warning",
  CONFIRMED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REJECTED: "danger",
  NO_SHOW: "danger",
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminAppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")

  /* Slide-over */
  const [slideOpen, setSlideOpen] = useState(false)
  const [form, setForm] = useState<AppointmentForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)

  /* ---- Fetch ---- */
  const fetchAppointments = useCallback(async () => {
    try {
      const data = await apiJson<{ appointments: Appointment[] }>("/api/admin/data")
      setRows(data.appointments || [])
    } catch {
      /* silently fall back to empty */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  /* ---- Derived ---- */
  const now = Date.now()
  const filtered = useMemo(() => {
    let list = rows
    if (statusFilter) list = list.filter((r) => r.status === statusFilter)
    return list
  }, [rows, statusFilter])

  const stats = useMemo(
    () => ({
      total: rows.length,
      upcoming: rows.filter((r) => new Date(r.start_at).getTime() >= now).length,
      confirmed: rows.filter((r) => r.status === "CONFIRMED").length,
      completed: rows.filter((r) => r.status === "COMPLETED").length,
    }),
    [rows, now]
  )

  /* ---- Status change ---- */
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiJson(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      )
    } catch (err: any) {
      alert(err.message || "Eroare la schimbarea statusului")
    } finally {
      setStatusDropdown(null)
    }
  }

  /* ---- Form helpers ---- */
  const openNew = () => {
    setForm(emptyForm)
    setSlideOpen(true)
  }

  const setField = (key: keyof AppointmentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleCreate = async () => {
    if (!form.start_at) return
    setSaving(true)
    try {
      await apiJson("/api/admin/platform", {
        method: "POST",
        body: JSON.stringify({
          type: "appointment",
          client_name: form.client_name.trim() || undefined,
          client_email: form.client_email.trim() || undefined,
          client_phone: form.client_phone.trim() || undefined,
          property_id: form.property_id.trim() || undefined,
          start_at: form.start_at,
          end_at: form.end_at || undefined,
          notes: form.notes.trim() || undefined,
          status: form.status || "REQUESTED",
        }),
      })
      setSlideOpen(false)
      setLoading(true)
      await fetchAppointments()
    } catch (err: any) {
      alert(err.message || "Eroare la crearea programarii")
    } finally {
      setSaving(false)
    }
  }

  /* ---- Render ---- */
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Programari"
          title="Calendar operational"
          subtitle="Calendar operational pentru vizionari, confirmari si follow-up dupa intalnire."
          actions={<Button onClick={openNew}>+ Programare noua</Button>}
        >
          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Toate statusurile</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </div>
        </PageHeader>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Urmeaza" value={stats.upcoming} />
          <StatCard label="Confirmate" value={stats.confirmed} />
          <StatCard label="Finalizate" value={stats.completed} />
        </section>

        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={[
              { label: "Client" },
              { label: "Proprietate" },
              { label: "Start" },
              { label: "End" },
              { label: "Status" },
              { label: "" },
            ]}
            minWidth={900}
          >
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <td className="px-4 py-3 font-semibold">
                  {row.client_name || row.client_email || "-"}
                </td>
                <td className="px-4 py-3">
                  {row.property_title
                    ? `${row.property_title}${row.property_city ? `, ${row.property_city}` : ""}`
                    : "-"}
                </td>
                <td className="px-4 py-3">{date(row.start_at, true)}</td>
                <td className="px-4 py-3">{date(row.end_at, true)}</td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <button
                      className="cursor-pointer"
                      onClick={() => setStatusDropdown(statusDropdown === row.id ? null : row.id)}
                    >
                      <Badge variant={statusColors[row.status] || "default"}>
                        {statusLabel(row.status)}
                      </Badge>
                    </button>
                    {statusDropdown === row.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setStatusDropdown(null)}
                        />
                        <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-bg-surface bg-bg-primary py-1 shadow-lg">
                          {ALL_STATUSES.filter((s) => s !== row.status).map((s) => (
                            <button
                              key={s}
                              className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-secondary"
                              onClick={() => handleStatusChange(row.id, s)}
                            >
                              {statusLabel(s)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {row.notes && (
                    <span className="text-xs text-text-muted" title={row.notes}>
                      📝
                    </span>
                  )}
                </td>
              </TableRow>
            ))}
            {!filtered.length && (
              <EmptyState
                message={
                  statusFilter
                    ? "Niciun rezultat pentru acest status."
                    : "Nu exista programari inca."
                }
                colSpan={6}
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
                <h2 className="text-lg font-semibold">Programare noua</h2>
                <Button variant="ghost" onClick={() => setSlideOpen(false)}>
                  &times;
                </Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Nume client
                  </span>
                  <Input value={form.client_name} onChange={setField("client_name")} placeholder="Client HQS" />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Email client
                  </span>
                  <Input type="email" value={form.client_email} onChange={setField("client_email")} />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Telefon client
                  </span>
                  <Input type="tel" value={form.client_phone} onChange={setField("client_phone")} />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    ID Proprietate (optional)
                  </span>
                  <Input value={form.property_id} onChange={setField("property_id")} placeholder="UUID proprietate" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Start *
                    </span>
                    <Input type="datetime-local" value={form.start_at} onChange={setField("start_at")} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      End
                    </span>
                    <Input type="datetime-local" value={form.end_at} onChange={setField("end_at")} />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Status initial
                  </span>
                  <Select value={form.status} onChange={setField("status")}>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Note
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent"
                    rows={3}
                    value={form.notes}
                    onChange={setField("notes")}
                    placeholder="Detalii suplimentare..."
                  />
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-bg-surface px-6 py-4">
                <Button variant="secondary" onClick={() => setSlideOpen(false)}>
                  Anuleaza
                </Button>
                <Button onClick={handleCreate} disabled={saving || !form.start_at}>
                  {saving ? "Se salveaza..." : "Creeaza programare"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
