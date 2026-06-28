"use client"

import { useEffect, useMemo, useState } from "react"
import { scoreProperty } from "@/lib/experience"

const tabs = ["dashboard", "crm", "clienti", "cms", "programari", "oferte", "documente", "zone", "recomandari", "rapoarte", "notificari", "roluri", "audit"] as const
const stages = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "CLOSED", "LOST"]
const appointmentStatuses = ["REQUESTED", "CONFIRMED", "DONE", "CANCELLED", "REJECTED"]
const offerStatuses = ["SUBMITTED", "NEGOTIATION", "COUNTERED", "ACCEPTED", "REJECTED", "CLOSED"]
const documentStatuses = ["PENDING", "REVIEW", "APPROVED", "REJECTED", "EXPIRED", "SIGNED"]

type Tab = (typeof tabs)[number]

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}

export default function AdminScaleConsole() {
  const [tab, setTab] = useState<Tab>("dashboard")
  const [admin, setAdmin] = useState<any>({ leads: [], properties: [], appointments: [], _admin: null })
  const [platform, setPlatform] = useState<any>({})
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [filter, setFilter] = useState("")
  const [busy, setBusy] = useState("")

  const [lead, setLead] = useState({ name: "", phone: "", email: "", status: "NEW", source: "admin", note: "" })
  const [client, setClient] = useState({ id: "", full_name: "", phone: "", email: "", budget: "250000", preferred_zones: "Pipera", rooms: "3", purpose: "locuire", financing_status: "preaprobare" })
  const [slot, setSlot] = useState({ starts_at: "", ends_at: "", agent_email: "agent@hqsimobiliare.ro", property_id: "", capacity: "1", status: "AVAILABLE", notes: "" })
  const [poi, setPoi] = useState({ zone: "Pipera", name: "", category: "transport", minutes: "8", score: "85", lat: "", lng: "", notes: "" })
  const [role, setRole] = useState({ email: "agent", role: "agent", permissions: "leads,appointments,documents,offers", status: "ACTIVE" })
  const [notice, setNotice] = useState({ user_id: "", target: "", title: "Reminder HQS", body: "", channel: "EMAIL", due_at: "" })
  const [cms, setCms] = useState({ key: "home.hero", title: "Homepage hero", section: "home", headline: "", body: "", seo_title: "", seo_description: "" })

  async function load() {
    setError("")
    try {
      const [a, p] = await Promise.all([api("/api/admin/data"), api("/api/admin/platform")])
      setAdmin({ leads: a.leads || [], properties: a.properties || [], appointments: a.appointments || [], _admin: a._admin })
      setPlatform(p || {})
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  const permissions = useMemo(() => permissionList(platform._admin || admin._admin), [platform._admin, admin._admin])
  const can = (permission: string) => permissions.includes("all") || permissions.includes(permission)

  const report = useMemo(() => {
    const live = (admin.properties || []).filter((p: any) => p.status === "PUBLISHED")
    const offers = platform.property_offers || []
    const accepted = offers.filter((o: any) => ["ACCEPTED", "CLOSED"].includes(o.status)).length
    return {
      clients: platform.client_profiles?.length || 0,
      portfolio: live.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0),
      conversion: offers.length ? Math.round((accepted / offers.length) * 100) : 0,
      blockedDocs: (platform.client_documents || []).filter((d: any) => !["APPROVED", "SIGNED"].includes(d.status)).length,
      slots: platform.appointment_slots?.filter((s: any) => s.status === "AVAILABLE").length || 0,
      outbox: platform.admin_notification_outbox?.filter((n: any) => n.status !== "SENT").length || 0,
    }
  }, [admin, platform])

  async function save(type: string, payload: unknown, label = "Salvat") {
    setBusy(type)
    setError("")
    try {
      await api("/api/admin/platform", { method: "POST", body: JSON.stringify({ type, payload }) })
      setMessage(label)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Actiunea a esuat")
    } finally {
      setBusy("")
    }
  }

  const filteredLeads = rowSearch(admin.leads || [], filter)
  const filteredClients = rowSearch(platform.client_profiles || [], filter)
  const filteredOffers = rowSearch(platform.property_offers || [], filter)
  const filteredDocs = rowSearch(platform.client_documents || [], filter)

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between dark:border-bg-surface">
        <div>
          <h1 className="text-3xl font-black">Admin Operations 360</h1>
          <p className="text-sm text-slate-500">Roluri, CRUD, calendar, CMS, oferte, documente, harti, recomandari si audit operational.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{platform._admin?.role || admin._admin?.role || "admin"}</Badge>
          <button onClick={load} className="rounded-lg bg-accent px-4 py-2 text-sm font-black text-white">Refresh</button>
        </div>
      </header>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-black ${tab === item ? "border-accent bg-accent text-white" : "border-slate-200 dark:border-bg-surface"}`}>{item}</button>)}</nav>
        <input className="form-input max-w-sm" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Cauta in consola" />
      </div>

      {tab === "dashboard" && <Grid><Metric label="Clienti" value={report.clients} /><Metric label="Portofoliu" value={`EUR ${report.portfolio.toLocaleString("ro-RO")}`} /><Metric label="Conversie" value={`${report.conversion}%`} /><Metric label="Documente blocate" value={report.blockedDocs} /><Metric label="Sloturi libere" value={report.slots} /><Metric label="Notificari in coada" value={report.outbox} /></Grid>}

      {tab === "crm" && can("leads") && <Panel title="CRM complet">
        <FormGrid><Input label="Nume" value={lead.name} onChange={(v) => setLead({ ...lead, name: v })} /><Input label="Telefon" value={lead.phone} onChange={(v) => setLead({ ...lead, phone: v })} /><Input label="Email" value={lead.email} onChange={(v) => setLead({ ...lead, email: v })} /><Select label="Status" value={lead.status} options={stages} onChange={(v) => setLead({ ...lead, status: v })} /></FormGrid>
        <Textarea label="Nota interna" value={lead.note} onChange={(v) => setLead({ ...lead, note: v })} />
        <button disabled={!lead.name || busy === "lead"} onClick={() => save("lead", { ...lead, score: 60 }, "Lead salvat")} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white disabled:opacity-50">Adauga lead</button>
        <div className="mt-5 grid gap-3 xl:grid-cols-5">{stages.map((stage) => <Column key={stage} stage={stage} leads={filteredLeads} update={(id, status) => save("lead", { id, status, note: `Mutat in ${status}` }, "Lead actualizat")} />)}</div>
        <button onClick={() => downloadCsv("crm.csv", filteredLeads)} className="mt-4 rounded-lg border px-4 py-2 text-sm font-black">Export CRM</button>
      </Panel>}

      {tab === "clienti" && can("clients") && <Panel title="Clienti si profil financiar">
        <FormGrid><Input label="ID profil" value={client.id} onChange={(v) => setClient({ ...client, id: v })} /><Input label="Nume" value={client.full_name} onChange={(v) => setClient({ ...client, full_name: v })} /><Input label="Telefon" value={client.phone} onChange={(v) => setClient({ ...client, phone: v })} /><Input label="Buget" value={client.budget} onChange={(v) => setClient({ ...client, budget: v })} /><Input label="Zone" value={client.preferred_zones} onChange={(v) => setClient({ ...client, preferred_zones: v })} /><Input label="Camere" value={client.rooms} onChange={(v) => setClient({ ...client, rooms: v })} /></FormGrid>
        <button disabled={!client.id || busy === "client_profile"} onClick={() => save("client_profile", { ...client, preferred_zones: client.preferred_zones.split(",").map((x) => x.trim()).filter(Boolean) }, "Client actualizat")} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white disabled:opacity-50">Actualizeaza client</button>
        <Grid>{filteredClients.map((x: any) => <ActionCard key={x.id} title={x.full_name || x.email} meta={(x.preferred_zones || []).join(", ") || "orice"} value={`EUR ${Number(x.budget || 0).toLocaleString("ro-RO")}`} action={<button onClick={() => setClient({ ...client, ...x, budget: String(x.budget || 0), rooms: String(x.rooms || 2), preferred_zones: (x.preferred_zones || []).join(", ") })} className="rounded-lg border px-3 py-1 text-xs font-black">Editeaza</button>} />)}</Grid>
      </Panel>}

      {tab === "cms" && can("cms") && <Panel title="CMS conectat in site">
        <FormGrid><Input label="Key" value={cms.key} onChange={(v) => setCms({ ...cms, key: v })} /><Input label="Titlu" value={cms.title} onChange={(v) => setCms({ ...cms, title: v })} /><Input label="Sectiune" value={cms.section} onChange={(v) => setCms({ ...cms, section: v })} /><Input label="Headline" value={cms.headline} onChange={(v) => setCms({ ...cms, headline: v })} /><Input label="SEO title" value={cms.seo_title} onChange={(v) => setCms({ ...cms, seo_title: v })} /><Input label="SEO description" value={cms.seo_description} onChange={(v) => setCms({ ...cms, seo_description: v })} /></FormGrid>
        <Textarea label="Body" value={cms.body} onChange={(v) => setCms({ ...cms, body: v })} />
        <button onClick={() => save("cms", { key: cms.key, title: cms.title, section: cms.section, content: { headline: cms.headline, body: cms.body }, seo: { title: cms.seo_title, description: cms.seo_description } }, "CMS publicat")} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white">Publica</button>
        <Grid>{(platform.cms_entries || []).map((x: any) => <ActionCard key={x.id} title={x.key} meta={x.title} value={x.section} action={<button onClick={() => setCms({ key: x.key, title: x.title, section: x.section, headline: x.content?.headline || "", body: x.content?.body || "", seo_title: x.seo?.title || "", seo_description: x.seo?.description || "" })} className="rounded-lg border px-3 py-1 text-xs font-black">Incarca</button>} />)}</Grid>
      </Panel>}

      {tab === "programari" && can("appointments") && <Panel title="Calendar editabil">
        <FormGrid><Input label="Start" type="datetime-local" value={slot.starts_at} onChange={(v) => setSlot({ ...slot, starts_at: v })} /><Input label="Final" type="datetime-local" value={slot.ends_at} onChange={(v) => setSlot({ ...slot, ends_at: v })} /><Input label="Agent" value={slot.agent_email} onChange={(v) => setSlot({ ...slot, agent_email: v })} /><Input label="Property ID" value={slot.property_id} onChange={(v) => setSlot({ ...slot, property_id: v })} /><Input label="Capacitate" value={slot.capacity} onChange={(v) => setSlot({ ...slot, capacity: v })} /><Select label="Status" value={slot.status} options={["AVAILABLE", "BOOKED", "BLOCKED"]} onChange={(v) => setSlot({ ...slot, status: v })} /></FormGrid>
        <Textarea label="Note slot" value={slot.notes} onChange={(v) => setSlot({ ...slot, notes: v })} />
        <button disabled={!slot.starts_at || busy === "appointment_slot"} onClick={() => save("appointment_slot", slot, "Slot salvat")} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white disabled:opacity-50">Salveaza slot</button>
        <div className="mt-5 grid gap-4 lg:grid-cols-2"><Panel title="Sloturi">{(platform.appointment_slots || []).map((x: any) => <ActionCard key={x.id} title={new Date(x.starts_at).toLocaleString("ro-RO")} meta={x.agent_email || "fara agent"} value={x.status} action={<button onClick={() => save("appointment_slot", { id: x.id, action: "delete" }, "Slot sters")} className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-black text-rose-600">Sterge</button>} />)}</Panel><Panel title="Programari">{(admin.appointments || []).map((x: any) => <ActionCard key={x.id} title={x.client_name} meta={new Date(x.requested_at).toLocaleString("ro-RO")} value={x.status || "REQUESTED"} action={<Select value={x.status || "REQUESTED"} options={appointmentStatuses} onChange={(status) => save("appointment", { id: x.id, status }, "Programare actualizata")} />} />)}</Panel></div>
      </Panel>}

      {tab === "oferte" && can("offers") && <Grid>{filteredOffers.map((x: any) => <ActionCard key={x.id} title={x.property_title} meta={`${x.client_email || x.client_name || "client"} - EUR ${Number(x.offer_price || 0).toLocaleString("ro-RO")}`} value={x.status} action={<div className="flex flex-wrap gap-2"><button onClick={() => save("offer_status", { id: x.id, status: "ACCEPTED", notes: "Acceptata din admin" }, "Oferta acceptata")} className="rounded-lg border px-3 py-1 text-xs font-black">Accepta</button><button onClick={() => save("offer_status", { id: x.id, status: "COUNTERED", counter_offer: Number(x.counter_offer || x.offer_price || 0) + 5000, notes: "Contraoferta generata" }, "Contraoferta trimisa")} className="rounded-lg border px-3 py-1 text-xs font-black">Contra</button><button onClick={() => save("offer_status", { id: x.id, status: "REJECTED", notes: "Respinsa din admin" }, "Oferta respinsa")} className="rounded-lg border px-3 py-1 text-xs font-black text-rose-600">Respinge</button></div>} />)}</Grid>}

      {tab === "documente" && can("documents") && <Grid>{filteredDocs.map((x: any) => <ActionCard key={x.id} title={x.title} meta={`${x.type || "document"} - ${x.notes || "fara note"}`} value={x.status} action={<div className="flex flex-wrap gap-2">{documentStatuses.map((status) => <button key={status} onClick={() => save("document_status", { id: x.id, status, notes: `Review ${status}` }, "Document revizuit")} className="rounded-lg border px-2 py-1 text-xs font-black">{status}</button>)}</div>} />)}</Grid>}

      {tab === "zone" && can("zones") && <Panel title="Harti si POI">
        <FormGrid><Input label="Zona" value={poi.zone} onChange={(v) => setPoi({ ...poi, zone: v })} /><Input label="Nume POI" value={poi.name} onChange={(v) => setPoi({ ...poi, name: v })} /><Input label="Categorie" value={poi.category} onChange={(v) => setPoi({ ...poi, category: v })} /><Input label="Minute" value={poi.minutes} onChange={(v) => setPoi({ ...poi, minutes: v })} /><Input label="Scor" value={poi.score} onChange={(v) => setPoi({ ...poi, score: v })} /><Input label="Lat" value={poi.lat} onChange={(v) => setPoi({ ...poi, lat: v })} /><Input label="Lng" value={poi.lng} onChange={(v) => setPoi({ ...poi, lng: v })} /></FormGrid>
        <Textarea label="Note" value={poi.notes} onChange={(v) => setPoi({ ...poi, notes: v })} />
        <button disabled={!poi.name || busy === "zone_poi"} onClick={() => save("zone_poi", poi, "POI salvat")} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white disabled:opacity-50">Salveaza POI</button>
        <Grid>{(platform.zone_poi || []).map((x: any) => <ActionCard key={x.id} title={`${x.zone} - ${x.name}`} meta={`${x.category} - ${x.minutes} min`} value={`${x.score}/100`} action={<button onClick={() => save("zone_poi", { id: x.id, action: "delete" }, "POI sters")} className="rounded-lg border px-3 py-1 text-xs font-black text-rose-600">Sterge</button>} />)}</Grid>
      </Panel>}

      {tab === "recomandari" && <Grid>{(platform.client_profiles || []).slice(0, 12).map((profile: any) => { const match = (admin.properties || []).filter((p: any) => p.status === "PUBLISHED").map((p: any) => ({ p, ...scoreProperty(p, { budget: profile.budget || 250000, area: profile.preferred_zones?.[0] || "orice", rooms: profile.rooms || 2, purpose: profile.purpose || "locuire" }) })).sort((a: any, b: any) => b.score - a.score)[0]; return <ActionCard key={profile.id} title={profile.full_name || profile.email} meta={match?.p?.title || "fara potrivire"} value={`${match?.score || 0}/100`} /> })}</Grid>}

      {tab === "rapoarte" && can("reports") && <Panel title="Raportare avansata"><Grid><Metric label="Portofoliu" value={`EUR ${report.portfolio.toLocaleString("ro-RO")}`} /><Metric label="Conversie oferte" value={`${report.conversion}%`} /><Metric label="Documente blocate" value={report.blockedDocs} /><Metric label="Sloturi libere" value={report.slots} /></Grid><button onClick={() => downloadCsv("business-report.csv", [{ ...report, generated_at: new Date().toISOString() }, ...filteredLeads, ...filteredOffers])} className="mt-4 rounded-lg border px-4 py-2 text-sm font-black">Export raport CSV</button></Panel>}

      {tab === "notificari" && can("notifications") && <Panel title="Notificari si outbox email">
        <FormGrid><Input label="User ID" value={notice.user_id} onChange={(v) => setNotice({ ...notice, user_id: v })} /><Input label="Email target" value={notice.target} onChange={(v) => setNotice({ ...notice, target: v })} /><Input label="Titlu" value={notice.title} onChange={(v) => setNotice({ ...notice, title: v })} /><Input label="Due at" type="datetime-local" value={notice.due_at} onChange={(v) => setNotice({ ...notice, due_at: v })} /></FormGrid>
        <Textarea label="Mesaj" value={notice.body} onChange={(v) => setNotice({ ...notice, body: v })} />
        <button disabled={(!notice.user_id && !notice.target) || busy === "client_notification"} onClick={() => save("client_notification", notice, "Notificare programata")} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white disabled:opacity-50">Programeaza</button>
        <Grid>{(platform.client_notifications || []).map((x: any) => <ActionCard key={x.id} title={x.title} meta={x.body || x.user_id} value={x.status} />)}{(platform.admin_notification_outbox || []).map((x: any) => <ActionCard key={x.id} title={x.subject} meta={`${x.channel} - ${x.target || "fara target"}`} value={x.status} />)}</Grid>
      </Panel>}

      {tab === "roluri" && can("roles") && <Panel title="Roluri si permisiuni reale">
        <FormGrid><Input label="Email / user" value={role.email} onChange={(v) => setRole({ ...role, email: v })} /><Select label="Rol" value={role.role} options={["admin", "manager", "agent"]} onChange={(v) => setRole({ ...role, role: v })} /><Input label="Permisiuni CSV" value={role.permissions} onChange={(v) => setRole({ ...role, permissions: v })} /><Select label="Status" value={role.status} options={["ACTIVE", "PAUSED"]} onChange={(v) => setRole({ ...role, status: v })} /></FormGrid>
        <button onClick={() => save("admin_role", { ...role, permissions: role.permissions.split(",").map((x) => x.trim()).filter(Boolean) }, "Rol salvat")} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-black text-white">Salveaza rol</button>
        <Grid>{(platform.admin_roles || []).map((x: any) => <ActionCard key={x.id || x.email} title={x.email} meta={permissionList(x).join(", ")} value={x.role} />)}</Grid>
      </Panel>}

      {tab === "audit" && can("audit") && <Grid>{(platform.admin_audit_log || []).map((x: any) => <ActionCard key={x.id} title={x.action} meta={`${x.actor || "admin"} - ${x.entity || "platform"}`} value={new Date(x.created_at).toLocaleString("ro-RO")} />)}</Grid>}
    </section>
  )
}

function Column({ stage, leads, update }: { stage: string; leads: any[]; update: (id: string, status: string) => void }) {
  const rows = leads.filter((x) => x.status === stage || (stage === "NEGOTIATION" && x.status === "QUALIFIED"))
  return <div className="rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><b>{stage}</b><p className="text-xs text-slate-500">{rows.length} lead-uri</p>{rows.slice(0, 6).map((x) => <ActionCard key={x.id} title={x.name} meta={x.email || x.phone || x.source || "fara contact"} value={x.status} action={<Select value={x.status} options={stages} onChange={(status) => update(x.id, status)} />} />)}</div>
}

function permissionList(value: any) {
  const raw = value?.permissions
  if (Array.isArray(raw)) return raw
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : raw.split(",").map((x) => x.trim()).filter(Boolean)
    } catch {
      return raw.split(",").map((x) => x.trim()).filter(Boolean)
    }
  }
  return []
}

function rowSearch(rows: any[], query: string) {
  const q = query.trim().toLowerCase()
  return q ? rows.filter((row) => Object.values(row || {}).join(" ").toLowerCase().includes(q)) : rows
}

function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-bg-surface dark:bg-bg-card"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</div> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-bg-surface dark:bg-bg-card"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div> }
function ActionCard({ title, meta, value, action }: { title: string; meta: string; value: string | number; action?: React.ReactNode }) { return <div className="my-2 rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><div className="flex items-start justify-between gap-3"><div><b>{title}</b><p className="text-sm text-slate-500">{meta}</p><p className="mt-2 font-black text-accent">{value}</p></div>{action && <div className="shrink-0 text-right">{action}</div>}</div></div> }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase dark:border-bg-surface">{children}</span> }
function FormGrid({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div> }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><input type={type} className="form-input" value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><textarea className="form-input min-h-24" value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function Select({ label, value, options, onChange }: { label?: string; value: string; options: string[]; onChange: (value: string) => void }) { const control = <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black dark:border-bg-surface dark:bg-bg-secondary">{options.map((option) => <option key={option}>{option}</option>)}</select>; return label ? <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span>{control}</label> : control }
function downloadCsv(filename: string, rows: any[]) { const keys = Array.from(rows.reduce<Set<string>>((s, r) => { Object.keys(r || {}).forEach((k) => s.add(k)); return s }, new Set<string>())); const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => JSON.stringify(r?.[k] ?? "")).join(","))].join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }
