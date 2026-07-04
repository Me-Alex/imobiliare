"use client"

import { useState } from "react"
import { Card, Button, Badge, Input, Select, EmptyState } from "@/components/admin/ui"
import { usePortal } from "./PortalContext"

/* ─────────────────── helpers ─────────────────── */

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const STATUS_MAP: Record<string, { variant: "warning" | "success" | "danger" | "default"; label: string }> = {
  PENDING: { variant: "warning", label: "În așteptare" },
  CONFIRMED: { variant: "success", label: "Confirmat" },
  CANCELLED: { variant: "danger", label: "Anulat" },
  COMPLETED: { variant: "success", label: "Finalizat" },
}

function statusInfo(s: string) {
  return STATUS_MAP[s] ?? { variant: "default" as const, label: s }
}

/* ─────────────────── component ─────────────────── */

export default function AppointmentsTab() {
  const { appointments, favorites, setMessage, headers, refresh } = usePortal()

  const [propertyId, setPropertyId] = useState("")
  const [notes, setNotes] = useState("")
  const [booking, setBooking] = useState(false)

  /* Load available properties from favorites */
  const availableProperties = favorites?.map((f) => ({
    id: f.property?.id ?? f.id,
    title: f.property?.title ?? f.id,
  })) ?? []

  const handleBook = async () => {
    if (!propertyId) {
      setMessage("Selectează o proprietate.")
      return
    }
    setBooking(true)
    try {
      const res = await fetch("/api/client/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ property_id: propertyId, notes: notes.trim() }),
      })
      if (!res.ok) throw new Error()
      setPropertyId("")
      setNotes("")
      await refresh()
      setMessage("Programarea a fost trimisă.")
    } catch {
      setMessage("Nu s-a putut trimite programarea.")
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Upcoming Appointments ── */}
      <Card title="Programări">
        {!appointments || appointments.length === 0 ? (
          <EmptyState message="Nu ai nicio programare." colSpan={1} />
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const si = statusInfo(apt.status ?? "")
              return (
                <div
                  key={apt.id}
                  className="rounded-xl border border-bg-surface bg-bg-primary/30 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{apt.property_title ?? "Proprietate"}</h4>
                        <Badge variant={si.variant}>{si.label}</Badge>
                      </div>
                      {apt.starts_at && (
                        <p className="text-sm text-text-muted">
                          📅 {formatDateTime(apt.starts_at)}
                        </p>
                      )}
                      {apt.agent_email && (
                        <p className="text-sm text-text-muted">
                          👤 Agent: {apt.agent_email}
                        </p>
                      )}
                      {apt.notes && (
                        <p className="text-sm text-text-muted">{apt.notes}</p>
                      )}
                    </div>
                    {apt.requested_at && (
                      <p className="shrink-0 text-xs text-text-muted">
                        Solicitat: {formatDateTime(apt.requested_at)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Book New ── */}
      <Card title="Programează o vizitare">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">
              Proprietate
            </label>
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">Selectează proprietatea...</option>
              {availableProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
            {availableProperties.length === 0 && (
              <p className="mt-1 text-xs text-text-muted">
                Salvează proprietăți la favorite pentru a le vedea aici.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">
              Note (opțional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalii sau preferințe de oră..."
              className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleBook} disabled={booking || !propertyId}>
              {booking ? "Se trimite..." : "Trimite programare"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
