"use client"

import { useState } from "react"

export default function ContactDetaliu({ proprietate, propertyId }: { proprietate: string; propertyId?: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const [form, setForm] = useState({ name: "", phone: "", email: "", requested_at: tomorrow, notes: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email,
        requested_at: form.requested_at,
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
    <div className="bg-bg-card border border-accent/30 rounded-lg p-6 text-center">
      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-text-primary font-bold mb-1">Am primit cererea.</h3>
      <p className="text-text-muted text-sm">Te contactam cu detalii concrete cat mai curand.</p>
    </div>
  )

  return (
    <div className="bg-bg-card border border-bg-surface rounded-lg p-6">
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
        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Data preferata *</label>
          <input type="datetime-local" required value={form.requested_at} onChange={(e) => setForm({ ...form, requested_at: e.target.value })}
            className="form-input" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">Observatii</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="form-input resize-none" placeholder="Ex: prefer dupa ora 18:00 sau vreau detalii despre acte." />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="bg-accent text-bg-primary py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-60 mt-1 shadow-lg shadow-accent/20">
          {loading ? "Se trimite..." : "Trimite cererea de vizionare"}
        </button>
      </form>
    </div>
  )
}
