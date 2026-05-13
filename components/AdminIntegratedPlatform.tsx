"use client"

import { useEffect, useMemo, useState } from "react"
import { buildViewingSlots } from "@/lib/complexity"
import { scoreProperty } from "@/lib/experience"

type Lead = { id: string; name: string; phone?: string | null; email?: string | null; message?: string | null; status: string; source?: string | null }
type Property = { id: string; title: string; city: string; status: string; price: number; rooms: number; area_sqm: number; featured?: boolean }
type Appointment = { id: string; client_name: string; client_phone?: string | null; client_email?: string | null; requested_at: string; status?: string | null; property_title?: string | null }
type AdminData = { leads: Lead[]; properties: Property[]; appointments: Appointment[] }
type PlatformData = {
  client_profiles?: any[]
  client_favorites?: any[]
  client_documents?: any[]
  property_offers?: any[]
  cms_entries?: any[]
  zone_poi?: any[]
  admin_roles?: any[]
  lead_history?: any[]
}

const tabs = ["Dashboard", "CRM", "Clienti", "CMS", "Programari", "Oferte", "Documente", "Zone", "Recomandari", "Rapoarte", "Roluri"] as const
const stages = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "CLOSED"]
const money = (value: number) => `EUR ${Number(value || 0).toLocaleString("ro-RO")}`

async function requestJson(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}

