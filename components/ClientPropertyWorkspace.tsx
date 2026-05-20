"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Property } from "@/lib/supabase"
import { documentChecklist, estimateMonthlyPayment } from "@/lib/experience"
import { buildOfferDraft, buildPortfolioAnalytics, buildViewingSlots, calculateValuation } from "@/lib/complexity"
import {
  clearStoredIds,
  COMPARE_KEY,
  FAVORITES_KEY,
  readBuyerIntent,
  readRecentPropertyViews,
  readStoredIds,
  subscribeClientPreferences,
  writeBuyerIntent,
  type RecentPropertyView,
} from "@/lib/client-preferences"

type Mode = "favorite" | "compare" | "portal"

export default function ClientPropertyWorkspace({ properties, mode }: { properties: Property[]; mode: Mode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [clientName, setClientName] = useState("Client HQS")
  const [budget, setBudget] = useState(250000)
  const [recentViews, setRecentViews] = useState<RecentPropertyView[]>([])

  useEffect(() => {
    const sync = () => {
      setFavoriteIds(readStoredIds(FAVORITES_KEY))
      setCompareIds(readStoredIds(COMPARE_KEY))
      setClientName(localStorage.getItem("hqs-client-name") || "Client HQS")
      setBudget(readBuyerIntent().budget)
      setRecentViews(readRecentPropertyViews())
    }
    sync()
    return subscribeClientPreferences(sync)
  }, [])

  const rows = useMemo(() => {
    const ids = mode === "compare" ? compareIds : favoriteIds
    return properties.filter((property) => ids.includes(property.id))
  }, [compareIds, favoriteIds, mode, properties])

  const portalRows = useMemo(() => {
    return rows.length ? rows : properties.filter((p) => p.featured).slice(0, 4)
  }, [properties, rows])
  const analytics = useMemo(() => buildPortfolioAnalytics(properties), [properties])
  const selected = portalRows[0]
  const valuation = useMemo(() => calculateValuation({
    area: selected?.area_sqm || 80,
    rooms: selected?.rooms || 3,
    zone: selected?.city || "Bucuresti Nord",
    condition: selected?.featured ? "premium" : "bun",
    parking: selected?.parking_spots || 0,
  }), [selected])
  const offer = useMemo(() => buildOfferDraft({
    propertyTitle: selected?.title || "Proprietate HQS",
    listPrice: selected?.price || valuation.mid,
    clientBudget: budget,
    advancePercent: 20,
    closingDays: 30,
    riskLevel: valuation.market.risk as "scazut" | "mediu" | "ridicat",
  }), [budget, selected, valuation])
  const slots = useMemo(() => buildViewingSlots("normal"), [])

  const saveProfile = () => {
    localStorage.setItem("hqs-client-name", clientName)
    localStorage.setItem("hqs-client-budget", String(budget))
    writeBuyerIntent({ ...readBuyerIntent(), budget })
  }

  const clear = (key: typeof FAVORITES_KEY | typeof COMPARE_KEY) => clearStoredIds(key)

  if (mode === "compare") {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <Toolbar title="Comparare proprietati" subtitle="Analiza laterala pentru pret, suprafata, rata estimata si potrivire." action={<button onClick={() => clear(COMPARE_KEY)} className="rounded-lg border border-bg-surface px-4 py-2 text-sm font-bold text-text-muted">Goleste comparatia</button>} />
        {rows.length ? (
          <div className="overflow-x-auto rounded-lg border border-bg-surface bg-bg-card">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-muted">
                <tr><th className="p-4">Proprietate</th><th className="p-4">Pret</th><th className="p-4">Pret/mp</th><th className="p-4">Camere</th><th className="p-4">Rata</th><th className="p-4">Scor</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const sqm = p.area_sqm ? Math.round(p.price / p.area_sqm) : 0
                  const score = Math.max(35, Math.min(98, 100 - Math.round(Math.max(0, p.price - budget) / 10000) + (p.featured ? 10 : 0)))
                  return <tr key={p.id} className="border-t border-bg-surface">
                    <td className="p-4"><Link href={`/proprietate/${p.slug}`} className="font-black text-text-primary hover:text-accent">{p.title}</Link><p className="text-xs text-text-muted">{p.city}</p></td>
                    <td className="p-4 font-black text-accent">EUR {p.price.toLocaleString("ro-RO")}</td>
                    <td className="p-4">EUR {sqm.toLocaleString("ro-RO")}</td>
                    <td className="p-4">{p.rooms || "-"} camere / {p.area_sqm} mp</td>
                    <td className="p-4">EUR {estimateMonthlyPayment(p.price).toLocaleString("ro-RO")}/luna</td>
                    <td className="p-4"><span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-bg-primary">{score}</span></td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState text="Adauga proprietati la comparare din cardurile de portofoliu." />}
      </section>
    )
  }

  if (mode === "portal") {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <Toolbar headingLevel="h2" title={`Portal ${clientName}`} subtitle="Spatiu client cu favorite, comparatii, documente si urmatorii pasi." action={<Link href="/proprietati" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-bg-primary">Cauta proprietati</Link>} />
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <label className="block text-xs font-bold uppercase text-text-muted">Nume client</label>
            <input className="form-input mt-2" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            <label className="mt-4 block text-xs font-bold uppercase text-text-muted">Buget aprobat</label>
            <input className="mt-3 w-full accent-accent" type="range" min={75000} max={1000000} step={25000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            <p className="mt-1 text-2xl font-black text-accent">EUR {budget.toLocaleString("ro-RO")}</p>
            <button onClick={saveProfile} className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">Salveaza profil</button>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Favorite" value={favoriteIds.length} />
              <Metric label="Comparate" value={compareIds.length} />
            </div>
          </div>
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-3">
              {["Cerere primita", "Vizionare pregatita", "Oferta / documente"].map((step, index) => <div key={step} className="rounded-lg border border-bg-surface bg-bg-card p-5"><p className="text-xs text-text-muted">Pas {index + 1}</p><h3 className="mt-1 font-black text-text-primary">{step}</h3><p className="mt-2 text-sm text-text-muted">{index === 0 ? "Profil si criterii salvate." : index === 1 ? "Selectam proprietatile cu scor bun." : "Pregatim checklist si negociere."}</p></div>)}
            </div>
            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h3 className="font-black text-text-primary">Lista scurta</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {portalRows.map((p) => <MiniProperty key={p.id} property={p} budget={budget} />)}
              </div>
            </div>
            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h3 className="font-black text-text-primary">Vizualizate recent</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {recentViews.length ? recentViews.slice(0, 4).map((view) => (
                  <Link key={view.id} href={`/proprietate/${view.slug}`} className="rounded-lg bg-bg-secondary p-4 hover:text-accent">
                    <p className="font-black text-text-primary">{view.title}</p>
                    <p className="mt-1 text-sm text-text-muted">{view.city || "HQS"}{view.price ? ` - EUR ${view.price.toLocaleString("ro-RO")}` : ""}</p>
                  </Link>
                )) : <p className="text-sm text-text-muted">Istoricul se completeaza cand deschizi pagini de proprietate.</p>}
              </div>
            </div>
            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h3 className="font-black text-text-primary">Checklist documente</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">{documentChecklist.map((item) => <span key={item} className="rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-muted">{item}</span>)}</div>
            </div>
            <div className="grid gap-5 xl:grid-cols-3">
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <h3 className="font-black text-text-primary">Evaluare rapida</h3>
                <p className="mt-3 text-2xl font-black text-accent">EUR {valuation.mid.toLocaleString("ro-RO")}</p>
                <p className="mt-2 text-sm text-text-muted">Interval: EUR {valuation.low.toLocaleString("ro-RO")} - EUR {valuation.high.toLocaleString("ro-RO")}</p>
                <p className="mt-2 text-xs text-text-muted">Incredere: {valuation.confidence}% pe zona {valuation.market.zone}</p>
              </div>
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <h3 className="font-black text-text-primary">Oferta pregatita</h3>
                <p className="mt-3 text-2xl font-black text-accent">EUR {offer.recommended.toLocaleString("ro-RO")}</p>
                <p className="mt-2 text-sm text-text-muted">Avans estimat: EUR {offer.advance.toLocaleString("ro-RO")}</p>
                <p className="mt-2 text-xs text-text-muted">Marja negociere: EUR {offer.negotiationRoom.toLocaleString("ro-RO")}</p>
              </div>
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <h3 className="font-black text-text-primary">Raport portofoliu</h3>
                <p className="mt-3 text-2xl font-black text-accent">{analytics.inventoryHealth}%</p>
                <p className="mt-2 text-sm text-text-muted">Sanatate inventar, {analytics.premium} proprietati selectate.</p>
                <p className="mt-2 text-xs text-text-muted">Conversie prognozata: {analytics.conversionForecast}%</p>
              </div>
            </div>
            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h3 className="font-black text-text-primary">Sloturi recomandate pentru vizionare</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {slots.map((slot) => <span key={slot.iso} className="rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-muted">{slot.label} - scor {slot.score}%</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <Toolbar title="Favorite" subtitle="Proprietatile salvate raman aici pe dispozitivul tau si se sincronizeaza in portal dupa autentificare." action={<button onClick={() => clear(FAVORITES_KEY)} className="rounded-lg border border-bg-surface px-4 py-2 text-sm font-bold text-text-muted">Goleste favorite</button>} />
      {rows.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rows.map((p) => <MiniProperty key={p.id} property={p} budget={budget} />)}</div> : <EmptyState text="Apasa inima de pe o proprietate ca sa o salvezi aici." />}
    </section>
  )
}

function Toolbar({ title, subtitle, action, headingLevel = "h1" }: any) {
  const Heading = headingLevel === "h2" ? "h2" : "h1"
  return <div className="mb-7 flex flex-col gap-3 border-b border-bg-surface pb-5 md:flex-row md:items-end md:justify-between"><div><Heading className="text-3xl font-black text-text-primary">{title}</Heading><p className="mt-1 text-sm text-text-muted">{subtitle}</p></div>{action}</div>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-bg-secondary p-3"><p className="text-xs text-text-muted">{label}</p><p className="text-2xl font-black text-text-primary">{value}</p></div>
}

function MiniProperty({ property, budget }: { property: Property; budget: number }) {
  const over = property.price > budget
  return <Link href={`/proprietate/${property.slug}`} className="rounded-lg border border-bg-surface bg-bg-secondary p-4 hover:border-accent"><h3 className="font-black text-text-primary">{property.title}</h3><p className="mt-1 text-sm text-text-muted">{property.city} - {property.area_sqm} mp - {property.rooms || "-"} camere</p><p className="mt-3 font-black text-accent">EUR {property.price.toLocaleString("ro-RO")}</p><p className={`mt-2 text-xs font-bold ${over ? "text-amber-500" : "text-emerald-500"}`}>{over ? "peste bugetul salvat" : "in bugetul salvat"}</p></Link>
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-10 text-center"><h2 className="font-black text-text-primary">Nu exista selectii inca</h2><p className="mt-2 text-sm text-text-muted">{text}</p><Link href="/proprietati" className="mt-5 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-black text-bg-primary">Vezi portofoliul</Link></div>
}
