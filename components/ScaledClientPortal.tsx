"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { FAVORITES_KEY, readBuyerIntent, readStoredIds } from "@/lib/client-preferences"
import PortalAuthGateway from "@/components/PortalAuthGateway"

type Profile = { full_name: string; phone: string; budget: number; preferred_zones: string[]; rooms: number; purpose: string; financing_status: string }

const tabs = ["profil", "favorite", "recomandari", "documente", "oferte", "activitate", "securitate"] as const
const emptyProfile: Profile = { full_name: "Client HQS", phone: "", budget: 250000, preferred_zones: ["Pipera"], rooms: 3, purpose: "locuire", financing_status: "preaprobare in lucru" }
const emptyData = { documents: [], offers: [], favorites: [], activity: [], notifications: [], recommendations: [] }

export default function ScaledClientPortal() {
  const [token, setToken] = useState("")
  const [tab, setTab] = useState<(typeof tabs)[number]>("profil")
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null)
  const [data, setData] = useState<any>(emptyData)
  const [doc, setDoc] = useState({ title: "Carte identitate", url: "" })
  const [file, setFile] = useState<File | null>(null)
  const [security, setSecurity] = useState({ password: "", confirm: "" })
  const [message, setMessage] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || ""
      setToken(accessToken)
      if (accessToken) load(accessToken)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const accessToken = session?.access_token || ""
      setToken(accessToken)
      if (accessToken) load(accessToken)
      if (!accessToken) {
        setUser(null)
        setData(emptyData)
      }
      if (event === "PASSWORD_RECOVERY") {
        setTab("securitate")
        setMessage("Seteaza o parola noua pentru contul tau.")
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const headers = (accessToken = token) => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
  const score = useMemo(() => Math.min(100, 35 + data.favorites.length * 8 + data.documents.length * 10 + data.offers.length * 12), [data])
  const unreadNotifications = useMemo(() => (data.notifications || []).filter((n: any) => String(n.status || "").toUpperCase() === "UNREAD").length, [data.notifications])

  async function syncLocalFavorites(accessToken = token) {
    const ids = readStoredIds(FAVORITES_KEY)
    if (!ids.length || sessionStorage.getItem("hqs-local-favorites-synced") === "1") return

    await Promise.allSettled(ids.map((propertyId) => fetch("/api/client/favorites", {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({ property_id: propertyId, notes: "Sincronizat din lista locala dupa autentificare." }),
    })))
    sessionStorage.setItem("hqs-local-favorites-synced", "1")
  }

  async function load(accessToken = token) {
    await syncLocalFavorites(accessToken)

    const account = await fetch("/api/client/account", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({}))
    setUser(account.user || null)
    const localIntent = readBuyerIntent()
    const nextProfile = account.profile
      ? { ...emptyProfile, ...account.profile }
      : { ...emptyProfile, budget: localIntent.budget, preferred_zones: localIntent.area === "orice" ? emptyProfile.preferred_zones : [localIntent.area], rooms: localIntent.rooms, purpose: localIntent.purpose }
    setProfile(nextProfile)

    const [documents, offers, favorites, activity, recommendations] = await Promise.all([
      fetch("/api/client/documents", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/client/offers", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/client/favorites", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/client/activity", { headers: headers(accessToken) }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/recommendations", { method: "POST", headers: headers(accessToken), body: JSON.stringify(nextProfile) }).then((r) => r.json()).catch(() => ({})),
    ])
    setData({
      documents: documents.documents || [],
      offers: offers.offers || [],
      favorites: favorites.favorites || [],
      activity: activity.activity || [],
      notifications: activity.notifications || [],
      recommendations: recommendations.recommendations || [],
    })
  }

  async function toggleNotificationRead(id: string, nextRead: boolean) {
    if (!token) return
    const response = await fetch("/api/client/notifications", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ id, action: nextRead ? "read" : "unread" }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setMessage(body.error || "Notificarea nu a putut fi actualizata.")
      return
    }
    const updated = body.notification
    setData((prev: any) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n: any) => (n.id === id ? { ...n, ...updated } : n)),
    }))
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

  async function updatePassword() {
    if (security.password.length < 8) return setMessage("Parola noua trebuie sa aiba cel putin 8 caractere.")
    if (security.password !== security.confirm) return setMessage("Parolele nu coincid.")
    const { error } = await supabase.auth.updateUser({ password: security.password })
    setMessage(error ? error.message : "Parola a fost actualizata.")
    if (!error) setSecurity({ password: "", confirm: "" })
  }

  async function logout() {
    await supabase.auth.signOut()
    setToken("")
    setUser(null)
    setData(emptyData)
    setMessage("")
  }

  if (!token) return <PortalAuthGateway onAuthenticated={(accessToken) => { setToken(accessToken); load(accessToken) }} />

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><span className="text-xs font-bold uppercase tracking-widest text-accent">Cont client</span><h2 className="mt-2 text-3xl font-black text-text-primary">Workspace personal</h2>{user?.email && <p className="mt-1 text-sm text-text-muted">{user.email}</p>}</div><button onClick={logout} className="rounded-lg border border-bg-surface px-4 py-2 text-sm font-bold text-text-muted">Logout</button></div>
        <div className="mb-5 grid gap-3 md:grid-cols-4"><Metric label="Scor pregatire" value={`${score}/100`} /><Metric label="Favorite" value={data.favorites.length} /><Metric label="Documente" value={data.documents.length} /><Metric label="Oferte" value={data.offers.length} /></div>
        <nav className="mb-5 flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-black ${tab === item ? "border-accent bg-accent text-bg-primary" : "border-bg-surface text-text-muted"}`}>{item}</button>)}</nav>
        {message && <div className="mb-5 rounded-lg border border-bg-surface bg-bg-card p-3 text-sm text-text-muted">{message}</div>}
        {tab === "profil" && <Panel title="Profil financiar"><div className="grid gap-3 md:grid-cols-2"><Input label="Nume" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} /><Input label="Telefon" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} /><Input label="Buget" value={String(profile.budget)} onChange={(v) => setProfile({ ...profile, budget: Number(v) })} /><Input label="Zone" value={profile.preferred_zones.join(", ")} onChange={(v) => setProfile({ ...profile, preferred_zones: v.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><button onClick={saveProfile} className="mt-4 rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">Salveaza profil</button></Panel>}
        {tab === "favorite" && <Grid>{data.favorites.map((x: any) => <Card key={x.id} title={x.property?.title || "Proprietate"} meta={x.property?.city || "zona"} value={`EUR ${Number(x.property?.price || 0).toLocaleString("ro-RO")}`} />)}</Grid>}
        {tab === "recomandari" && <Grid>{data.recommendations.map((x: any) => <Card key={x.property.id} title={x.property.title} meta={(x.reasons || []).join(", ") || x.property.city} value={`${x.score}/100`} />)}</Grid>}
        {tab === "documente" && <Panel title="Documente si upload"><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><Input label="Titlu" value={doc.title} onChange={(v) => setDoc({ ...doc, title: v })} /><Input label="Link optional" value={doc.url} onChange={(v) => setDoc({ ...doc, url: v })} /><button onClick={addDocument} className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-black text-bg-primary">Adauga</button></div><input className="mt-4 block w-full text-sm text-text-muted" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /><Grid>{data.documents.map((x: any) => <Card key={x.id} title={x.title} meta={`${x.type} - ${x.notes || "in verificare"}`} value={x.status} action={x.signed_url ? <a href={x.signed_url} className="rounded-lg border border-bg-surface px-3 py-1 text-xs font-black text-accent" target="_blank">Descarca</a> : null} />)}</Grid></Panel>}
        {tab === "oferte" && <Grid>{data.offers.map((x: any) => <Card key={x.id} title={x.property_title} meta={`${new Date(x.created_at).toLocaleDateString("ro-RO")} - ${x.negotiation_history?.length || 0} pasi negociere`} value={`${x.status} - EUR ${Number(x.counter_offer || x.offer_price).toLocaleString("ro-RO")}`} />)}</Grid>}
        {tab === "activitate" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Istoric">
              {data.activity.map((x: any) => (
                <Card key={x.id} title={x.title} meta={x.description || x.type} value={new Date(x.created_at).toLocaleDateString("ro-RO")} />
              ))}
            </Panel>
            <Panel title={`Notificari${unreadNotifications ? ` (${unreadNotifications} necitite)` : ""}`}>
              {data.notifications.map((x: any) => {
                const isUnread = String(x.status || "").toUpperCase() === "UNREAD"
                return (
                  <Card
                    key={x.id}
                    title={x.title}
                    meta={x.body || x.status}
                    value={x.due_at ? new Date(x.due_at).toLocaleDateString("ro-RO") : x.status}
                    action={
                      <button
                        onClick={() => toggleNotificationRead(x.id, isUnread)}
                        className={`rounded-lg border px-3 py-1 text-xs font-black ${isUnread ? "border-accent text-accent" : "border-bg-surface text-text-muted"}`}
                      >
                        {isUnread ? "Marcheaza citit" : "Marcheaza necitit"}
                      </button>
                    }
                  />
                )
              })}
            </Panel>
          </div>
        )}
        {tab === "securitate" && <Panel title="Securitate cont"><div className="grid gap-3 md:grid-cols-2"><Input label="Parola noua" value={security.password} onChange={(v) => setSecurity({ ...security, password: v })} type="password" /><Input label="Confirma parola" value={security.confirm} onChange={(v) => setSecurity({ ...security, confirm: v })} type="password" /></div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><button onClick={updatePassword} className="rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">Actualizeaza parola</button><button onClick={logout} className="rounded-lg border border-bg-surface px-4 py-3 text-sm font-black text-text-muted">Logout complet</button></div><p className="mt-3 text-sm leading-6 text-text-muted">Dupa un email de resetare, aceasta fila iti permite sa setezi parola noua pentru contul autentificat.</p></Panel>}
      </div>
    </section>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-lg border border-bg-surface bg-bg-card p-5"><h3 className="mb-4 font-black text-text-primary">{title}</h3>{children}</div> }
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-bg-surface bg-bg-card p-4"><p className="text-xs font-bold uppercase text-text-muted">{label}</p><p className="mt-2 text-2xl font-black text-accent">{value}</p></div> }
function Card({ title, meta, value, action }: { title: string; meta: string; value: string | number; action?: React.ReactNode }) { return <div className="rounded-lg border border-bg-surface bg-bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-text-primary">{title}</p><p className="mt-1 text-sm text-text-muted">{meta}</p><p className="mt-3 text-sm font-black text-accent">{value}</p></div>{action}</div></div> }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-xs font-bold uppercase text-text-muted">{label}<input className="form-input mt-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label> }
