"use client"

import { useEffect, useState, useId } from "react"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import { supabase } from "@/lib/supabase"

type Profile = { full_name: string; phone: string | null; budget: number; preferred_zones: string[]; rooms: number; purpose: string; financing_status: string }
type ClientDocument = { id: string; title: string; type: string; status: string; expires_at: string | null; url: string | null }
type ClientOffer = { id: string; property_title: string; offer_price: number; status: string; counter_offer: number | null; created_at: string }

const emptyProfile: Profile = {
  full_name: "Client HQS",
  phone: "",
  budget: 250000,
  preferred_zones: ["Pipera"],
  rooms: 3,
  purpose: "locuire",
  financing_status: "preaprobare in lucru",
}

export default function ClientAccountPanel() {
  const [message, setMessage] = useState("")
  const [token, setToken] = useState("")
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [offers, setOffers] = useState<ClientOffer[]>([])
  const [docTitle, setDocTitle] = useState("Carte identitate")
  const [isSaving, setIsSaving] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const formId = useId()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || ""
      setToken(accessToken)
      if (accessToken) load(accessToken)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token || ""
      setToken(accessToken)
      if (accessToken) load(accessToken)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const authHeaders = (accessToken = token) => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })

  async function load(accessToken = token) {
    if (!accessToken) return
    const [accountRes, docsRes, offersRes] = await Promise.all([
      fetch("/api/client/account", { headers: authHeaders(accessToken) }),
      fetch("/api/client/documents", { headers: authHeaders(accessToken) }),
      fetch("/api/client/offers", { headers: authHeaders(accessToken) }),
    ])
    const account = await accountRes.json().catch(() => ({}))
    const docs = await docsRes.json().catch(() => ({}))
    const offerData = await offersRes.json().catch(() => ({}))
    if (account.profile) setProfile({ ...emptyProfile, ...account.profile })
    if (docs.documents) setDocuments(docs.documents)
    if (offerData.offers) setOffers(offerData.offers)
  }

  async function saveProfile() {
    if (!token) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/client/account", { method: "POST", headers: authHeaders(), body: JSON.stringify(profile) })
      const data = await res.json().catch(() => ({}))
      setMessage(res.ok ? "Profilul a fost salvat in Supabase." : data.error || "Nu am putut salva profilul.")
      await load()
    } finally {
      setIsSaving(false)
    }
  }

  async function addDocument() {
    if (!token || !docTitle.trim()) return
    setIsAdding(true)
    try {
      const res = await fetch("/api/client/documents", { method: "POST", headers: authHeaders(), body: JSON.stringify({ title: docTitle, type: "dosar client", status: "PENDING" }) })
      const data = await res.json().catch(() => ({}))
      setMessage(res.ok ? "Document adaugat in dosarul clientului." : data.error || "Nu am putut adauga documentul.")
      setDocTitle("")
      await load()
    } finally {
      setIsAdding(false)
    }
  }

  if (!token) return <PortalAuthGateway onAuthenticated={(accessToken) => { setToken(accessToken); load(accessToken) }} />

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Cont client</span>
            <h2 className="mt-2 text-3xl font-black text-text-primary">Profil, documente si oferte in Supabase</h2>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="rounded-lg border border-bg-surface px-4 py-2 text-sm font-bold text-text-muted">Logout</button>
        </div>
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <label htmlFor={`${formId}-nume`} className="text-xs font-bold uppercase text-text-muted">Nume</label>
            <input id={`${formId}-nume`} className="form-input mt-2" value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} />
            <label htmlFor={`${formId}-telefon`} className="mt-3 block text-xs font-bold uppercase text-text-muted">Telefon</label>
            <input id={`${formId}-telefon`} className="form-input mt-2" value={profile.phone || ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
            <label htmlFor={`${formId}-buget`} className="mt-3 block text-xs font-bold uppercase text-text-muted">Buget</label>
            <input id={`${formId}-buget`} className="mt-3 w-full accent-accent" type="range" min={75000} max={1000000} step={25000} value={profile.budget} onChange={(event) => setProfile({ ...profile, budget: Number(event.target.value) })} />
            <p className="mt-2 text-2xl font-black text-accent">EUR {Number(profile.budget).toLocaleString("ro-RO")}</p>
            <label htmlFor={`${formId}-zone`} className="mt-3 block text-xs font-bold uppercase text-text-muted">Zone preferate</label>
            <input id={`${formId}-zone`} className="form-input mt-2" value={profile.preferred_zones.join(", ")} onChange={(event) => setProfile({ ...profile, preferred_zones: event.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
            <button disabled={isSaving} onClick={saveProfile} className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
              {isSaving ? "Se salveaza..." : "Salveaza profil"}
            </button>
            {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
          </div>
          <div className="grid gap-5">
            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h3 className="font-black text-text-primary">Documente client</h3>
              <div className="mt-4 flex gap-2">
                <input aria-label="Nume document" className="form-input" value={docTitle} onChange={(event) => setDocTitle(event.target.value)} placeholder="Nume document" />
                <button disabled={isAdding || !docTitle.trim()} onClick={addDocument} className="rounded-lg bg-accent px-4 py-2 text-sm font-black text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
                  {isAdding ? "..." : "Adauga"}
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{documents.map((doc) => <Mini key={doc.id} title={doc.title} meta={doc.type} value={doc.status} />)}</div>
            </div>
            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h3 className="font-black text-text-primary">Oferte trimise</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{offers.map((offer) => <Mini key={offer.id} title={offer.property_title} meta={new Date(offer.created_at).toLocaleDateString("ro-RO")} value={`EUR ${Number(offer.counter_offer || offer.offer_price).toLocaleString("ro-RO")} - ${offer.status}`} />)}</div>
              {!offers.length && <p className="mt-3 text-sm text-text-muted">Ofertele trimise din portal vor aparea aici.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Mini({ title, meta, value }: { title: string; meta: string; value: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-secondary p-4"><p className="font-black text-text-primary">{title}</p><p className="mt-1 text-sm text-text-muted">{meta}</p><p className="mt-3 text-sm font-black text-accent">{value}</p></div>
}
