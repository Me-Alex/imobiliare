"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ContactDetaliu({ proprietate, propertyId }: { proprietate: string; propertyId?: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from("leads").insert([{
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        message: `Interesat de: ${proprietate}`,
        source: "PROPERTY_PAGE",
        status: "NEW",
        property_id: propertyId || null,
      }])
    } catch (err) { console.error(err) }
    finally { setLoading(false); setSent(true) }
  }

  if (sent) return (
    <div className="bg-bg-card border border-accent/30 rounded-2xl p-6 text-center">
      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h3 className="text-text-primary font-bold mb-1">Mesaj trimis!</h3>
      <p className="text-text-muted text-sm">Te contactăm în maxim 2h.</p>
    </div>
  )

  return (
    <div className="bg-bg-card border border-bg-surface rounded-2xl p-6">
      <h3 className="text-text-primary font-bold mb-1">Ești interesat?</h3>
      <p className="text-text-muted text-xs mb-4">Lasă-ți datele și te sunăm noi.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {[
          { key: "name", label: "Nume *", placeholder: "Ion Popescu", type: "text", req: true },
          { key: "phone", label: "Telefon *", placeholder: "07XX XXX XXX", type: "tel", req: true },
          { key: "email", label: "Email", placeholder: "email@exemplu.ro", type: "email", req: false },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs font-medium text-text-muted mb-1 block uppercase tracking-wider">{f.label}</label>
            <input type={f.type} required={f.req} value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors placeholder-text-muted/50"
              placeholder={f.placeholder} />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="bg-accent text-bg-primary py-3 rounded-xl font-bold hover:bg-green-400 transition-colors disabled:opacity-60 mt-1 shadow-lg shadow-accent/20">
          {loading ? "Se trimite..." : "Vreau mai multe detalii"}
        </button>
      </form>
    </div>
  )
}
