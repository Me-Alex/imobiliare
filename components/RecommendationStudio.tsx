"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Property } from "@/lib/supabase"
import { scoreProperty, type BuyerProfile } from "@/lib/experience"
import { DEFAULT_BUYER_INTENT, readBuyerIntent, writeBuyerIntent } from "@/lib/client-preferences"

const purposeLabels = {
  locuire: "Locuire",
  investitie: "Investitie",
  familie: "Familie",
  birou: "Birou",
} as const

export default function RecommendationStudio({ properties }: { properties: Property[] }) {
  const [profile, setProfile] = useState<BuyerProfile>(DEFAULT_BUYER_INTENT)

  useEffect(() => {
    setProfile(readBuyerIntent())
  }, [])

  const updateProfile = (next: BuyerProfile) => {
    setProfile(next)
    writeBuyerIntent(next)
  }

  const scored = useMemo(() => {
    return properties
      .map((property) => ({ property, ...scoreProperty(property, profile) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
  }, [properties, profile])

  const zones = ["orice", ...Array.from(new Set(properties.map((p) => p.city).filter(Boolean)))]

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[360px_1fr]">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent">Motor de recomandari</span>
          <h2 className="mt-3 text-3xl font-black text-text-primary">Potrivire calculata dupa buget, zona si scop</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Scorul nu inlocuieste consultanta, dar ajuta clientul sa vada rapid ce merita vizionat primul si de ce.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <label className="block text-xs font-bold uppercase text-text-muted">Buget maxim</label>
            <input className="mt-2 w-full accent-accent" type="range" min={75000} max={1000000} step={25000} value={profile.budget} onChange={(e) => updateProfile({ ...profile, budget: Number(e.target.value) })} />
            <div className="mt-1 text-lg font-black text-accent">EUR {profile.budget.toLocaleString("ro-RO")}</div>

            <label className="mt-5 block text-xs font-bold uppercase text-text-muted">Zona</label>
            <select className="form-input mt-2" value={profile.area} onChange={(e) => updateProfile({ ...profile, area: e.target.value })}>
              {zones.map((zone) => <option key={zone} value={zone}>{zone === "orice" ? "Orice zona" : zone}</option>)}
            </select>

            <label className="mt-5 block text-xs font-bold uppercase text-text-muted">Camere minime</label>
            <input className="mt-2 w-full accent-accent" type="range" min={1} max={6} step={1} value={profile.rooms} onChange={(e) => updateProfile({ ...profile, rooms: Number(e.target.value) })} />
            <div className="mt-1 text-lg font-black text-text-primary">{profile.rooms}+ camere</div>

            <label className="mt-5 block text-xs font-bold uppercase text-text-muted">Scop</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(purposeLabels).map(([key, label]) => (
                <button key={key} onClick={() => updateProfile({ ...profile, purpose: key as BuyerProfile["purpose"] })} className={`rounded-lg border px-3 py-2 text-sm font-bold ${profile.purpose === key ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-secondary text-text-muted"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {scored.map(({ property, score, reasons }) => (
              <Link key={property.id} href={`/proprietate/${property.slug}`} className="grid gap-4 rounded-lg border border-bg-surface bg-bg-card p-4 transition-all hover:border-accent md:grid-cols-[120px_1fr_120px]">
                <div className="rounded-lg bg-bg-secondary p-3">
                  <p className="text-xs text-text-muted">Scor</p>
                  <p className="text-3xl font-black text-accent">{score}</p>
                </div>
                <div>
                  <h3 className="font-black text-text-primary">{property.title}</h3>
                  <p className="mt-1 text-sm text-text-muted">{property.city} - {property.rooms || "-"} camere - {property.area_sqm} mp</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reasons.length ? reasons.map((reason) => <span key={reason} className="rounded-full border border-bg-surface px-2.5 py-1 text-xs text-text-muted">{reason}</span>) : <span className="text-xs text-text-muted">potrivire generala</span>}
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-text-muted">Pret</p>
                  <p className="font-black text-accent">EUR {property.price.toLocaleString("ro-RO")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
