"use client"

import { useState } from "react"
import { Building2, CheckCircle2, Clock3, Mail, Phone, Send } from "lucide-react"
import { readClientPreferenceSnapshot } from "@/lib/client-preferences"

const info = [
  { icon: Building2, title: "Birou", val: "Bd. Unirii 45, Sector 3, Bucuresti" },
  { icon: Phone, title: "Telefon", val: "+40 700 000 000" },
  { icon: Mail, title: "Email", val: "contact@hqsimobiliare.ro" },
  { icon: Clock3, title: "Program", val: "Luni - Vineri, 09:00 - 18:00" },
]

const intentOptions = [
  "Vreau sa cumpar",
  "Vreau sa vand",
  "Caut chirie",
  "Vreau o evaluare",
]

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    intent: intentOptions[0],
    budget: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const message = [
      `Interes: ${form.intent}`,
      form.budget ? `Buget / valoare estimata: ${form.budget}` : "",
      form.message ? `Detalii: ${form.message}` : "",
    ].filter(Boolean).join("\n")

    const preferences = readClientPreferenceSnapshot()
    const parsedBudget = Number(form.budget.replace(/[^\d]/g, ""))
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      message,
      source: "CONTACT_FORM",
      intent: form.intent,
      budget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : preferences.buyerIntent.budget,
      context: {
        buyer_intent: preferences.buyerIntent,
        favorites: preferences.favorites,
        compare: preferences.compare,
        recent_views: preferences.recentViews.slice(0, 4),
        saved_searches: preferences.savedSearches.slice(0, 3),
      },
    }),
    })
    const body = await response.json().catch(() => ({}))

    setLoading(false)
    if (!response.ok) {
      setError(body.error || "Mesajul nu a putut fi trimis acum. Te rugam sa ne contactezi telefonic sau sa incerci din nou.")
      return
    }

    setSent(true)
  }

  return (
    <section id="contact" className="border-t border-bg-surface bg-bg-secondary px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-black leading-tight tracking-normal text-text-primary md:text-5xl">Spune-ne ce cauti, apoi iti raspundem concret.</h2>
            <p className="mt-4 leading-8 text-text-muted">
              Nu trimitem raspunsuri automate si nu impingem proprietati nepotrivite. Daca avem o varianta buna, iti explicam de ce. Daca nu, iti spunem direct.
            </p>

            <div className="mt-8 grid gap-3">
              {info.map((item) => {
                const Icon = item.icon
                return (
                <div key={item.title} className="flex items-start gap-4 border border-bg-surface bg-bg-card p-4 shadow-card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/20 bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">{item.title}</div>
                    <div className="text-sm text-text-primary">{item.val}</div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="border border-bg-surface bg-bg-card p-6 shadow-card md:p-8">
            {sent ? (
              <div className="text-center py-10">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
                  <CheckCircle2 className="h-7 w-7" aria-hidden />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Am primit mesajul.</h3>
                <p className="text-text-muted text-sm">Revenim cu un raspuns clar, de obicei in aceeasi zi lucratoare.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Nume complet" required>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="form-input" placeholder="Numele tau" />
                  </Field>
                  <Field label="Telefon" required>
                    <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="form-input" placeholder="07XX XXX XXX" />
                  </Field>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Email">
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="form-input" placeholder="email@exemplu.ro" />
                  </Field>
                  <Field label="Interes">
                    <select value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value })} className="form-input">
                      {intentOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Buget sau valoare estimata">
                  <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="form-input" placeholder="Ex: 180.000 EUR sau 900 EUR/luna" />
                </Field>
                <Field label="Detalii utile">
                  <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="form-input resize-none" placeholder="Zona, camere, termen, preferinte sau adresa proprietatii." />
                </Field>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button type="submit" disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent py-3 font-bold text-bg-primary shadow-lg shadow-accent/20 transition-opacity hover:opacity-90 disabled:opacity-60">
                  <Send className="h-4 w-4" aria-hidden />
                  {loading ? "Se trimite..." : "Trimite cererea"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">
        {label}{required ? " *" : ""}
      </span>
      {children}
    </label>
  )
}
