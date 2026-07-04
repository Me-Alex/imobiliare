"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/admin/app-shell"
import {
  PageHeader,
  StatCard,
  DataTable,
  TableRow,
  EmptyState,
  LoadingState,
  Badge,
  Button,
  Input,
  Select,
  Card,
} from "@/components/admin/ui"
import {
  apiJson,
  matches,
  date,
  confirmRisk,
  statusLabel,
  leadStatuses,
  type Row,
} from "@/components/admin/admin-shared"

/* ---------- Types ---------- */

type Lead = {
  id: string
  name: string
  email?: string | null
  phone: string
  source?: string | null
  message?: string | null
  status: string
  score?: number | null
  assigned_to?: string | null
  property_id?: string | null
  note?: string | null
  next_follow_up?: string | null
  created_at: string
  updated_at?: string | null
}

type AuditEntry = {
  id: string
  entity: string
  entity_id: string
  action: string
  details?: Record<string, unknown>
  created_at: string
}

type ViewMode = "pipeline" | "table"

const statusVariant: Record<string, "warning" | "default" | "success" | "danger"> = {
  NEW: "warning",
  CONTACTED: "default",
  QUALIFIED: "success",
  CLOSED: "success",
  LOST: "danger",
}

const sourceOptions = ["website", "phone", "referral", "social"]

