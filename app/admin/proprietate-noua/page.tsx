"use client"

import { useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { PageHeader, Card, Button, Input, Select } from "@/components/admin/ui"
import { apiJson, slugify, propertyTypes, propertyTypeLabel } from "@/components/admin/admin-shared"
import { useRouter } from "next/navigation"

const transactionTypes = [
  { value: "SALE", label: "Vanzare" },
  { value: "RENT", label: "Inchiriere" },
]

type FormState = {
  title: string
  slug: string
  description: string
  type: string
  transaction_type: string
  price: string
  currency: string
  city: string
  zone: string
  address: string
  area_sqm: string
  rooms: string
  bathrooms: string
  parking_spots: string
  floor: string
  year_built: string
  featured: boolean
  meta_title: string
  meta_description: string
}

const initialForm: FormState = {
  title: "",
  slug: "",
  description: "",
  type: "APARTMENT",
  transaction_type: "SALE",
  price: "",
  currency: "EUR",
  city: "Bucuresti",
  zone: "",
  address: "",
  area_sqm: "",
  rooms: "",
  bathrooms: "",
  parking_spots: "",
  floor: "",
  year_built: "",
  featured: false,
  meta_title: "",
  meta_description: "",
}

export default function AdminNewPropertyPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormState>(initialForm)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "title") {
        next.slug = slugify(String(value))
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError("Titlul este obligatoriu.")
      return
    }
    const priceNum = Number(form.price)
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      setError("Pretul trebuie sa fie un numar mai mare decat zero.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await apiJson("/api/admin/properties", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug || slugify(form.title),
          description: form.description || null,
          type: form.type,
          transaction_type: form.transaction_type,
          price: priceNum,
          currency: form.currency,
          city: form.city || null,
          zone: form.zone || null,
          address: form.address || null,
          area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
          rooms: form.rooms ? Number(form.rooms) : null,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
          parking_spots: form.parking_spots ? Number(form.parking_spots) : null,
          floor: form.floor ? Number(form.floor) : null,
          year_built: form.year_built ? Number(form.year_built) : null,
          featured: form.featured,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          status: "DRAFT",
        }),
      })
      router.push("/admin/proprietati")
    } catch (err: any) {
      setError(err.message || "Salvarea a esuat.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Proprietati"
          title="Adauga proprietate noua"
          subtitle="Completeaza detaliile de baza. Proprietatea se salveaza ca draft si poate fi editata ulterior."
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Informatii generale">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Titlu *</span>
                <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Apartament 3 camere Dorobanti" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Slug</span>
                <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="auto-generat din titlu" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Tip proprietate</span>
                <Select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full">
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>{propertyTypeLabel(t)}</option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Tip tranzactie</span>
                <Select value={form.transaction_type} onChange={(e) => update("transaction_type", e.target.value)} className="w-full">
                  {transactionTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Pret *</span>
                <Input type="number" step="any" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="150000" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Moneda</span>
                <Select value={form.currency} onChange={(e) => update("currency", e.target.value)} className="w-full">
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="RON">RON</option>
                </Select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Descriere</span>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent"
                placeholder="Descriere detaliata a proprietatii..."
              />
            </label>
          </Card>

          <Card title="Locatie">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Oras</span>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Zona</span>
                <Input value={form.zone} onChange={(e) => update("zone", e.target.value)} placeholder="Dorobanti" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Adresa</span>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Str. Exemplu nr. 10" />
              </label>
            </div>
          </Card>

          <Card title="Detalii">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Suprafata (mp)</span>
                <Input type="number" value={form.area_sqm} onChange={(e) => update("area_sqm", e.target.value)} placeholder="85" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Camere</span>
                <Input type="number" value={form.rooms} onChange={(e) => update("rooms", e.target.value)} placeholder="3" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Bai</span>
                <Input type="number" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} placeholder="1" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Locuri parcare</span>
                <Input type="number" value={form.parking_spots} onChange={(e) => update("parking_spots", e.target.value)} placeholder="1" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Etaj</span>
                <Input type="number" value={form.floor} onChange={(e) => update("floor", e.target.value)} placeholder="2" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">An constructie</span>
                <Input type="number" value={form.year_built} onChange={(e) => update("year_built", e.target.value)} placeholder="2010" />
              </label>
            </div>
            <label className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
                className="h-4 w-4 rounded border-bg-surface accent-accent"
              />
              <span className="text-sm text-text-primary">Promovat (featured)</span>
            </label>
          </Card>

          <Card title="SEO">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Meta Title</span>
                <Input value={form.meta_title} onChange={(e) => update("meta_title", e.target.value)} placeholder="Titlu pentru motoarele de cautare" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">Meta Description</span>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => update("meta_description", e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent"
                  placeholder="Descriere scurta pentru SEO..."
                />
              </label>
            </div>
          </Card>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-bold text-rose-500">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Se salveaza..." : "Salveaza ca Draft"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/admin/proprietati")}>
              Renunta
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
