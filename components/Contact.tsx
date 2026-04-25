"use client"
import { useState } from "react"

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nume: "", telefon: "", email: "", mesaj: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contact" className="py-20 px-4 bg-[#1a3c5e]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-widest">Hai să vorbim</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Contactează-ne</h2>
          <p className="text-blue-200 mt-3">Echipa noastră îți răspunde în maxim 2 ore</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="flex flex-col gap-6 text-white">
            {[
              { icon: "📍", title: "Adresă", val: "Bd. Unirii 45, Sector 3, București" },
              { icon: "📞", title: "Telefon", val: "+40 700 000 000" },
              { icon: "📧", title: "Email", val: "contact@hqsimobiliare.ro" },
              { icon: "🕐", title: "Program", val: "Lun–Vin: 09:00–18:00, Sâm: 10:00–14:00" },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="text-[#c9a84c] font-semibold text-sm">{item.title}</div>
                  <div className="text-blue-100">{item.val}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-[#1a3c5e] mb-2">Mesaj trimis!</h3>
                <p className="text-gray-500">Te contactăm în cel mai scurt timp.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Nume *</label>
                    <input required value={form.nume} onChange={e => setForm({...form, nume: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]"
                      placeholder="Ion Popescu" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Telefon *</label>
                    <input required value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]"
                      placeholder="07XX XXX XXX" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]"
                    placeholder="email@exemplu.ro" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Mesaj</label>
                  <textarea rows={4} value={form.mesaj} onChange={e => setForm({...form, mesaj: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] resize-none"
                    placeholder="Spune-ne ce proprietate cauți..." />
                </div>
                <button type="submit"
                  className="bg-[#c9a84c] text-white py-3 rounded-xl font-semibold hover:bg-[#b8963e] transition-colors">
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
