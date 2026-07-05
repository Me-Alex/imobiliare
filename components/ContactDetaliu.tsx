"use client"

import { useEffect, useId, useMemo, useState, type FormEvent } from "react"
import { CheckCircle2 } from "lucide-react"

export default function ContactDetaliu({ proprietate, propertyId }: { proprietate: string; propertyId?: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [slots, setSlots] = useState<any[]>([])
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([])
  const [slotsLive, setSlotsLive] = useState(false)
  const [mode, setMode] = useState<"slot" | "manual">("slot")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const formId = useId()
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
        const live = Boolean(body?.live)
        const next = live && Array.isArray(body?.slots) ? body.slots : []
        const suggestions = !live && Array.isArray(body?.suggestedSlots) ? body.suggestedSlots : []
        setSlotsLive(live)
        setSlots(next)
        setSuggestedSlots(suggestions)
        if (!next.length) setMode("manual")
        else setForm((prev) => ({ ...prev, slot_id: prev.slot_id || String(next[0]?.id || ""), requested_at: prev.requested_at }))
      })
      .catch(() => {
        setMode("manual")
      })
  }, [propertyId])

  const selectedSlot = useMemo(() => slots.find((slot) => String(slot.id) === String(form.slot_id)), [slots, form.slot_id])

  const pickSuggested = (slot: any) => {
    const value = String(slot.inputValue || slot.localValue || slot.value || slot.iso || "")
    const d = new Date(value)
    const pad = (n: number) => String(n).padStart(2, "0")
    const next = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
      ? value.slice(0, 16)
      : Number.isNaN(d.getTime())
        ? value.slice(0, 16)
      : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setForm((prev) => ({ ...prev, requested_at: next }))
    setFieldErrors((prev) => ({ ...prev, requested_at: "" }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "Completeaza numele."
    if (form.phone.trim().length < 7) nextErrors.phone = "Completeaza un telefon valid."
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Emailul nu pare valid."
    if (mode === "manual" && !form.requested_at) nextErrors.requested_at = "Alege data preferata."
    setFieldErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      setError("Verifica campurile marcate si incearca din nou.")
      return
    }
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        {[
          { key: "name", label: "Nume *", placeholder: "Numele tau", type: "text", req: true },
          { key: "phone", label: "Telefon *", placeholder: "07XX XXX XXX", type: "tel", req: true },
          { key: "email", label: "Email", placeholder: "email@exemplu.ro", type: "email", req: false },
        ].map((f) => (
          <div key={f.key}>
            <label htmlFor={`${formId}-${f.key}`} className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">{f.label}</label>
            <input id={`${formId}-${f.key}`} type={f.type} required={f.req} value={(form as any)[f.key]} onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setFieldErrors((prev) => ({ ...prev, [f.key]: "" })) }}
              className="form-input"
              aria-invalid={Boolean(fieldErrors[f.key])}
              aria-describedby={fieldErrors[f.key] ? `${formId}-${f.key}-error` : undefined}
              placeholder={f.placeholder} />
            {fieldErrors[f.key] && <p id={`${formId}-${f.key}-error`} className="mt-1 text-xs font-bold text-red-500">{fieldErrors[f.key]}</p>}
          </div>
        ))}

        {slotsLive && slots.length > 0 && (
          <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wider text-text-muted">Sloturi reale</p>
              <div className="flex gap-2">
                <button type="button" aria-pressed={mode === "slot"} onClick={() => setMode("slot")} className={`rounded-lg border px-3 py-1 text-xs font-black ${mode === "slot" ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-card text-text-muted"}`}>Slot</button>
                <button type="button" aria-pressed={mode === "manual"} onClick={() => setMode("manual")} className={`rounded-lg border px-3 py-1 text-xs font-black ${mode === "manual" ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-card text-text-muted"}`}>Manual</button>
              </div>
            </div>
            {mode === "slot" && (
              <div>
                <label htmlFor={`${formId}-slot`} className="sr-only">Alege slot real</label>
                <select id={`${formId}-slot`} className="form-input mt-3" value={form.slot_id} onChange={(e) => setForm({ ...form, slot_id: e.target.value })}>
                  {slots.slice(0, 10).map((slot) => (
                    <option key={slot.id || slot.value} value={slot.id || ""}>
                      {slot.label || new Date(slot.starts_at || slot.value).toLocaleString("ro-RO")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {mode === "slot" && selectedSlot?.agent_email && (
              <p className="mt-2 text-xs font-bold uppercase text-accent">Agent: {selectedSlot.agent_email}</p>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div>
            {!!suggestedSlots.length && (
              <div className="mb-3 rounded-2xl border border-bg-surface bg-bg-secondary p-4">
                <p className="text-xs font-black uppercase tracking-wider text-text-muted">Intervale recomandate (de confirmat)</p>
                <div className="mt-3 grid gap-2">
                  {suggestedSlots.slice(0, 4).map((slot) => (
                    <button
                      key={slot.value || slot.iso || slot.label}
                      type="button"
                      className="rounded-lg border border-bg-surface bg-bg-card px-3 py-2 text-left text-xs font-black text-text-primary hover:border-accent"
                      onClick={() => pickSuggested(slot)}
                    >
                      {slot.label || "Interval propus"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label htmlFor={`${formId}-requested-at`} className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Data preferata *</label>
            <input
              id={`${formId}-requested-at`}
              type="datetime-local"
              required
              value={form.requested_at}
              onChange={(e) => { setForm({ ...form, requested_at: e.target.value }); setFieldErrors((prev) => ({ ...prev, requested_at: "" })) }}
              className="form-input"
              aria-invalid={Boolean(fieldErrors.requested_at)}
              aria-describedby={fieldErrors.requested_at ? `${formId}-requested-at-error` : undefined}
            />
            {fieldErrors.requested_at && <p id={`${formId}-requested-at-error`} className="mt-1 text-xs font-bold text-red-500">{fieldErrors.requested_at}</p>}
          </div>
        )}
        <div>
          <label htmlFor={`${formId}-notes`} className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Observatii</label>
          <textarea id={`${formId}-notes`} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