export default function AdminIntegratedPlatform() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Dashboard")
  const [admin, setAdmin] = useState<AdminData>({ leads: [], properties: [], appointments: [] })
  const [platform, setPlatform] = useState<PlatformData>({})
  const [error, setError] = useState("")
  const [saving, setSaving] = useState("")
  const [cms, setCms] = useState({ key: "home.hero", title: "Homepage hero", section: "home", headline: "", body: "", seo_title: "", seo_description: "" })
  const [crm, setCrm] = useState({ lead_id: "", status: "FOLLOW_UP", assigned_to: "agent@hqsimobiliare.ro", note: "", budget: "250000" })
  const [role, setRole] = useState({ email: "", role: "agent", permissions: "leads,appointments,documents" })
  const [counter, setCounter] = useState<Record<string, string>>({})

  async function load() {
    setError("")
    try {
      const [adminData, platformData] = await Promise.all([requestJson("/api/admin/data"), requestJson("/api/admin/platform")])
      setAdmin({ leads: adminData.leads || [], properties: adminData.properties || [], appointments: adminData.appointments || [] })
      setPlatform(platformData || {})
      const entry = (platformData.cms_entries || []).find((item: any) => item.key === "home.hero") || platformData.cms_entries?.[0]
      if (entry) setCms({
        key: entry.key || "home.hero",
        title: entry.title || "Homepage hero",
        section: entry.section || "home",
        headline: entry.content?.headline || "",
        body: entry.content?.body || "",
        seo_title: entry.seo?.title || entry.title || "",
        seo_description: entry.seo?.description || "",
      })
    } catch (err: any) {
      setError(err.message || "Nu am putut incarca platforma.")
    }
  }

  useEffect(() => { load() }, [])

  const report = useMemo(() => {
    const offers = platform.property_offers || []
    const accepted = offers.filter((offer) => ["ACCEPTED", "CLOSED"].includes(offer.status)).length
    const live = admin.properties.filter((property) => property.status === "PUBLISHED")
    return {
      clients: platform.client_profiles?.length || 0,
      favorites: platform.client_favorites?.length || 0,
      offers: offers.length,
      conversion: offers.length ? Math.round((accepted / offers.length) * 100) : 0,
      documents: (platform.client_documents || []).filter((doc) => !["APPROVED", "SIGNED"].includes(doc.status)).length,
      active: live.length,
      portfolio: live.reduce((sum, property) => sum + Number(property.price || 0), 0),
      sources: countBy(admin.leads, (lead) => lead.source || "website"),
      agents: countBy(platform.lead_history || [], (item) => item.assigned_to || "neatribuit"),
    }
  }, [admin, platform])

  const recommendations = useMemo(() => (platform.client_profiles || []).slice(0, 6).map((client) => {
    const profile = {
      budget: Number(client.budget || 250000),
      area: Array.isArray(client.preferred_zones) && client.preferred_zones[0] ? client.preferred_zones[0] : "orice",
      rooms: Number(client.rooms || 2),
      purpose: client.purpose || "locuire",
    }
    const matches = admin.properties.filter((property) => property.status === "PUBLISHED")
      .map((property) => ({ property, ...scoreProperty(property as any, profile as any) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
    return { client, matches }
  }), [admin.properties, platform.client_profiles])

  async function save(type: string, payload: Record<string, any>) {
    setSaving(type)
    try {
      await requestJson("/api/admin/platform", { method: "POST", body: JSON.stringify({ type, ...payload }) })
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving("")
    }
  }

  async function saveCrm() {
    setSaving("crm")
    try {
      await requestJson("/api/admin/crm", { method: "POST", body: JSON.stringify({ ...crm, budget: Number(crm.budget) }) })
      setCrm({ ...crm, note: "" })
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving("")
    }
  }

  async function updateAppointment(id: string, status: string) {
    setSaving(id)
    try {
      await requestJson(`/api/admin/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving("")
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between dark:border-bg-surface">
        <div>
          <h1 className="text-3xl font-black">Platforma 360</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted">Operatiuni reale pentru conturi client, CRM, CMS, programari, oferte, documente, zone, recomandari, rapoarte si roluri.</p>
        </div>
        <button onClick={load} className="rounded-lg bg-accent px-4 py-2 text-sm font-black text-white">Refresh live</button>
      </header>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-black ${tab === item ? "border-accent bg-accent text-white" : "border-slate-200 bg-white text-slate-600 dark:border-bg-surface dark:bg-bg-card dark:text-text-muted"}`}>{item}</button>)}
      </nav>

      {tab === "Dashboard" && <Grid>
        <Metric label="Clienti reali" value={report.clients} />
        <Metric label="Favorite Supabase" value={report.favorites} />
        <Metric label="Conversie oferte" value={`${report.conversion}%`} />
        <Metric label="Documente pending" value={report.documents} />
        <Metric label="Portofoliu activ" value={money(report.portfolio)} />
      </Grid>}

      {tab === "CRM" && <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Panel title="Pipeline Kanban">
          <div className="grid gap-3 xl:grid-cols-5">{stages.map((stage) => <Column key={stage} stage={stage} leads={admin.leads} />)}</div>
        </Panel>
        <Panel title="Follow-up, scor si note interne">
          <Select value={crm.lead_id} onChange={(value) => setCrm({ ...crm, lead_id: value })} options={["", ...admin.leads.map((lead) => lead.id)]} />
          <Input label="Status" value={crm.status} onChange={(value) => setCrm({ ...crm, status: value })} />
          <Input label="Agent" value={crm.assigned_to} onChange={(value) => setCrm({ ...crm, assigned_to: value })} />
          <Input label="Buget" value={crm.budget} onChange={(value) => setCrm({ ...crm, budget: value })} />
          <Textarea label="Nota" value={crm.note} onChange={(value) => setCrm({ ...crm, note: value })} />
          <button onClick={saveCrm} disabled={saving === "crm"} className="mt-3 rounded-lg bg-accent px-4 py-3 text-sm font-black text-white disabled:opacity-50">Salveaza follow-up</button>
        </Panel>
      </div>}

      {tab === "Clienti" && <Grid>{(platform.client_profiles || []).map((client) => <Panel key={client.id} title={client.full_name || client.email || "Client"}>
        <Mini title="Buget" meta={client.financing_status || "finantare"} value={money(client.budget)} />
        <Mini title="Zone" meta={(client.preferred_zones || []).join(", ") || "orice"} value={`${client.rooms || 2} camere`} />
        <Mini title="Favorite" meta="salvate in Supabase" value={(platform.client_favorites || []).filter((fav) => fav.user_id === client.user_id).length} />
      </Panel>)}</Grid>}

      {tab === "CMS" && <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Panel title="Editor continut si SEO">
          {(["key", "title", "section", "headline", "seo_title"] as const).map((key) => <Input key={key} label={key} value={cms[key]} onChange={(value) => setCms({ ...cms, [key]: value })} />)}
          <Textarea label="Text pagina" value={cms.body} onChange={(value) => setCms({ ...cms, body: value })} />
          <Textarea label="SEO description" value={cms.seo_description} onChange={(value) => setCms({ ...cms, seo_description: value })} />
          <button onClick={() => save("cms", { payload: { key: cms.key, title: cms.title, section: cms.section, content: { headline: cms.headline, body: cms.body }, seo: { title: cms.seo_title, description: cms.seo_description } } })} className="mt-3 rounded-lg bg-accent px-4 py-3 text-sm font-black text-white">Publica</button>
        </Panel>
        <Panel title="Intrari CMS">{(platform.cms_entries || []).map((entry) => <Mini key={entry.id || entry.key} title={entry.key} meta={entry.section || entry.title} value={entry.updated_at ? new Date(entry.updated_at).toLocaleDateString("ro-RO") : "activ"} />)}</Panel>
      </div>}

      {tab === "Programari" && <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Calendar vizionari">{admin.appointments.map((item) => <Row key={item.id} title={item.client_name} meta={`${item.property_title || "Proprietate"} - ${new Date(item.requested_at).toLocaleString("ro-RO")}`} value={item.status || "REQUESTED"} actions={["REQUESTED", "CONFIRMED", "DONE", "CANCELLED"].map((status) => <SmallButton key={status} onClick={() => updateAppointment(item.id, status)}>{status}</SmallButton>)} />)}</Panel>
        <Panel title="Sloturi recomandate">{buildViewingSlots("normal").map((slot) => <Mini key={slot.iso} title={slot.label} meta="scor disponibilitate" value={`${slot.score}/100`} />)}</Panel>
      </div>}

      {tab === "Oferte" && <Stack>{(platform.property_offers || []).map((offer) => <Panel key={offer.id} title={offer.property_title || "Oferta"}>
        <Mini title={offer.client_name || offer.client_email || "Client"} meta={offer.status} value={money(offer.offer_price)} />
        <Input label="Contraoferta" value={counter[offer.id] || ""} onChange={(value) => setCounter({ ...counter, [offer.id]: value })} />
        {["NEGOTIATION", "ACCEPTED", "REJECTED", "CLOSED"].map((status) => <SmallButton key={status} onClick={() => save("offer_status", { id: offer.id, status, counter_offer: counter[offer.id] || null })}>{status}</SmallButton>)}
      </Panel>)}</Stack>}

      {tab === "Documente" && <Grid>{(platform.client_documents || []).map((doc) => <Panel key={doc.id} title={doc.title}>
        <Mini title={doc.type || "Document"} meta={doc.expires_at ? `expira ${new Date(doc.expires_at).toLocaleDateString("ro-RO")}` : "fara expirare"} value={doc.status} />
        {["PENDING", "REVIEW", "APPROVED", "EXPIRED"].map((status) => <SmallButton key={status} onClick={() => save("document_status", { id: doc.id, status })}>{status}</SmallButton>)}
      </Panel>)}</Grid>}

      {tab === "Zone" && <Grid>{(platform.zone_poi || []).map((poi) => <Panel key={poi.id} title={`${poi.zone} - ${poi.name}`}>
        <Mini title="Categorie" meta="punct de interes" value={poi.category} />
        <Mini title="Timp estimat" meta="minute" value={`${poi.minutes || 0} min`} />
        <Mini title="Scor zona" meta="calitate locatie" value={`${poi.score || 0}/100`} />
      </Panel>)}</Grid>}

      {tab === "Recomandari" && <Stack>{recommendations.map(({ client, matches }) => <Panel key={client.id} title={`Recomandari pentru ${client.full_name || client.email}`}>
        <Grid>{matches.map((match) => <Mini key={match.property.id} title={match.property.title} meta={match.reasons.join(", ") || match.property.city} value={`${match.score}/100`} />)}</Grid>
      </Panel>)}</Stack>}

      {tab === "Rapoarte" && <Grid>
        <Panel title="Surse lead">{Object.entries(report.sources).map(([key, value]) => <Mini key={key} title={key} meta="lead-uri captate" value={value} />)}</Panel>
        <Panel title="Performanta agenti">{Object.entries(report.agents).map(([key, value]) => <Mini key={key} title={key} meta="follow-up-uri" value={value} />)}</Panel>
        <Panel title="Business"><Mini title="Portofoliu" meta={`${report.active} proprietati active`} value={money(report.portfolio)} /><Mini title="Conversie" meta={`${report.offers} oferte`} value={`${report.conversion}%`} /></Panel>
      </Grid>}

      {tab === "Roluri" && <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Panel title="Rol admin">
          <Input label="Email" value={role.email} onChange={(value) => setRole({ ...role, email: value })} />
          <Select value={role.role} onChange={(value) => setRole({ ...role, role: value })} options={["admin", "manager", "agent"]} />
          <Textarea label="Permisiuni" value={role.permissions} onChange={(value) => setRole({ ...role, permissions: value })} />
          <button disabled={!role.email} onClick={() => save("admin_role", { payload: { ...role, permissions: role.permissions.split(",").map((item) => item.trim()).filter(Boolean) } })} className="mt-3 rounded-lg bg-accent px-4 py-3 text-sm font-black text-white disabled:opacity-50">Salveaza rol</button>
        </Panel>
        <Panel title="Roluri active">{(platform.admin_roles || []).map((item) => <Mini key={item.id || item.email} title={item.email} meta={(item.permissions || []).join(", ")} value={item.role} />)}</Panel>
      </div>}
    </section>
  )
}

function countBy<T>(rows: T[], picker: (item: T) => string) {
  return rows.reduce<Record<string, number>>((acc, item) => {
    const key = picker(item)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function Column({ stage, leads }: { stage: string; leads: Lead[] }) {
  const rows = leads.filter((lead) => lead.status === stage || (stage === "NEGOTIATION" && lead.status === "QUALIFIED"))
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-bg-surface dark:bg-bg-secondary"><b>{stage}</b><p className="text-xs text-slate-500">{rows.length} lead-uri</p>{rows.slice(0, 5).map((lead) => <Mini key={lead.id} title={lead.name} meta={lead.phone || lead.email || lead.source || "fara contact"} value={lead.status} />)}</div>
}

function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div> }
function Stack({ children }: { children: React.ReactNode }) { return <div className="grid gap-4">{children}</div> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-bg-surface dark:bg-bg-card"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-bg-surface dark:bg-bg-card"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</div> }
function Mini({ title, meta, value }: { title: string; meta: string; value: string | number }) { return <div className="my-2 rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><b>{title}</b><p className="text-sm text-slate-500">{meta}</p><p className="mt-2 font-black text-accent">{value}</p></div> }
function Row({ title, meta, value, actions }: { title: string; meta: string; value: string; actions: React.ReactNode }) { return <div className="mb-3 rounded-lg border border-slate-200 p-4 dark:border-bg-surface"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><b>{title}</b><p className="text-sm text-slate-500">{meta}</p><p className="text-xs font-black text-accent">{value}</p></div><div className="flex flex-wrap gap-2">{actions}</div></div></div> }
function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button onClick={onClick} className="mr-2 mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black dark:border-bg-surface">{children}</button> }
function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><input className="form-input" value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><textarea className="form-input min-h-24" value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) { return <select className="form-input mt-3" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((item) => <option key={item || "empty"} value={item}>{item || "General"}</option>)}</select> }
