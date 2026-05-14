"use client"

import { useEffect, useMemo, useState } from "react"
import type { Property } from "@/lib/supabase"
import {
  buildOfferDraft,
  buildPortfolioAnalytics,
  buildSeoBlueprint,
  buildViewingSlots,
  calculateValuation,
  complexityPillars,
  getMarketSignal,
} from "@/lib/complexity"

type Tab = "client" | "piata" | "oferta" | "operatiuni"

export default function ExperienceCommandCenter({ properties }: { properties: Property[] }) {
  const [tab, setTab] = useState<Tab>("client")
  const [budget, setBudget] = useState(280000)
  const [zone, setZone] = useState("Pipera")
  const [area, setArea] = useState(86)
  const [rooms, setRooms] = useState(3)
  const [condition, setCondition] = useState<"renovat" | "bun" | "de-renovat" | "premium">("renovat")
  const [urgency, setUrgency] = useState<"rapid" | "normal" | "flexibil">("normal")
  const [slots, setSlots] = useState<ReturnType<typeof buildViewingSlots>>([])

  const analytics = useMemo(() => buildPortfolioAnalytics(properties), [properties])
  const valuation = useMemo(() => calculateValuation({ area, rooms, zone, condition, parking: 1, floor: 3 }), [area, rooms, zone, condition])
  const signal = useMemo(() => getMarketSignal(zone), [zone])
  const selected = properties[0]
  const offer = useMemo(() => buildOfferDraft({
    propertyTitle: selected?.title || "Proprietate selectata HQS",
    listPrice: selected?.price || valuation.mid,
    clientBudget: budget,
    advancePercent: 20,
    closingDays: urgency === "rapid" ? 14 : urgency === "normal" ? 30 : 45,
    riskLevel: signal.risk as "scazut" | "mediu" | "ridicat",
  }), [budget, selected, signal.risk, urgency, valuation.mid])
  const seo = useMemo(() => buildSeoBlueprint(zone), [zone])

  useEffect(() => {
    setSlots(buildViewingSlots(urgency))
  }, [urgency])

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Sistem HQS</span>
            <h2 className="mt-2 text-3xl font-black text-text-primary md:text-4xl">Experienta imobiliara completa</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
              Nu este o vitrina statica: folosim datele din portofoliu pentru recomandari, evaluare, ofertare, calendar,
              rapoarte, SEO local si workflow operational.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-bg-surface bg-bg-card p-3 text-center">
            <Metric label="Portofoliu" value={analytics.published} />
            <Metric label="Sanatate" value={`${analytics.inventoryHealth}%`} />
            <Metric label="Conversie" value={`${analytics.conversionForecast}%`} />
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto">
          {[
            ["client", "Client"],
            ["piata", "Piata"],
            ["oferta", "Oferta"],
            ["operatiuni", "Operatiuni"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-black ${tab === key ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-card text-text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <label className="text-xs font-bold uppercase text-text-muted">Buget client</label>
            <input className="mt-3 w-full accent-accent" type="range" min={75000} max={1000000} step={25000} value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
            <p className="mt-2 text-3xl font-black text-accent">EUR {budget.toLocaleString("ro-RO")}</p>
            <div className="mt-5 grid gap-3">
              <Input label="Zona" value={zone} onChange={setZone} />
              <Input label="Suprafata evaluata" value={String(area)} onChange={(value) => setArea(Number(value || 0))} type="number" />
              <Input label="Camere" value={String(rooms)} onChange={(value) => setRooms(Number(value || 0))} type="number" />
              <label className="text-xs font-bold uppercase text-text-muted">Stare</label>
              <select value={condition} onChange={(event) => setCondition(event.target.value as any)} className="form-input">
                <option value="premium">premium</option>
                <option value="renovat">renovat</option>
                <option value="bun">bun</option>
                <option value="de-renovat">de renovat</option>
              </select>
              <label className="text-xs font-bold uppercase text-text-muted">Urgenta</label>
              <select value={urgency} onChange={(event) => setUrgency(event.target.value as any)} className="form-input">
                <option value="rapid">rapid</option>
                <option value="normal">normal</option>
                <option value="flexibil">flexibil</option>
              </select>
            </div>
          </aside>

          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            {tab === "client" && (
              <div>
                <PanelTitle title="Plan client" subtitle="Cont, favorite, comparatii, dosar, recomandari si urmatorii pasi." />
                <div className="grid gap-4 md:grid-cols-3">
                  <BigMetric label="Rata estimata" value={`EUR ${Math.round((budget * 0.8) / 300).toLocaleString("ro-RO")}`} />
                  <BigMetric label="Scor profil" value={`${Math.min(98, 54 + rooms * 7 + (budget > 250000 ? 14 : 4))}/100`} />
                  <BigMetric label="Documente" value="5 pasi" />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {slots.map((slot) => <Mini key={slot.iso} title={slot.label} meta="slot recomandat pentru vizionare" value={`${slot.score}%`} />)}
                </div>
              </div>
            )}

            {tab === "piata" && (
              <div>
                <PanelTitle title="Evaluare si analiza piata" subtitle="Estimare dupa zona, suprafata, camere, stare si lichiditate." />
                <div className="grid gap-4 md:grid-cols-3">
                  <BigMetric label="Minim realist" value={`EUR ${valuation.low.toLocaleString("ro-RO")}`} />
                  <BigMetric label="Valoare tinta" value={`EUR ${valuation.mid.toLocaleString("ro-RO")}`} />
                  <BigMetric label="Maxim sustinut" value={`EUR ${valuation.high.toLocaleString("ro-RO")}`} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {valuation.notes.map((note) => <Mini key={note} title={note} meta="semnal piata" value={`${valuation.confidence}%`} />)}
                </div>
              </div>
            )}

            {tab === "oferta" && (
              <div>
                <PanelTitle title="Oferta si negociere" subtitle="Draft calculat dupa buget, risc, pret listat si termenul de inchidere." />
                <div className="grid gap-4 md:grid-cols-3">
                  <BigMetric label="Oferta recomandata" value={`EUR ${offer.recommended.toLocaleString("ro-RO")}`} />
                  <BigMetric label="Avans" value={`EUR ${offer.advance.toLocaleString("ro-RO")}`} />
                  <BigMetric label="Marja negociere" value={`EUR ${offer.negotiationRoom.toLocaleString("ro-RO")}`} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {offer.clauses.map((clause) => <Mini key={clause} title={clause} meta={offer.propertyTitle} value={`${offer.closingDays} zile`} />)}
                </div>
              </div>
            )}

            {tab === "operatiuni" && (
              <div>
                <PanelTitle title="Complexitate implementata" subtitle="Cele 15 directii sunt mapate pe suprafete reale din produs." />
                <div className="grid gap-3 md:grid-cols-2">
                  {complexityPillars.map((pillar) => (
                    <div key={pillar.key} className="rounded-lg border border-bg-surface bg-bg-secondary p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-black text-text-primary">{pillar.title}</h3>
                        <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-black text-accent">{pillar.complexity}</span>
                      </div>
                      <p className="mt-2 text-sm text-text-muted">{pillar.outcome}</p>
                      <p className="mt-3 text-xs font-bold uppercase text-text-muted">{pillar.surfaces.join(" / ")}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg border border-bg-surface bg-bg-secondary p-4">
                  <h3 className="font-black text-text-primary">SEO programatic pentru {zone}</h3>
                  <p className="mt-2 text-sm text-text-muted">{seo.description}</p>
                  <p className="mt-3 text-xs text-text-muted">{seo.sections.join(" | ")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div><p className="text-xs text-text-muted">{label}</p><p className="mt-1 text-xl font-black text-text-primary">{value}</p></div>
}

function BigMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-secondary p-4"><p className="text-xs font-bold uppercase text-text-muted">{label}</p><p className="mt-2 text-2xl font-black text-accent">{value}</p></div>
}

function Mini({ title, meta, value }: { title: string; meta: string; value: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-secondary p-4"><p className="font-bold text-text-primary">{title}</p><p className="mt-1 text-sm text-text-muted">{meta}</p><p className="mt-3 text-sm font-black text-accent">{value}</p></div>
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mb-5"><h3 className="text-2xl font-black text-text-primary">{title}</h3><p className="mt-1 text-sm text-text-muted">{subtitle}</p></div>
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2 text-xs font-bold uppercase text-text-muted">{label}<input className="form-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}
