"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

const TIPURI = ["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL"]
const STATUSURI = ["PUBLISHED", "DRAFT"]

function slugify(str: string) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
}

export default function ProprietateNoua() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "", description: "", price: "", currency: "EUR",
    type: "APARTMENT", status: "DRAFT",
    city: "", county: "Ilfov", address: "",
    area_sqm: "", rooms: "", bathrooms: "", parking_spots: "",
    featured: false,
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const slug = slugify(form.title) + "-" + Date.now().toString(36)
      const { error: err } = await supabase.from("properties").insert([{
        title: form.title,
        slug,
        description: form.description,
        price: parseFloat(form.price),
        currency: form.currency,
        type: form.type,
        status: form.status,
        city: form.city,
        county: form.county,
        address: form.address,
        area_sqm: parseFloat(form.area_sqm) || 0,
        rooms: parseInt(form.rooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        parking_spots: parseInt(form.parking_spots) || 0,
        featured: form.featured,
        published_at: form.status === "PUBLISHED" ? new Date().toISOString() : null,
      }])
      if (err) throw err
      setSuccess(true)
      setTimeout(() => router.push("/admin"), 1500)
    } catch (err: any) {
      setError(err.message || "Eroare la salvare")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="bg-bg-secondary border-b border-bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-text-muted hover:text-accent transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <span className="text-lg font-bold"><span className="text-accent">HQS</span> Admin</span>
          <span className="bg-accent/10 text-accent border border-accent/20 text-xs px-2 py-0.5 rounded-full">Proprietate nouă</span>
        </div>
        <a href="/" target="_blank" className="text-sm text-text-muted hover:text-accent transition-colors">Vezi site →</a>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {success ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Proprietate salvată!</h2>
            <p className="text-text-muted text-sm">Redirecționare către admin...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-text-primary">Adaugă proprietate nouă</h1>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {/* Informații generale */}
            <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wider text-accent">Informații generale</h2>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Titlu *</label>
                <input required value={form.title} onChange={e => set("title", e.target.value)}
                  className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  placeholder="Ex: Apartament de lux în Floreasca" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Descriere</label>
                <textarea rows={5} value={form.description} onChange={e => set("description", e.target.value)}
                  className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Descriere detaliată a proprietății..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Tip *</label>
                  <select value={form.type} onChange={e => set("type", e.target.value)}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent">
                    {TIPURI.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent">
                    {STATUSURI.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => set("featured", !form.featured)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.featured ? "bg-accent" : "bg-bg-surface"}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.featured ? "translate-x-4" : ""}`} />
                </button>
                <label className="text-sm text-text-muted">Marchează ca <span className="text-yellow-400">⭐ Featured</span></label>
              </div>
            </div>

            {/* Pret */}
            <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-accent text-sm uppercase tracking-wider">Preț</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Preț *</label>
                  <input required type="number" min="0" value={form.price} onChange={e => set("price", e.target.value)}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="250000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Monedă</label>
                  <select value={form.currency} onChange={e => set("currency", e.target.value)}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent">
                    {["EUR", "RON", "USD"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Locatie */}
            <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-accent text-sm uppercase tracking-wider">Locație</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Oraș *</label>
                  <input required value={form.city} onChange={e => set("city", e.target.value)}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="București" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Județ</label>
                  <input value={form.county} onChange={e => set("county", e.target.value)}
                    className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="Ilfov" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">Adresă</label>
                <input value={form.address} onChange={e => set("address", e.target.value)}
                  className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  placeholder="Str. Floreasca, nr. 24, Sector 1" />
              </div>
            </div>

            {/* Caracteristici */}
            <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-accent text-sm uppercase tracking-wider">Caracteristici</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "area_sqm", label: "Suprafață (mp) *", placeholder: "95", required: true },
                  { key: "rooms", label: "Camere", placeholder: "3", required: false },
                  { key: "bathrooms", label: "Băi", placeholder: "2", required: false },
                  { key: "parking_spots", label: "Parcări", placeholder: "1", required: false },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">{f.label}</label>
                    <input type="number" min="0" required={f.required} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                      className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                      placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Link href="/admin"
                className="border border-bg-surface text-text-muted px-6 py-3 rounded-xl text-sm font-medium hover:border-accent hover:text-accent transition-all">
                Anulează
              </Link>
              <button type="submit" disabled={loading}
                className="bg-accent text-bg-primary px-8 py-3 rounded-xl font-bold hover:bg-green-400 transition-colors disabled:opacity-60 shadow-lg shadow-accent/20">
                {loading ? "Se salvează..." : form.status === "PUBLISHED" ? "Publică proprietatea" : "Salvează ca draft"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
