"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ContactDetaliu({ proprietate, propertyId }: { proprietate: string; propertyId?: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", phone: "", email: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.from("leads").insert([{
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      message: `Interesat de: ${proprietate}`,
      source: "PROPERTY_PAGE",
      status: "NEW",
      property_id: propertyId || null,
    }])

    setLoading(false)
    if (error) {
      setError("Nu am putut trimite cererea. Te rugam sa incerci din nou.")
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
      <h3 className="text-text-primary font-bold mb-1">Vrei detalii despre aceasta proprietate?</h3>
      <p className="text-text-muted text-xs mb-4">Lasa datele si revenim cu informatii despre pret, zona si vizionare.</p>
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
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="bg-accent text-bg-primary py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-60 mt-1 shadow-lg shadow-accent/20">
          {loading ? "Se trimite..." : "Vreau mai multe detalii"}
        </button>
      </form>
    </div>
  )
}
