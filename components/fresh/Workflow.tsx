"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, Heart, Loader2, Search, Send, ShieldCheck, SlidersHorizontal, Star } from "lucide-react"
import { supabase, type Property } from "@/lib/supabase"
import {
  buildLocalOffer,
  calculateSimpleValuation,
  filterProperties,
  formatCurrency,
  getAllZones,
  pricePerSqm,
  propertyImage,
  propertyTypeLabels,
  propertyTypes,
  scorePropertyForBuyer,
  zoneGuides,
} from "@/lib/fresh-data"

type RequestState = "idle" | "loading" | "success" | "error"

const browserSupabase = supabase

export function HeroSearch({ zones }: { zones: string[] }) {
  return (
    <form action="/proprietati" className="rounded-md border border-white/12 bg-white p-4 shadow-2xl dark:bg-slate-950">
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Cauta rapid
          <input name="q" className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white" placeholder="zona, titlu, adresa" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Zona
            <select name="zone" className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
              {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Buget maxim
            <input name="budget" type="number" min="0" step="1000" className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white" placeholder="300000" />
          </label>
        </div>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
          <Search className="h-4 w-4" />
          Cauta proprietati
        </button>
      </div>
    </form>
  )
}

export function PropertyExplorer({
  properties,
  initialQuery = "",
  initialZone = "Toate zonele",
  initialType = "toate",
  initialBudget,
}: {
  properties: Property[]
  initialQuery?: string
  initialZone?: string
  initialType?: string
  initialBudget?: number
}) {
  const zones = useMemo(() => getAllZones(properties), [properties])
  const [q, setQ] = useState(initialQuery)
  const [zone, setZone] = useState(initialZone)
  const [type, setType] = useState(initialType)
  const [budget, setBudget] = useState(initialBudget || 0)
  const [favorites, setFavorites] = useLocalIds("hqs:favorites")
  const [compare, setCompare] = useLocalIds("hqs:compare")

  const filtered = useMemo(() => filterProperties(properties, { q, zone, type, budget }), [properties, q, zone, type, budget])

  return (
    <section className="bg-white px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_170px]">
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Cautare
              <input value={q} onChange={(event) => setQ(event.target.value)} className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white" placeholder="Pipera, terasa, vila..." />
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Zona
              <select value={zone} onChange={(event) => setZone(event.target.value)} className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                {zones.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Tip
              <select value={type} onChange={(event) => setType(event.target.value)} className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                {propertyTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Buget
              <input value={budget || ""} onChange={(event) => setBudget(Number(event.target.value) || 0)} type="number" min="0" step="1000" className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white" placeholder="fara limita" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            {filtered.length} rezultate din {properties.length}
            <span>{favorites.length} favorite</span>
            <span>{compare.length} in comparare</span>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <InteractivePropertyCard
              key={property.id}
              property={property}
              favorite={favorites.includes(property.id)}
              compared={compare.includes(property.id)}
              onFavorite={() => setFavorites(toggleId(favorites, property.id))}
              onCompare={() => setCompare(toggleId(compare, property.id, 3))}
            />
          ))}
        </div>
        {!filtered.length ? (
          <div className="mt-8 rounded-md border border-dashed border-slate-300 p-10 text-center dark:border-white/20">
            <p className="text-xl font-black text-slate-950 dark:text-white">Nu am gasit proprietati pentru filtrele curente.</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Schimba bugetul sau zona, apoi salveaza criteriile in portal.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function InteractivePropertyCard({
  property,
  favorite,
  compared,
  onFavorite,
  onCompare,
}: {
  property: Property
  favorite: boolean
  compared: boolean
  onFavorite: () => void
  onCompare: () => void
}) {
  return (
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <Link href={`/proprietate/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
          <img src={propertyImage(property)} alt="" className="h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" decoding="async" />
          <span className="absolute left-4 top-4 rounded-md bg-white/92 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950">{propertyTypeLabels[property.type]}</span>
        </div>
        <div className="p-5">
          <h2 className="text-xl font-black leading-6 text-slate-950 dark:text-white">{property.title}</h2>
          <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">{property.city} / {property.area_sqm} mp / {property.rooms || "-"} camere</p>
          <p className="mt-4 text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(property.price, property.currency)}</p>
        </div>
      </Link>
      <div className="grid grid-cols-2 border-t border-slate-200 dark:border-white/10">
        <button onClick={onFavorite} className={`inline-flex h-12 items-center justify-center gap-2 text-sm font-black ${favorite ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"}`}>
          <Heart className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
          Favorit
        </button>
        <button onClick={onCompare} className={`inline-flex h-12 items-center justify-center gap-2 border-l border-slate-200 text-sm font-black dark:border-white/10 ${compared ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>
          <BarChart3 className="h-4 w-4" />
          Compara
        </button>
      </div>
    </article>
  )
}

export function ContactLeadForm({ property }: { property?: Property }) {
  const [state, setState] = useState<RequestState>("idle")
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("loading")
    setMessage("")
    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      budget: Number(form.get("budget") || 0),
      intent: String(form.get("intent") || "cumparare"),
      message: String(form.get("message") || ""),
      source: property ? "PROPERTY_DETAIL" : "CONTACT_FORM",
      property_id: property?.id,
      context: property ? { title: property.title, slug: property.slug, city: property.city } : { page: "contact" },
    }
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Cererea nu a putut fi trimisa")
      setState("success")
      setMessage("Cererea a fost trimisa. Echipa HQS o vede in CRM.")
      event.currentTarget.reset()
    } catch (error) {
      setState("error")
      setMessage(error instanceof Error ? error.message : "Cererea nu a putut fi trimisa")
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="name" label="Nume" required placeholder="Nume complet" />
        <Field name="phone" label="Telefon" required placeholder="+40..." />
        <Field name="email" label="Email" type="email" placeholder="email@example.com" />
        <Field name="budget" label="Buget" type="number" placeholder="250000" />
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Intentie
          <select name="intent" className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            <option value="cumparare">Cumparare</option>
            <option value="vanzare">Vanzare</option>
            <option value="investitie">Investitie</option>
            <option value="inchiriere">Inchiriere</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500 md:col-span-2">
          Mesaj
          <textarea name="message" rows={5} className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white" placeholder="Descrie ce cauti sau ce vrei sa verificam." />
        </label>
      </div>
      <button disabled={state === "loading"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Trimite cererea
      </button>
      {message ? <p className={`mt-4 text-sm font-bold ${state === "error" ? "text-rose-600" : "text-emerald-700 dark:text-emerald-300"}`}>{message}</p> : null}
    </form>
  )
}

export function ValuationLab({ properties }: { properties: Property[] }) {
  const first = properties[0]
  const [area, setArea] = useState(first?.area_sqm || 80)
  const [rooms, setRooms] = useState(first?.rooms || 3)
  const [zone, setZone] = useState(first?.city || "Bucuresti Nord")
  const [condition, setCondition] = useState("bun")
  const [parking, setParking] = useState(first?.parking_spots || 1)
  const [state, setState] = useState<RequestState>("idle")
  const [valuation, setValuation] = useState(() => calculateSimpleValuation({ area, rooms, zone, condition, parking }))

  async function run() {
    setState("loading")
    try {
      const response = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, rooms, zone, condition, parking }),
      })
      const result = await response.json()
      if (response.ok && result.valuation) {
        setValuation(result.valuation)
      } else {
        setValuation(calculateSimpleValuation({ area, rooms, zone, condition, parking }))
      }
      setState("success")
    } catch {
      setValuation(calculateSimpleValuation({ area, rooms, zone, condition, parking }))
      setState("success")
    }
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="grid gap-4 md:grid-cols-2">
        <NumberControl label="Suprafata" value={area} setValue={setArea} suffix="mp" />
        <NumberControl label="Camere" value={rooms} setValue={setRooms} />
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Zona
          <select value={zone} onChange={(event) => setZone(event.target.value)} className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            {zoneGuides.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Stare
          <select value={condition} onChange={(event) => setCondition(event.target.value)} className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            <option value="premium">Premium</option>
            <option value="renovat">Renovat</option>
            <option value="bun">Bun</option>
            <option value="de-renovat">De renovat</option>
          </select>
        </label>
        <NumberControl label="Parcari" value={parking} setValue={setParking} />
      </div>
      <button onClick={run} disabled={state === "loading"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-emerald-300">
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
        Calculeaza
      </button>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultBox label="Minim" value={formatCurrency(valuation.low)} />
        <ResultBox label="Estimat" value={formatCurrency(valuation.mid)} strong />
        <ResultBox label="Maxim" value={formatCurrency(valuation.high)} />
      </div>
    </div>
  )
}

export function OfferAndViewing({ property }: { property: Property }) {
  const [budget, setBudget] = useState(property.price)
  const [advance, setAdvance] = useState(20)
  const [days, setDays] = useState(30)
  const [risk, setRisk] = useState("mediu")
  const offer = buildLocalOffer({ title: property.title, listPrice: property.price, budget, advance, days, risk })
  const [appointmentState, setAppointmentState] = useState<RequestState>("idle")
  const [appointmentMessage, setAppointmentMessage] = useState("")

  async function requestViewing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppointmentState("loading")
    setAppointmentMessage("")
    const form = new FormData(event.currentTarget)
    const payload = {
      property_id: property.id,
      property_title: property.title,
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      urgency: String(form.get("urgency") || "normal"),
      notes: String(form.get("notes") || ""),
    }
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Programarea nu a putut fi trimisa")
      setAppointmentState("success")
      setAppointmentMessage("Cererea de vizionare a fost trimisa.")
      event.currentTarget.reset()
    } catch (error) {
      setAppointmentState("error")
      setAppointmentMessage(error instanceof Error ? error.message : "Programarea nu a putut fi trimisa")
    }
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">Oferta recomandata</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <NumberControl label="Buget" value={budget} setValue={setBudget} />
          <NumberControl label="Avans" value={advance} setValue={setAdvance} suffix="%" />
          <NumberControl label="Zile" value={days} setValue={setDays} />
        </div>
        <label className="mt-4 grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Risc
          <select value={risk} onChange={(event) => setRisk(event.target.value)} className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            <option value="scazut">Scazut</option>
            <option value="mediu">Mediu</option>
            <option value="ridicat">Ridicat</option>
          </select>
        </label>
        <div className="mt-5 rounded-md bg-emerald-50 p-5 dark:bg-emerald-500/10">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Recomandare</p>
          <p className="mt-2 text-4xl font-black text-slate-950 dark:text-white">{formatCurrency(offer.recommended)}</p>
          <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400">Spatiu negociere: {formatCurrency(offer.negotiationRoom)}</p>
        </div>
      </div>
      <form onSubmit={requestViewing} className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">Programeaza vizionare</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field name="name" label="Nume" required />
          <Field name="phone" label="Telefon" required />
          <Field name="email" label="Email" type="email" />
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Urgenta
            <select name="urgency" className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white">
              <option value="rapid">Rapid</option>
              <option value="normal">Normal</option>
              <option value="flexibil">Flexibil</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500 md:col-span-2">
            Note
            <textarea name="notes" rows={4} className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
          </label>
        </div>
        <button disabled={appointmentState === "loading"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">
          {appointmentState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
          Trimite programarea
        </button>
        {appointmentMessage ? <p className={`mt-4 text-sm font-bold ${appointmentState === "error" ? "text-rose-600" : "text-emerald-700 dark:text-emerald-300"}`}>{appointmentMessage}</p> : null}
      </form>
    </div>
  )
}

export function PropertyWorkspace({ properties, mode }: { properties: Property[]; mode: "favorites" | "compare" | "portal" }) {
  const [favorites] = useLocalIds("hqs:favorites")
  const [compare] = useLocalIds("hqs:compare")
  const ids = mode === "compare" ? compare : favorites
  const selected = properties.filter((property) => ids.includes(property.id))

  return (
    <section className="bg-white px-4 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-normal text-slate-950 dark:text-white md:text-6xl">{mode === "compare" ? "Comparare proprietati" : "Favorite"}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-400">Selectiile sunt salvate local si pot fi continuate in portal dupa autentificare.</p>
          </div>
          <Link href="/proprietati" className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300">Adauga proprietati<ArrowRight className="h-4 w-4" /></Link>
        </div>
        {selected.length ? (
          <div className="mt-10 overflow-x-auto rounded-md border border-slate-200 dark:border-white/10">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
              <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3">Proprietate</th>
                  <th className="px-4 py-3">Pret</th>
                  <th className="px-4 py-3">Zona</th>
                  <th className="px-4 py-3">Mp</th>
                  <th className="px-4 py-3">Pret/mp</th>
                  <th className="px-4 py-3">Actiune</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {selected.map((property) => (
                  <tr key={property.id}>
                    <td className="px-4 py-4 font-black text-slate-950 dark:text-white">{property.title}</td>
                    <td className="px-4 py-4 font-bold">{formatCurrency(property.price, property.currency)}</td>
                    <td className="px-4 py-4">{property.city}</td>
                    <td className="px-4 py-4">{property.area_sqm}</td>
                    <td className="px-4 py-4">{pricePerSqm(property).toLocaleString("ro-RO")}</td>
                    <td className="px-4 py-4"><Link href={`/proprietate/${property.slug}`} className="font-black text-emerald-700 dark:text-emerald-300">Detalii</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-10 rounded-md border border-dashed border-slate-300 p-10 text-center dark:border-white/20">
            <p className="text-xl font-black text-slate-950 dark:text-white">Lista este goala.</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Intra in proprietati si salveaza favorite sau adauga pana la trei proprietati la comparare.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export function PortalExperience({ properties }: { properties: Property[] }) {
  const [sessionToken, setSessionToken] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authMessage, setAuthMessage] = useState("")
  const [profileMessage, setProfileMessage] = useState("")
  const [favorites] = useLocalIds("hqs:favorites")
  const saved = properties.filter((property) => favorites.includes(property.id)).slice(0, 4)

  useEffect(() => {
    browserSupabase.auth.getSession().then(({ data }) => {
      setSessionToken(data.session?.access_token || "")
      setEmail(data.session?.user.email || "")
    })
  }, [])

  async function auth(mode: "login" | "signup") {
    setAuthMessage("Se verifica datele...")
    const result = mode === "login"
      ? await browserSupabase.auth.signInWithPassword({ email, password })
      : await browserSupabase.auth.signUp({ email, password })
    if (result.error) {
      setAuthMessage(result.error.message)
      return
    }
    setSessionToken(result.data.session?.access_token || "")
    setAuthMessage(mode === "login" ? "Autentificat." : "Cont creat. Verifica emailul daca este necesar.")
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionToken) {
      setProfileMessage("Autentifica-te pentru salvarea profilului.")
      return
    }
    const form = new FormData(event.currentTarget)
    const payload = {
      full_name: String(form.get("full_name") || ""),
      phone: String(form.get("phone") || ""),
      budget: Number(form.get("budget") || 250000),
      rooms: Number(form.get("rooms") || 2),
      purpose: String(form.get("purpose") || "locuire"),
      preferred_zones: String(form.get("preferred_zones") || "").split(",").map((item) => item.trim()).filter(Boolean),
    }
    const response = await fetch("/api/client/account", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => ({}))
    setProfileMessage(response.ok ? "Profilul a fost salvat." : result.error || "Profilul nu a putut fi salvat.")
  }

  return (
    <section className="bg-white px-4 py-16 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <h1 className="text-4xl font-black text-slate-950 dark:text-white">Portal client</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">Autentificare Supabase, profil de cumparator, favorite, recomandari si urmatorii pasi.</p>
          <div className="mt-6 grid gap-3">
            <Field name="email" label="Email" value={email} onChange={setEmail} type="email" />
            <Field name="password" label="Parola" value={password} onChange={setPassword} type="password" />
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => auth("login")} className="h-12 rounded-md bg-emerald-600 text-sm font-black text-white">Login</button>
              <button onClick={() => auth("signup")} className="h-12 rounded-md border border-slate-200 text-sm font-black text-slate-800 dark:border-white/10 dark:text-white">Creeaza cont</button>
            </div>
            {authMessage ? <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{authMessage}</p> : null}
          </div>
        </div>
        <div className="grid gap-5">
          <form onSubmit={saveProfile} className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Profil decizie</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field name="full_name" label="Nume" placeholder="Nume complet" />
              <Field name="phone" label="Telefon" placeholder="+40..." />
              <Field name="budget" label="Buget" type="number" placeholder="250000" />
              <Field name="rooms" label="Camere" type="number" placeholder="3" />
              <Field name="preferred_zones" label="Zone preferate" placeholder="Pipera, Floreasca" />
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Scop
                <select name="purpose" className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-950 dark:text-white">
                  <option value="locuire">Locuire</option>
                  <option value="familie">Familie</option>
                  <option value="investitie">Investitie</option>
                  <option value="birou">Birou</option>
                </select>
              </label>
            </div>
            <button className="mt-5 h-12 w-full rounded-md bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">Salveaza profil</button>
            {profileMessage ? <p className="mt-4 text-sm font-bold text-emerald-700 dark:text-emerald-300">{profileMessage}</p> : null}
          </form>
          <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Favorite locale</h2>
            <div className="mt-4 grid gap-3">
              {saved.length ? saved.map((property) => <Link key={property.id} href={`/proprietate/${property.slug}`} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm font-bold dark:bg-white/[0.04]"><span>{property.title}</span><span>{formatCurrency(property.price, property.currency)}</span></Link>) : <p className="text-sm text-slate-600 dark:text-slate-400">Nu ai proprietati salvate local.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function RecommendationPanel({ properties }: { properties: Property[] }) {
  const [budget, setBudget] = useState(300000)
  const [zone, setZone] = useState("orice")
  const [rooms, setRooms] = useState(3)
  const [purpose, setPurpose] = useState<"locuire" | "familie" | "investitie" | "birou">("locuire")
  const recommendations = useMemo(() => properties
    .map((property) => ({ property, ...scorePropertyForBuyer(property, { budget, zone, rooms, purpose }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4), [budget, zone, rooms, purpose, properties])

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
      <h2 className="text-2xl font-black text-slate-950 dark:text-white">Recomandari rapide</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <NumberControl label="Buget" value={budget} setValue={setBudget} />
        <NumberControl label="Camere" value={rooms} setValue={setRooms} />
        <Field name="zone" label="Zona" value={zone} onChange={setZone} />
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Scop
          <select value={purpose} onChange={(event) => setPurpose(event.target.value as typeof purpose)} className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-950 dark:text-white">
            <option value="locuire">Locuire</option>
            <option value="familie">Familie</option>
            <option value="investitie">Investitie</option>
            <option value="birou">Birou</option>
          </select>
        </label>
      </div>
      <div className="mt-5 grid gap-3">
        {recommendations.map((item) => (
          <Link key={item.property.id} href={`/proprietate/${item.property.slug}`} className="flex items-center justify-between rounded-md bg-slate-50 p-4 dark:bg-white/[0.04]">
            <span>
              <span className="block font-black text-slate-950 dark:text-white">{item.property.title}</span>
              <span className="mt-1 block text-xs font-bold text-slate-500">{item.reasons.join(", ") || "potrivire generala"}</span>
            </span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{item.score}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function AdminWorkspace({ view }: { view: string }) {
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [data, setData] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    setMessage("")
    try {
      const response = await fetch("/api/admin/data", { headers: { Authorization: `Basic ${btoa(`${user}:${password}`)}` } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Autentificare admin necesara")
      setData(result)
      setMessage("Date incarcate.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nu am putut incarca adminul.")
    } finally {
      setLoading(false)
    }
  }

  const leads = Array.isArray(data?.leads) ? data.leads : []
  const properties = Array.isArray(data?.properties) ? data.properties : []
  const appointments = Array.isArray(data?.appointments) ? data.appointments : []

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-black text-emerald-700 dark:text-emerald-300">HQS Imobiliare</Link>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-slate-950 dark:text-white">Admin operational</h1>
            <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400">Vedere: {view}</p>
          </div>
          <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:grid-cols-[160px_160px_120px]">
            <input value={user} onChange={(event) => setUser(event.target.value)} placeholder="user" className="h-11 rounded-md border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="parola" className="h-11 rounded-md border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" />
            <button onClick={loadData} disabled={loading} className="h-11 rounded-md bg-emerald-600 text-sm font-black text-white disabled:opacity-60">{loading ? "..." : "Incarca"}</button>
          </div>
        </div>
        {message ? <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-400">{message}</p> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <AdminMetric label="Lead-uri" value={leads.length} />
          <AdminMetric label="Proprietati" value={properties.length} />
          <AdminMetric label="Programari" value={appointments.length} />
          <AdminMetric label="Rol" value={data?._admin?.role || "-"} />
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <AdminList title="Lead-uri recente" items={leads.slice(0, 8)} primary="name" secondary="status" />
          <AdminList title="Programari" items={appointments.slice(0, 8)} primary="client_name" secondary="status" />
          <AdminList title="Proprietati" items={properties.slice(0, 8)} primary="title" secondary="status" />
          <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Functionalitati admin</h2>
            <div className="mt-4 grid gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
              {["CRM lead-uri", "Programari", "Proprietati", "Rapoarte", "Audit", "CMS"].map((item) => (
                <span key={item} className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-emerald-600" />{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function AdminMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function AdminList({ title, items, primary, secondary }: { title: string; items: any[]; primary: string; secondary: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
      <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.length ? items.map((item, index) => (
          <div key={item.id || index} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-white/[0.04]">
            <span className="font-black text-slate-950 dark:text-white">{item[primary] || item.title || item.name || "Inregistrare"}</span>
            <span className="font-bold text-slate-500">{item[secondary] || "activ"}</span>
          </div>
        )) : <p className="text-sm text-slate-500">Incarca datele pentru aceasta lista.</p>}
      </div>
    </div>
  )
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-white"
      />
    </label>
  )
}

function NumberControl({ label, value, setValue, suffix }: { label: string; value: number; setValue: (value: number) => void; suffix?: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      {label}
      <span className="flex h-12 overflow-hidden rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <input value={value || ""} onChange={(event) => setValue(Number(event.target.value) || 0)} type="number" className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none dark:text-white" />
        {suffix ? <span className="grid w-12 place-items-center border-l border-slate-200 text-sm font-black normal-case tracking-normal text-slate-500 dark:border-white/10">{suffix}</span> : null}
      </span>
    </label>
  )
}

function ResultBox({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${strong ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function useLocalIds(key: string) {
  const [ids, setIdsState] = useState<string[]>([])

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]")
      if (Array.isArray(parsed)) setIdsState(parsed.map(String))
    } catch {
      setIdsState([])
    }
  }, [key])

  function setIds(next: string[]) {
    setIdsState(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  return [ids, setIds] as const
}

function toggleId(ids: string[], id: string, max = 60) {
  if (ids.includes(id)) return ids.filter((item) => item !== id)
  return [id, ...ids].slice(0, max)
}
