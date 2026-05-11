"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

const info = [
  { title: "Birou", val: "Bd. Unirii 45, Sector 3, Bucuresti" },
  { title: "Telefon", val: "+40 700 000 000" },
  { title: "Email", val: "contact@hqsimobiliare.ro" },
  { title: "Program", val: "Luni - Vineri, 09:00 - 18:00" },
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

    const { error } = await supabase.from("leads").insert([{
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      message,
      source: "CONTACT_FORM",
      status: "NEW",
    }])

    setLoading(false)
    if (error) {
      setError("Mesajul nu a putut fi trimis acum. Te rugam sa ne contactezi telefonic sau sa incerci din nou.")
      return
    }

    setSent(true)
  }

  return (
    <section id="contact" className="py-20 px-4 bg-bg-secondary border-t border-bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <span className="text-accent font-semibold text-xs uppercase tracking-widest">Contact</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Spune-ne ce cauti, apoi iti raspundem concret.</h2>
            <p className="text-text-muted mt-4 leading-relaxed">
              Nu trimitem raspunsuri automate si nu impingem proprietati nepotrivite. Daca avem o varianta buna, iti explicam de ce. Daca nu, iti spunem direct.
            </p>

            <div className="mt-8 grid gap-3">
              {info.map((item) => (
                <div key={item.title} className="flex items-start gap-4 border border-bg-surface bg-bg-card rounded-lg p-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                    {item.title.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-accent font-semibold text-xs uppercase tracking-wider mb-1">{item.title}</div>
                    <div className="text-text-primary text-sm">{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-bg-surface rounded-lg p-6 md:p-8">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
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
                  className="bg-accent text-bg-primary py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-accent/20">
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
