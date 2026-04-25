"use client"
import { useState } from "react"

const info = [
  { icon: "📍", title: "Adresă", val: "Bd. Unirii 45, Sector 3, București" },
  { icon: "📞", title: "Telefon", val: "+40 700 000 000" },
  { icon: "📧", title: "Email", val: "contact@hqsimobiliare.ro" },
  { icon: "🕐", title: "Program", val: "Lun–Vin: 09:00–18:00, Sâm: 10:00–14:00" },
]

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nume: "", telefon: "", email: "", mesaj: "" })

  return (
    <section id="contact" className="py-20 px-4 bg-bg-secondary border-t border-bg-surface">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Hai să vorbim</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Contactează-ne</h2>
          <p className="text-text-muted mt-2">Echipa noastră îți răspunde în maxim 2 ore</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="flex flex-col gap-6">
            {info.map(item => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="text-xl bg-bg-card border border-bg-surface w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="text-accent font-semibold text-xs uppercase tracking-wider mb-0.5">{item.title}</div>
                  <div className="text-text-primary text-sm">{item.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-bg-card border border-bg-surface rounded-2xl p-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Mesaj trimis!</h3>
                <p className="text-text-muted text-sm">Te contactăm în cel mai scurt timp.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "nume", label: "Nume *", placeholder: "Ion Popescu", required: true },
                    { key: "telefon", label: "Telefon *", placeholder: "07XX XXX XXX", required: true },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">{f.label}</label>
                      <input required={f.required}
                        value={(form as any)[f.key]}
                        onChange={e => setForm({...form, [f.key]: e.target.value})}
                        className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent placeholder-bg-surface transition-colors"
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent placeholder-bg-surface transition-colors"
                    placeholder="email@exemplu.ro" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Ce proprietate cauți?</label>
                  <textarea rows={4} value={form.mesaj} onChange={e => setForm({...form, mesaj: e.target.value})}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent placeholder-bg-surface transition-colors resize-none"
                    placeholder="Ex: Apartament 3 camere în Floreasca, buget ~200k€..." />
                </div>
                <button type="submit"
                  className="bg-accent text-bg-primary py-3 rounded-xl font-bold hover:bg-green-400 transition-colors shadow-lg shadow-accent/20">
                  Trimite mesajul
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
