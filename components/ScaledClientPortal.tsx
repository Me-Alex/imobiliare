"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type Profile = { full_name: string; phone: string; budget: number; preferred_zones: string[]; rooms: number; purpose: string; financing_status: string }

const tabs = ["profil", "favorite", "recomandari", "documente", "oferte", "activitate"] as const
const emptyProfile: Profile = { full_name: "Client HQS", phone: "", budget: 250000, preferred_zones: ["Pipera"], rooms: 3, purpose: "locuire", financing_status: "preaprobare in lucru" }

export default function ScaledClientPortal() {
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [tab, setTab] = useState<(typeof tabs)[number]>("profil")
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [data, setData] = useState<any>({ documents: [], offers: [], favorites: [], activity: [], notifications: [], recommendations: [] })
  const [doc, setDoc] = useState({ title: "Carte identitate", url: "" })
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState("")

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

  const headers = (accessToken = token) => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
  const score = useMemo(() => Math.min(100, 35 + data.favorites.length * 8 + data.documents.length * 10 + data.offers.length * 12), [data])

  async function login() {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/portal` } })
    setMessage(error ? error.message : "Ti-am trimis link-ul de autentificare pe email.")
  }

  async function load(accessToken = token) {
    const [account, documents, offers, favorites, activity, recommendations] = await Promise.all([
      fetch("/api/client/account", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/client/documents", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/client/offers", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/client/favorites", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/client/activity", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/recommendations", { method: "POST", headers: headers(accessToken), body: JSON.stringify(profile) }).then((r) => r.json()).catch(() => ({})),
    ])
    if (account.profile) setProfile({ ...emptyProfile, ...account.profile })
    setData({
      documents: documents.documents || [],
      offers: offers.offers || [],
      favorites: favorites.favorites || [],
      activity: activity.activity || [],
      notifications: activity.notifications || [],
      recommendations: recommendations.recommendations || [],
    })
  }

  async function saveProfile() {
    const res = await fetch("/api/client/account", { method: "POST", headers: headers(), body: JSON.stringify(profile) })
    setMessage(res.ok ? "Profil salvat si sincronizat." : "Profilul nu a putut fi salvat.")
    load()
  }

  async function addDocument() {
    let url = doc.url || null
    if (file) {
      const { data: userData } = await supabase.auth.getUser()
      const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
      const path = `${userData.user?.id}/${Date.now()}-${name}`
      const { error } = await supabase.storage.from("client-documents").upload(path, file, { upsert: true })
      if (error) return setMessage(error.message)
      url = path
    }
    const res = await fetch("/api/client/documents", { method: "POST", headers: headers(), body: JSON.stringify({ title: doc.title, type: "dosar client", url }) })
    setMessage(res.ok ? "Document adaugat in dosar." : "Documentul nu a putut fi adaugat.")
    setDoc({ title: "Carte identitate", url: "" })
    setFile(null)
    load()
  }

  if (!token) return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_420px]">
        <div><span className="text-xs font-bold uppercase tracking-widest text-accent">Portal client</span><h2 className="mt-2 text-3xl font-black text-text-primary">Cont client cu date salvate in Supabase</h2><p className="mt-3 text-sm text-text-muted">Login prin email pentru profil, favorite, documente, oferte, activitate si recomandari.</p></div>
        <div className="rounded-lg border border-bg-surface bg-bg-card p-5"><input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.ro" /><button onClick={login} disabled={!email.includes("@")} className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary disabled:opacity-50">Trimite link login</button>{message && <p className="mt-3 text-sm text-text-muted">{message}</p>}</div>
      </div>
    </section>
  )

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><span className="text-xs font-bold uppercase tracking-widest text-accent">Portal client</span><h2 className="mt-2 text-3xl font-black text-text-primary">Workspace personal</h2></div><button onClick={() => supabase.auth.signOut()} className="rounded-lg border border-bg-surface px-4 py-2 text-sm font-bold text-text-muted">Logout</button></div>
        <div className="mb-5 grid gap-3 md:grid-cols-4"><Metric label="Scor pregatire" value={`${score}/100`} /><Metric label="Favorite" value={data.favorites.length} /><Metric label="Documente" value={data.documents.length} /><Metric label="Oferte" value={data.offers.length} /></div>
        <nav className="mb-5 flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-black ${tab === item ? "border-accent bg-accent text-bg-primary" : "border-bg-surface text-text-muted"}`}>{item}</button>)}</nav>
        {message && <div className="mb-5 rounded-lg border border-bg-surface bg-bg-card p-3 text-sm text-text-muted">{message}</div>}
        {tab === "profil" && <Panel title="Profil financiar"><div className="grid gap-3 md:grid-cols-2"><Input label="Nume" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} /><Input label="Telefon" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} /><Input label="Buget" value={String(profile.budget)} onChange={(v) => setProfile({ ...profile, budget: Number(v) })} /><Input label="Zone" value={profile.preferred_zones.join(", ")} onChange={(v) => setProfile({ ...profile, preferred_zones: v.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><button onClick={saveProfile} className="mt-4 rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">Salveaza profil</button></Panel>}
        {tab === "favorite" && <Grid>{data.favorites.map((x: any) => <Card key={x.id} title={x.property?.title || "Proprietate"} meta={x.property?.city || "zona"} value={`EUR ${Number(x.property?.price || 0).toLocaleString("ro-RO")}`} />)}</Grid>}
        {tab === "recomandari" && <Grid>{data.recommendations.map((x: any) => <Card key={x.property.id} title={x.property.title} meta={(x.reasons || []).join(", ") || x.property.city} value={`${x.score}/100`} />)}</Grid>}
        {tab === "documente" && <Panel title="Documente si upload"><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><Input label="Titlu" value={doc.title} onChange={(v) => setDoc({ ...doc, title: v })} /><Input label="Link optional" value={doc.url} onChange={(v) => setDoc({ ...doc, url: v })} /><button onClick={addDocument} className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-black text-bg-primary">Adauga</button></div><input className="mt-4 block w-full text-sm text-text-muted" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /><Grid>{data.documents.map((x: any) => <Card key={x.id} title={x.title} meta={x.type} value={x.status} />)}</Grid></Panel>}
        {tab === "oferte" && <Grid>{data.offers.map((x: any) => <Card key={x.id} title={x.property_title} meta={new Date(x.created_at).toLocaleDateString("ro-RO")} value={`${x.status} · EUR ${Number(x.counter_offer || x.offer_price).toLocaleString("ro-RO")}`} />)}</Grid>}
        {tab === "activitate" && <div className="grid gap-5 lg:grid-cols-2"><Panel title="Istoric">{data.activity.map((x: any) => <Card key={x.id} title={x.title} meta={x.description || x.type} value={new Date(x.created_at).toLocaleDateString("ro-RO")} />)}</Panel><Panel title="Notificari">{data.notifications.map((x: any) => <Card key={x.id} title={x.title} meta={x.body || x.status} value={x.due_at ? new Date(x.due_at).toLocaleDateString("ro-RO") : x.status} />)}</Panel></div>}
      </div>
    </section>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-lg border border-bg-surface bg-bg-card p-5"><h3 className="mb-4 font-black text-text-primary">{title}</h3>{children}</div> }
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-bg-surface bg-bg-card p-4"><p className="text-xs font-bold uppercase text-text-muted">{label}</p><p className="mt-2 text-2xl font-black text-accent">{value}</p></div> }
function Card({ title, meta, value }: { title: string; meta: string; value: string | number }) { return <div className="rounded-lg border border-bg-surface bg-bg-card p-4"><p className="font-black text-text-primary">{title}</p><p className="mt-1 text-sm text-text-muted">{meta}</p><p className="mt-3 text-sm font-black text-accent">{value}</p></div> }
function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-xs font-bold uppercase text-text-muted">{label}<input className="form-input mt-2" value={value} onChange={(event) => onChange(event.target.value)} /></label> }
