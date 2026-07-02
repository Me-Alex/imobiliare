"use client"

import { useEffect, useId, useMemo, useState } from "react"
import Link from "next/link"
import { supabase, type Property } from "@/lib/supabase"
import { estimateMonthlyPayment, scoreProperty, type BuyerProfile } from "@/lib/experience"
import {
  COMPARE_KEY,
  DEFAULT_BUYER_INTENT,
  FAVORITES_KEY,
  readBuyerIntent,
  readStoredIds,
  rememberPropertyView,
  subscribeClientPreferences,
  toggleStoredId,
  writeBuyerIntent,
  type BuyerIntent,
} from "@/lib/client-preferences"
import { hasKnownPrice } from "@/lib/property-display"

const purposeLabels: Record<BuyerProfile["purpose"], string> = {
  locuire: "Locuire",
  investitie: "Investitie",
  familie: "Familie",
  birou: "Birou",
}

export default function PropertyDecisionPanel({ property }: { property: Property }) {
  const [intent, setIntent] = useState<BuyerIntent>(DEFAULT_BUYER_INTENT)
  const [favorite, setFavorite] = useState(false)
  const [compare, setCompare] = useState(false)
  const [advancePercent, setAdvancePercent] = useState(20)
  const [years, setYears] = useState(25)
  const [message, setMessage] = useState("")
  const formId = useId()
  const knownPrice = hasKnownPrice(property.price)

  useEffect(() => {
    rememberPropertyView({
      id: property.id,
      title: property.title,
      slug: property.slug,
      city: property.city,
      price: property.price,
    })
  }, [property])

  useEffect(() => {
    const sync = () => {
      setIntent(readBuyerIntent())
      setFavorite(readStoredIds(FAVORITES_KEY).includes(property.id))
      setCompare(readStoredIds(COMPARE_KEY).includes(property.id))
    }
    sync()
    return subscribeClientPreferences(sync)
  }, [property.id])

  const match = useMemo(() => scoreProperty(property, intent), [property, intent])
  const monthlyPayment = useMemo(() => knownPrice ? estimateMonthlyPayment(property.price, advancePercent, years) : 0, [knownPrice, property.price, advancePercent, years])
  const cashNeeded = knownPrice ? Math.round(property.price * (advancePercent / 100)) : 0
  const priceGap = knownPrice ? property.price - intent.budget : 0

  const updateIntent = (next: BuyerIntent) => {
    setIntent(next)
    writeBuyerIntent(next)
  }

  const toggleSelection = async (key: typeof FAVORITES_KEY | typeof COMPARE_KEY) => {
    const { selected } = toggleStoredId(key, property.id, key === COMPARE_KEY ? 3 : undefined)
    if (key === FAVORITES_KEY) setFavorite(selected)
    if (key === COMPARE_KEY) setCompare(selected)
    setMessage(selected ? "Selectia a fost salvata." : "Selectia a fost eliminata.")

    if (key === FAVORITES_KEY) {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        await fetch(`/api/client/favorites${selected ? "" : `?property_id=${property.id}`}`, {
          method: selected ? "POST" : "DELETE",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: selected ? JSON.stringify({ property_id: property.id }) : undefined,
        }).catch(() => null)
      }
    }
  }

  return (
    <div className="rounded-3xl border border-bg-surface bg-bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Decizie rapida</p>
          <h3 className="mt-1 text-lg font-black text-text-primary">Potrivire si buget</h3>
        </div>
        <div className="rounded-2xl bg-accent px-3 py-2 text-center text-bg-primary">
          <p className="text-[10px] font-bold uppercase">Scor</p>
          <p className="text-2xl font-black leading-none">{match.score}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => toggleSelection(FAVORITES_KEY)} aria-pressed={favorite} className={`rounded-xl border px-3 py-3 text-sm font-black ${favorite ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-secondary text-text-primary hover:border-accent"}`}>
          {favorite ? "In favorite" : "Adauga favorit"}
        </button>
        <button onClick={() => toggleSelection(COMPARE_KEY)} aria-pressed={compare} className={`rounded-xl border px-3 py-3 text-sm font-black ${compare ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-secondary text-text-primary hover:border-accent"}`}>
          {compare ? "In comparare" : "Compara"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}

      <div className="mt-5 rounded-2xl border border-bg-surface bg-bg-secondary p-4">
        <label htmlFor={`${formId}-budget`} className="block text-xs font-bold uppercase text-text-muted">Bugetul meu</label>
        <input id={`${formId}-budget`} className="mt-3 w-full accent-accent" type="range" min={75000} max={1000000} step={25000} value={intent.budget} onChange={(event) => updateIntent({ ...intent, budget: Number(event.target.value) })} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-black text-accent">EUR {intent.budget.toLocaleString("ro-RO")}</p>
          <p className={`text-xs font-bold ${!knownPrice || priceGap <= 0 ? "text-emerald-600" : "text-amber-700"}`}>
            {!knownPrice ? "pret la cerere" : priceGap <= 0 ? "in buget" : `+ EUR ${priceGap.toLocaleString("ro-RO")}`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4">
          <label htmlFor={`${formId}-advance`} className="text-xs font-bold uppercase text-text-muted">Avans</label>
          <input id={`${formId}-advance`} className="mt-3 w-full accent-accent" type="range" min={10} max={40} step={5} value={advancePercent} onChange={(event) => setAdvancePercent(Number(event.target.value))} disabled={!knownPrice} />
          <p className="mt-2 font-black text-text-primary">{knownPrice ? `${advancePercent}% - EUR ${cashNeeded.toLocaleString("ro-RO")}` : "Se calculeaza dupa pret"}</p>
        </div>
        <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4">
          <label htmlFor={`${formId}-years`} className="text-xs font-bold uppercase text-text-muted">Perioada</label>
          <input id={`${formId}-years`} className="mt-3 w-full accent-accent" type="range" min={15} max={30} step={5} value={years} onChange={(event) => setYears(Number(event.target.value))} disabled={!knownPrice} />
          <p className="mt-2 font-black text-text-primary">{years} ani</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-bg-surface p-4">
        <p className="text-xs font-bold uppercase text-text-muted">Rata orientativa</p>
        <p className="mt-1 text-2xl font-black text-accent">{knownPrice ? `EUR ${monthlyPayment.toLocaleString("ro-RO")}/luna` : "La cerere"}</p>
        <p className="mt-1 text-xs text-text-muted">{knownPrice ? "Estimare simplificata pentru comparatie rapida, fara costuri bancare." : "Calculul devine disponibil dupa confirmarea pretului."}</p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase text-text-muted">Motive principale</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {match.reasons.length ? match.reasons.map((reason) => <span key={reason} className="rounded-full border border-bg-surface px-2.5 py-1 text-xs text-text-muted">{reason}</span>) : <span className="text-sm text-text-muted">Potrivire generala cu profilul curent.</span>}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link href="/comparare" className="rounded-xl border border-bg-surface px-4 py-3 text-center text-sm font-black text-text-primary hover:border-accent hover:text-accent">
          Vezi compararea
        </Link>
        <Link href="/login" className="rounded-xl bg-accent px-4 py-3 text-center text-sm font-black text-bg-primary">
          Cont client
        </Link>
      </div>

      <div className="mt-5 border-t border-bg-surface pt-4">
        <p className="text-xs font-bold uppercase text-text-muted">Scop cautare</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.entries(purposeLabels).map(([key, label]) => (
            <button key={key} onClick={() => updateIntent({ ...intent, purpose: key as BuyerProfile["purpose"] })} aria-pressed={intent.purpose === key} className={`rounded-xl border px-3 py-2 text-xs font-bold ${intent.purpose === key ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-secondary text-text-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
