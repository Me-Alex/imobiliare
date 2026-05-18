"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"

export default function ContactDetaliu({ proprietate, propertyId }: { proprietate: string; propertyId?: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [slots, setSlots] = useState<any[]>([])
  const [mode, setMode] = useState<"slot" | "manual">("slot")
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const [form, setForm] = useState({ name: "", phone: "", email: "", requested_at: tomorrow, slot_id: "", notes: "" })

  useEffect(() => {
    if (!propertyId) {
      setMode("manual")
      return
    }
    fetch(`/api/calendar-slots?property_id=${encodeURIComponent(propertyId)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((body) => {
        const next = Array.isArray(body?.slots) ? body.slots : []
        setSlots(next)
        if (!next.length) setMode("manual")
        else setForm((prev) => ({ ...prev, slot_id: prev.slot_id || String(next[0]?.id || ""), requested_at: prev.requested_at }))
      })
      .catch(() => {
        setMode("manual")
      })
  }, [propertyId])

  const selectedSlot = useMemo(() => slots.find((slot) => String(slot.id) === String(form.slot_id)), [slots, form.slot_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const requestedAt = mode === "slot" && selectedSlot?.starts_at ? selectedSlot.starts_at : form.requested_at
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email,
        requested_at: requestedAt,
        notes: [`Proprietate: ${proprietate}`, form.notes].filter(Boolean).join("\n"),
        property_id: propertyId || "",
        slot_id: mode === "slot" ? form.slot_id : "",
      }),
    })
    const body = await response.json().catch(() => ({}))

    setLoading(false)
    if (!response.ok) {
      setError(body.error || "Nu am putut trimite cererea. Te rugam sa incerci din nou.")
      return
    }

    setSent(true)
  }

  if (sent) return (
    <div className="rounded-3xl border border-accent/30 bg-bg-card p-6 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
        <CheckCircle2 className="h-6 w-6 text-accent" aria-hidden />
      </div>
      <h3 className="text-text-primary font-bold mb-1">Am primit cererea.</h3>
      <p className="text-text-muted text-sm">Te contactam cu detalii concrete cat mai curand.</p>
    </div>
  )

  return (
    <div className="rounded-3xl border border-bg-surface bg-bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-text-primary font-bold mb-1">Programeaza o vizionare</h3>
      <p className="text-text-muted text-xs mb-4">Alege un slot disponibil (cand exista) sau propune un interval, lasa datele si revenim cu confirmarea.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {[
          { key: "name", label: "Nume *", placeholder: "Numele tau", type: "text", req: true },
          { key: "phone", label: "Telefon *", placeholder: "07XX XXX XXX", type: "tel", req: true },
          { key: "email", label: "Email", placeholder: "email@exemplu.ro", type: "email", req: false },
        ].map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">{f.label}</label>
            <input type={f.type} required={f.req} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="form-input"
              placeholder={f.placeholder} />
          </div>
        ))}

        {slots.length > 0 && (
          <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wider text-text-muted">Sloturi reale</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMode("slot")} className={`rounded-lg border px-3 py-1 text-xs font-black ${mode === "slot" ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-card text-text-muted"}`}>Slot</button>
                <button type="button" onClick={() => setMode("manual")} className={`rounded-lg border px-3 py-1 text-xs font-black ${mode === "manual" ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-card text-text-muted"}`}>Manual</button>
              </div>
            </div>
            {mode === "slot" && (
              <select className="form-input mt-3" value={form.slot_id} onChange={(e) => setForm({ ...form, slot_id: e.target.value })}>
                {slots.slice(0, 10).map((slot) => (
                  <option key={slot.id || slot.value} value={slot.id || ""}>
                    {slot.label || new Date(slot.starts_at || slot.value).toLocaleString("ro-RO")}
                  </option>
                ))}
              </select>
            )}
            {mode === "slot" && selectedSlot?.agent_email && (
              <p className="mt-2 text-xs font-bold uppercase text-accent">Agent: {selectedSlot.agent_email}</p>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Data preferata *</label>
            <input
              type="datetime-local"
              required
              value={form.requested_at}
              onChange={(e) => setForm({ ...form, requested_at: e.target.value })}
              className="form-input"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Observatii</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="form-input resize-none" placeholder="Ex: prefer dupa ora 18:00 sau vreau detalii despre acte." />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="mt-1 rounded-xl bg-accent py-3 font-black text-bg-primary shadow-lg shadow-accent/20 transition-opacity hover:opacity-90 disabled:opacity-60">
          {loading ? "Se trimite..." : "Trimite cererea de vizionare"}
        </button>
      </form>
    </div>
  )
}
