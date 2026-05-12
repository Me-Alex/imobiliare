"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function OfferSubmissionPanel({ propertyId, propertyTitle, listPrice }: { propertyId: string; propertyTitle: string; listPrice: number }) {
  const [token, setToken] = useState("")
  const [offerPrice, setOfferPrice] = useState(Math.round(listPrice * 0.96))
  const [closingDays, setClosingDays] = useState(30)
  const [message, setMessage] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token || ""))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setToken(session?.access_token || ""))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function submitOffer() {
    setMessage("")
    if (!token) {
      setMessage("Autentifica-te in Portal pentru a trimite oferta in contul tau.")
      return
    }
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
  }

  return (
    <div className="mt-4 rounded-lg border border-bg-surface bg-bg-card p-5">
      <h3 className="font-black text-text-primary">Trimite oferta</h3>
      <label className="mt-4 block text-xs font-bold uppercase text-text-muted">Pret oferit</label>
      <input className="mt-3 w-full accent-accent" type="range" min={Math.round(listPrice * 0.8)} max={listPrice} step={1000} value={offerPrice} onChange={(event) => setOfferPrice(Number(event.target.value))} />
      <p className="mt-2 text-2xl font-black text-accent">EUR {offerPrice.toLocaleString("ro-RO")}</p>
      <label className="mt-4 block text-xs font-bold uppercase text-text-muted">Termen inchidere</label>
      <select className="form-input mt-2" value={closingDays} onChange={(event) => setClosingDays(Number(event.target.value))}>
        <option value={14}>14 zile</option>
        <option value={30}>30 zile</option>
        <option value={45}>45 zile</option>
      </select>
      <button onClick={submitOffer} className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">Trimite oferta</button>
      {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
    </div>
  )
}
