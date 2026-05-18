"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

type Slot = {
  id: string
  label?: string
  starts_at?: string
  value?: string
  agent_email?: string | null
}

export default function ContactDetaliu({ proprietate, propertyId }: { proprietate: string; propertyId?: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState("")
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const [form, setForm] = useState({ name: "", phone: "", email: "", requested_at: tomorrow, notes: "" })

  useEffect(() => {
    const query = propertyId ? `?property_id=${propertyId}` : ""
    fetch(`/api/calendar-slots${query}`)
      .then((response) => response.json())
      .then((body) => {
        const nextSlots = Array.isArray(body.slots) ? body.slots : []
        setSlots(nextSlots)
        setSelectedSlot(nextSlots[0]?.id || "")
      })
      .catch(() => {
        setSlots([])
        setSelectedSlot("")
      })
  }, [propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const slot = slots.find((item) => item.id === selectedSlot)
    const requestedAt = slot?.starts_at || slot?.value || form.requested_at

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email,
        requested_at: requestedAt,
        slot_id: slot?.id || "",
        notes: [`Proprietate: ${proprietate}`, form.notes].filter(Boolean).join("\n"),
        property_id: propertyId || "",
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
      <p className="text-text-muted text-xs mb-4">Alege un interval, lasa datele si revenim cu confirmarea.</p>
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
        {slots.length > 0 ? (
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Slot disponibil *</label>
            <select required value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} className="form-input">
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>{slot.label || new Date(slot.starts_at || slot.value || "").toLocaleString("ro-RO")}{slot.agent_email ? ` - ${slot.agent_email}` : ""}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Data preferata *</label>
            <input type="datetime-local" required value={form.requested_at} onChange={(e) => setForm({ ...form, requested_at: e.target.value })}
              className="form-input" />
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
