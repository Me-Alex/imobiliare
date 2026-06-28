"use client"

import { useEffect, useId, useState } from "react"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { hasKnownPrice } from "@/lib/property-display"

export default function OfferSubmissionPanel({ propertyId, propertyTitle, listPrice }: { propertyId: string; propertyTitle: string; listPrice: number }) {
  const [token, setToken] = useState("")
  const [offerPrice, setOfferPrice] = useState(Math.round(listPrice * 0.96))
  const [closingDays, setClosingDays] = useState(30)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [nextPath, setNextPath] = useState("")
  const formId = useId()
  const knownPrice = hasKnownPrice(listPrice)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token || ""))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setToken(session?.access_token || ""))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (knownPrice) setOfferPrice(Math.round(listPrice * 0.96))
  }, [knownPrice, listPrice])

  useEffect(() => {
    // Preserve the current page so /login can return the client back here.
    try {
      setNextPath(window.location.pathname + window.location.search + window.location.hash)
    } catch {
      setNextPath("")
    }
  }, [])

  const loginHref = `/login?next=${encodeURIComponent(nextPath || "/portal")}`

  useEffect(() => {
    if (!token) return
    fetch("/api/client/property-view", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: propertyId,
        property_title: propertyTitle,
        price: listPrice,
        source: "property_offer_panel",
      }),
    }).catch(() => null)
  }, [token, propertyId, propertyTitle, listPrice])

  async function submitOffer() {
    setMessage("")
    if (!knownPrice) {
      setMessage("Oferta se poate trimite dupa confirmarea pretului de listare.")
      return
    }
    if (!token) {
      window.location.href = loginHref
      return
    }
    setLoading(true)
    const res = await fetch("/api/client/offers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: propertyId,
        property_title: propertyTitle,
        list_price: listPrice,
        offer_price: offerPrice,
        closing_days: closingDays,
        risk_level: "mediu",
      }),
    })
    const data = await res.json().catch(() => ({}))
    setMessage(res.ok ? "Oferta a fost trimisa in admin si in contul tau." : data.error || "Nu am putut trimite oferta.")
    setLoading(false)
  }

  return (
    <div className="rounded-3xl border border-bg-surface bg-bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-black text-text-primary">Trimite oferta</h3>
      <label htmlFor={`${formId}-offer-price`} className="mt-4 block text-xs font-bold uppercase text-text-muted">Pret oferit</label>
      <input id={`${formId}-offer-price`} className="mt-3 w-full accent-accent" type="range" min={Math.round(listPrice * 0.8)} max={listPrice} step={1000} value={offerPrice} onChange={(event) => setOfferPrice(Number(event.target.value))} disabled={!knownPrice} />
      <p className="mt-2 text-2xl font-black text-accent">EUR {offerPrice.toLocaleString("ro-RO")}</p>
      <label htmlFor={`${formId}-closing-days`} className="mt-4 block text-xs font-bold uppercase text-text-muted">Termen inchidere</label>
      <select id={`${formId}-closing-days`} className="form-input mt-2" value={closingDays} onChange={(event) => setClosingDays(Number(event.target.value))}>
        <option value={14}>14 zile</option>
        <option value={30}>30 zile</option>
        <option value={45}>45 zile</option>
      </select>
      {token ? (
        <button
          onClick={submitOffer}
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-black text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Se trimite...
            </>
          ) : (
            "Trimite oferta"
          )}
        </button>
      ) : (
        <a href={loginHref} className="mt-4 block w-full rounded-xl bg-accent px-4 py-3 text-center text-sm font-black text-bg-primary">
          Autentifica-te pentru oferta
        </a>
      )}
      {!token && <p className="mt-3 text-sm text-text-muted">Dupa autentificare revii automat pe aceasta pagina si poti trimite oferta.</p>}
      <div aria-live="assertive">
        {message && <p role="alert" className="mt-3 text-sm text-text-muted">{message}</p>}
      </div>
    </div>
  )
}
