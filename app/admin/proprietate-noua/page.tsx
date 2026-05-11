"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ThemeToggle from "@/components/ThemeToggle"

const TIPURI = ["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL"]
const STATUSURI = ["PUBLISHED", "DRAFT"]

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || "Cererea a esuat")
  return body
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

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const slug = `${slugify(form.title)}-${Date.now().toString(36)}`
      await requestJson("/api/admin/properties", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          slug,
          price: Number(form.price) || 0,
          area_sqm: Number(form.area_sqm) || 0,
          rooms: Number.parseInt(form.rooms) || 0,
          bathrooms: Number.parseInt(form.bathrooms) || 0,
          parking_spots: Number.parseInt(form.parking_spots) || 0,
        }),
      })
      setSuccess(true)
      setTimeout(() => router.push("/admin"), 900)
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
          <span className="bg-accent/10 text-accent border border-accent/20 text-xs px-2 py-0.5 rounded-full">Proprietate noua</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a href="/" target="_blank" className="text-sm text-text-muted hover:text-accent transition-colors">Vezi site</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {success ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Proprietate salvata.</h2>
            <p className="text-text-muted text-sm">Revenim in panoul admin...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-text-primary">Adauga proprietate noua</h1>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="bg-bg-card border border-bg-surface rounded-lg p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wider text-accent">Informatii generale</h2>
              <AdminField label="Titlu *">
                <input required value={form.title} onChange={(event) => set("title", event.target.value)}
                  className="form-input" placeholder="Ex: Apartament luminos in Floreasca" />
              </AdminField>
              <AdminField label="Descriere">
                <textarea rows={5} value={form.description} onChange={(event) => set("description", event.target.value)}
                  className="form-input resize-none" placeholder="Descriere clara a proprietatii, zona, stare, avantaje si detalii utile." />
              </AdminField>
              <div className="grid grid-cols-2 gap-4">
                <AdminField label="Tip *">
                  <select value={form.type} onChange={(event) => set("type", event.target.value)} className="form-input">
                    {TIPURI.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </AdminField>
                <AdminField label="Status">
                  <select value={form.status} onChange={(event) => set("status", event.target.value)} className="form-input">
                    {STATUSURI.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </AdminField>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => set("featured", !form.featured)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.featured ? "bg-accent" : "bg-bg-surface"}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.featured ? "translate-x-4" : ""}`} />
                </button>
                <label className="text-sm text-text-muted">Marcheaza ca <span className="text-yellow-400">selectata</span></label>
              </div>
            </div>

            <div className="bg-bg-card border border-bg-surface rounded-lg p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-accent text-sm uppercase tracking-wider">Pret</h2>
              <div className="grid grid-cols-3 gap-4">
                <AdminField label="Pret *" className="col-span-2">
                  <input required type="number" min="0" value={form.price} onChange={(event) => set("price", event.target.value)}
                    className="form-input" placeholder="250000" />
                </AdminField>
                <AdminField label="Moneda">
                  <select value={form.currency} onChange={(event) => set("currency", event.target.value)} className="form-input">
                    {["EUR", "RON", "USD"].map((currency) => <option key={currency}>{currency}</option>)}
                  </select>
                </AdminField>
              </div>
            </div>

            <div className="bg-bg-card border border-bg-surface rounded-lg p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-accent text-sm uppercase tracking-wider">Locatie</h2>
              <div className="grid grid-cols-2 gap-4">
                <AdminField label="Oras *">
                  <input required value={form.city} onChange={(event) => set("city", event.target.value)}
                    className="form-input" placeholder="Bucuresti" />
                </AdminField>
                <AdminField label="Judet">
                  <input value={form.county} onChange={(event) => set("county", event.target.value)}
                    className="form-input" placeholder="Ilfov" />
                </AdminField>
              </div>
              <AdminField label="Adresa">
                <input value={form.address} onChange={(event) => set("address", event.target.value)}
                  className="form-input" placeholder="Strada, numar, sector sau zona" />
              </AdminField>
            </div>

            <div className="bg-bg-card border border-bg-surface rounded-lg p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-accent text-sm uppercase tracking-wider">Caracteristici</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "area_sqm", label: "Suprafata (mp) *", placeholder: "95", required: true },
                  { key: "rooms", label: "Camere", placeholder: "3", required: false },
                  { key: "bathrooms", label: "Bai", placeholder: "2", required: false },
                  { key: "parking_spots", label: "Parcari", placeholder: "1", required: false },
                ].map((field) => (
                  <AdminField key={field.key} label={field.label}>
                    <input type="number" min="0" required={field.required} value={(form as any)[field.key]} onChange={(event) => set(field.key, event.target.value)}
                      className="form-input" placeholder={field.placeholder} />
                  </AdminField>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Link href="/admin"
                className="border border-bg-surface text-text-muted px-6 py-3 rounded-lg text-sm font-medium hover:border-accent hover:text-accent transition-all">
                Anuleaza
              </Link>
              <button type="submit" disabled={loading}
                className="bg-accent text-bg-primary px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-accent/20">
                {loading ? "Se salveaza..." : form.status === "PUBLISHED" ? "Publica proprietatea" : "Salveaza ca draft"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function AdminField({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wider">{label}</span>
      {children}
    </label>
  )
}