/* ---------- Page Component ---------- */

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [viewMode, setViewMode] = useState<ViewMode>("pipeline")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  /* Add lead form */
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", source: "website", property_id: "", message: "" })
  const [addLoading, setAddLoading] = useState(false)

  /* Follow-up form */
  const [followUpNote, setFollowUpNote] = useState("")
  const [followUpLoading, setFollowUpLoading] = useState(false)

  /* -------- Data Fetching -------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const data = await apiJson<{ leads: Row[]; audit: Row[] }>("/api/admin/data")
      setLeads((data.leads || []) as Lead[])
      setAudit((data.audit || []) as AuditEntry[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la incarcare")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* -------- Filtering -------- */
  const filtered = leads.filter((l) => {
    if (statusFilter !== "ALL" && l.status !== statusFilter) return false
    if (search && !matches(l, search)) return false
    return true
  })

  /* -------- Pipeline Groups -------- */
  const pipelineGroups = leadStatuses.map((status) => ({
    status,
    label: statusLabel(status),
    variant: statusVariant[status] || "default",
    leads: filtered.filter((l) => l.status === status),
  }))

  /* -------- Status Change -------- */
  const changeStatus = async (leadId: string, newStatus: string) => {
    try {
      await apiJson(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Eroare la schimbarea statusului")
    }
  }

  /* -------- Add Lead -------- */
  const handleAddLead = async () => {
    if (!addForm.name.trim() || !addForm.phone.trim()) return
    try {
      setAddLoading(true)
      await apiJson("/api/admin/platform", {
        method: "POST",
        body: JSON.stringify({
          type: "lead",
          name: addForm.name.trim(),
          email: addForm.email.trim() || undefined,
          phone: addForm.phone.trim(),
          source: addForm.source,
          property_id: addForm.property_id.trim() || undefined,
          message: addForm.message.trim() || undefined,
        }),
      })
      setAddForm({ name: "", email: "", phone: "", source: "website", property_id: "", message: "" })
      setShowAddPanel(false)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Eroare la adaugarea lead-ului")
    } finally {
      setAddLoading(false)
    }
  }

  /* -------- Follow-up -------- */
  const handleAddFollowUp = async () => {
    if (!selectedLead || !followUpNote.trim()) return
    try {
      setFollowUpLoading(true)
      await apiJson("/api/admin/crm", {
        method: "POST",
        body: JSON.stringify({
          lead_id: selectedLead.id,
          note: followUpNote.trim(),
        }),
      })
      setFollowUpNote("")
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Eroare la salvarea notitei")
    } finally {
      setFollowUpLoading(false)
    }
  }

  /* -------- Open Detail -------- */
  const openDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setShowDetailPanel(true)
    setShowAddPanel(false)
  }

  /* -------- Delete Lead (via status=LOST + confirm) -------- */
  const handleDeleteLead = async (lead: Lead) => {
    if (!confirmRisk(`Sigur vrei sa marchezi lead-ul "${lead.name}" ca PIERDUT?`)) return
    await changeStatus(lead.id, "LOST")
    setShowDetailPanel(false)
    setSelectedLead(null)
  }

  /* -------- Lead Audit History -------- */
  const leadAudit = audit
    .filter((a) => a.entity === "lead" && a.entity_id === selectedLead?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ---------- Header ---------- */}
        <PageHeader
          eyebrow="Lead-uri"
          title="Pipeline de vanzari"
          subtitle="Gestioneaza lead-urile, schimba statusuri si adauga note de follow-up."
          actions={
            <Button onClick={() => { setShowAddPanel(true); setShowDetailPanel(false) }}>
              + Lead nou
            </Button>
          }
        >
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <Input
                placeholder="Cauta lead..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Status Filter */}
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Toate statusurile</option>
              {leadStatuses.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </Select>
            {/* View Toggle */}
            <div className="inline-flex rounded-xl border border-bg-surface bg-bg-primary/50">
              <button
                onClick={() => setViewMode("pipeline")}
                className={`px-3 py-2 text-xs font-semibold transition-colors rounded-l-xl ${
                  viewMode === "pipeline" ? "bg-accent text-bg-primary" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-xs font-semibold transition-colors rounded-r-xl ${
                  viewMode === "table" ? "bg-accent text-bg-primary" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Tabel
              </button>
            </div>
          </div>
        </PageHeader>

        {/* ---------- Stats Row ---------- */}
        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total" value={leads.length} />
          {leadStatuses.map((s) => (
            <StatCard key={s} label={statusLabel(s)} value={leads.filter((l) => l.status === s).length} />
          ))}
        </section>

        {/* ---------- Error ---------- */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-500">
            {error}
          </div>
        )}

        {/* ---------- Loading ---------- */}
        {loading ? (
          <LoadingState />
        ) : (
          <>
            {/* ====== Pipeline View ====== */}
            {viewMode === "pipeline" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pipelineGroups.map((group) => (
                  <Card key={group.status} title={`${group.label} (${group.leads.length})`}>
                    {group.leads.length === 0 ? (
                      <p className="py-6 text-center text-sm text-text-muted">Fara lead-uri</p>
                    ) : (
                      <div className="space-y-3">
                        {group.leads.map((lead) => (
                          <button
                            key={lead.id}
                            onClick={() => openDetail(lead)}
                            className="w-full rounded-xl border border-bg-surface bg-bg-primary/40 p-4 text-left transition-colors hover:border-accent/40 hover:bg-bg-primary/60"
                          >
                            <p className="font-semibold text-text-primary">{lead.name}</p>
                            <p className="mt-1 text-sm text-text-muted">{lead.phone}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-text-muted">
                                {lead.source || "-"} · {date(lead.created_at)}
                              </span>
                              <Badge variant={statusVariant[lead.status] || "default"}>
                                {statusLabel(lead.status)}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* ====== Table View ====== */}
            {viewMode === "table" && (
              <DataTable
                columns={[
                  { label: "Nume" },
                  { label: "Telefon" },
                  { label: "Email" },
                  { label: "Sursa" },
                  { label: "Status" },
                  { label: "Creat" },
                  { label: "Actiuni" },
                ]}
                minWidth={900}
              >
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <td className="px-4 py-3 font-semibold cursor-pointer hover:text-accent" onClick={() => openDetail(lead)}>
                      {lead.name}
                    </td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.email || "-"}</td>
                    <td className="px-4 py-3">{lead.source || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[lead.status] || "default"}>
                        {statusLabel(lead.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{date(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={lead.status}
                          onChange={(e) => changeStatus(lead.id, e.target.value)}
                          className="!w-auto !min-w-[120px] !py-1.5 !text-xs"
                        >
                          {leadStatuses.map((s) => (
                            <option key={s} value={s}>{statusLabel(s)}</option>
                          ))}
                        </Select>
                        <Button variant="ghost" className="!px-2 !py-1.5 !text-xs" onClick={() => openDetail(lead)}>
                          Detalii
                        </Button>
                      </div>
                    </td>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <EmptyState message="Nu exista lead-uri pentru filtrul ales." colSpan={7} />
                )}
              </DataTable>
            )}
          </>
        )}

        {/* ====================== */}
        {/*  SLIDE-OVER PANELS     */}
        {/* ====================== */}

        {/* ----- Add Lead Panel ----- */}
        {showAddPanel && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddPanel(false)} />
            <div className="relative z-10 w-full max-w-md overflow-y-auto bg-bg-secondary border-l border-bg-surface p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Lead nou</h2>
                <button onClick={() => setShowAddPanel(false)} className="text-text-muted hover:text-text-primary text-xl">&times;</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Nume *</label>
                  <Input
                    placeholder="Nume complet"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Telefon *</label>
                  <Input
                    placeholder="+40 ..."
                    value={addForm.phone}
                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Email</label>
                  <Input
                    placeholder="email@exemplu.ro"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Sursa</label>
                  <Select
                    value={addForm.source}
                    onChange={(e) => setAddForm((f) => ({ ...f, source: e.target.value }))}
                  >
                    {sourceOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Proprietate (optional)</label>
                  <Input
                    placeholder="ID proprietate"
                    value={addForm.property_id}
                    onChange={(e) => setAddForm((f) => ({ ...f, property_id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Mesaj</label>
                  <textarea
                    rows={3}
                    placeholder="Mesaj sau detalii..."
                    value={addForm.message}
                    onChange={(e) => setAddForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent resize-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={handleAddLead} disabled={addLoading || !addForm.name.trim() || !addForm.phone.trim()}>
                  {addLoading ? "Se salveaza..." : "Salveaza lead"}
                </Button>
                <Button variant="secondary" onClick={() => setShowAddPanel(false)}>Anuleaza</Button>
              </div>
            </div>
          </div>
        )}

        {/* ----- Detail Panel ----- */}
        {showDetailPanel && selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setShowDetailPanel(false); setSelectedLead(null) }} />
            <div className="relative z-10 w-full max-w-lg overflow-y-auto bg-bg-secondary border-l border-bg-surface p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{selectedLead.name}</h2>
                <button onClick={() => { setShowDetailPanel(false); setSelectedLead(null) }} className="text-text-muted hover:text-text-primary text-xl">&times;</button>
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Status</label>
                <Select
                  value={selectedLead.status}
                  onChange={(e) => changeStatus(selectedLead.id, e.target.value)}
                >
                  {leadStatuses.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </Select>
              </div>

              {/* Info Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Telefon</span>
                  <p className="mt-1">{selectedLead.phone}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Email</span>
                  <p className="mt-1">{selectedLead.email || "-"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Sursa</span>
                  <p className="mt-1">{selectedLead.source || "-"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Creat</span>
                  <p className="mt-1">{date(selectedLead.created_at, true)}</p>
                </div>
                {selectedLead.score !== null && selectedLead.score !== undefined && (
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Scor</span>
                    <p className="mt-1">{selectedLead.score}</p>
                  </div>
                )}
                {selectedLead.assigned_to && (
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Asignat</span>
                    <p className="mt-1">{selectedLead.assigned_to}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div className="mb-6">
                  <span className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Mesaj initial</span>
                  <p className="rounded-xl border border-bg-surface bg-bg-primary/40 p-3 text-sm">{selectedLead.message}</p>
                </div>
              )}

              {/* Note */}
              {selectedLead.note && (
                <div className="mb-6">
                  <span className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Note</span>
                  <p className="rounded-xl border border-bg-surface bg-bg-primary/40 p-3 text-sm">{selectedLead.note}</p>
                </div>
              )}

              {/* Audit History */}
              {leadAudit.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Istoric activitate</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {leadAudit.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-bg-surface bg-bg-primary/40 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{entry.action}</span>
                          <span className="text-xs text-text-muted">{date(entry.created_at, true)}</span>
                        </div>
                        {entry.details && (
                          <pre className="mt-2 text-xs text-text-muted overflow-hidden whitespace-pre-wrap break-all">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Form */}
              <div className="mb-6 border-t border-bg-surface pt-6">
                <h3 className="text-sm font-semibold mb-3">Adauga nota follow-up</h3>
                <textarea
                  rows={3}
                  placeholder="Detalii follow-up..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent resize-none"
                />
                <Button
                  onClick={handleAddFollowUp}
                  disabled={followUpLoading || !followUpNote.trim()}
                  className="mt-3"
                >
                  {followUpLoading ? "Se salveaza..." : "Salveaza nota"}
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-bg-surface pt-6">
                {selectedLead.status !== "LOST" && (
                  <Button variant="secondary" onClick={() => handleDeleteLead(selectedLead)}>
                    Marcheaza ca pierdut
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
