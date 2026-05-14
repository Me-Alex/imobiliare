"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"

type PlatformData = Record<string, any[]>

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}

export default function AdminPlatformConsole() {
  const [data, setData] = useState<PlatformData>({})
  const [error, setError] = useState("")
  const [saving, setSaving] = useState("")
  const [cms, setCms] = useState({ key: "home.hero", title: "Homepage hero", section: "home", headline: "Imobiliare clare", body: "Text editabil din CMS." })

  async function load() {
    setError("")
    try { setData(await api("/api/admin/platform")) } catch (err: any) { setError(err.message || "Nu am putut incarca platforma.") }
  }
  useEffect(() => { load() }, [])

  const reports = useMemo(() => {
    const offers = data.property_offers || []
    const clients = data.client_profiles || []
    const docs = data.client_documents || []
    const accepted = offers.filter((o) => ["ACCEPTED", "CLOSED"].includes(o.status)).length
    return {
      clients: clients.length,
      offers: offers.length,
      conversion: offers.length ? Math.round((accepted / offers.length) * 100) : 0,
      docsPending: docs.filter((d) => d.status !== "APPROVED").length,
    }
  }, [data])

  async function updateOffer(id: string, status: string) {
    setSaving(id)
    try { await api("/api/admin/platform", { method: "POST", body: JSON.stringify({ type: "offer_status", id, status }) }); await load() } catch (err: any) { setError(err.message) } finally { setSaving("") }
  }

  async function saveCms() {
    setSaving("cms")
    try {
      await api("/api/admin/platform", {
        method: "POST",
        body: JSON.stringify({
          type: "cms",
          payload: { key: cms.key, title: cms.title, section: cms.section, content: { headline: cms.headline, body: cms.body }, seo: { title: cms.title, description: cms.body } },
        }),
      })
      await load()
    } catch (err: any) { setError(err.message) } finally { setSaving("") }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-bg-primary dark:text-text-primary">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-bg-surface dark:bg-bg-card/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div><h1 className="text-2xl font-black">HQS Platform Console</h1><p className="text-sm text-slate-500">Clienti, oferte, CMS, documente, harti, rapoarte si roluri.</p></div>
          <div className="flex gap-2"><ThemeToggle /><button onClick={load} className="rounded-lg border px-3 py-2 text-sm font-bold">Refresh</button><Link href="/admin/dashboard" className="rounded-lg border px-3 py-2 text-sm font-bold">Admin</Link></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Clienti reali" value={reports.clients} />
          <Metric label="Oferte" value={reports.offers} />
          <Metric label="Conversie oferte" value={`${reports.conversion}%`} />
          <Metric label="Documente pending" value={reports.docsPending} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Panel title="Oferte si negociere">
            <div className="grid gap-3">
              {(data.property_offers || []).map((offer) => (
                <div key={offer.id} className="rounded-lg border border-slate-200 p-4 dark:border-bg-surface">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div><b>{offer.property_title}</b><p className="text-sm text-slate-500">{offer.client_email || offer.client_name} - EUR {Number(offer.offer_price).toLocaleString("ro-RO")}</p></div>
                    <div className="flex gap-2">
                      {["NEGOTIATION", "ACCEPTED", "REJECTED"].map((status) => <button key={status} disabled={saving === offer.id} onClick={() => updateOffer(offer.id, status)} className="rounded-lg border px-3 py-1 text-xs font-black">{status}</button>)}
                    </div>
                  </div>
                </div>
              ))}
              {!(data.property_offers || []).length && <p className="text-sm text-slate-500">Nu exista oferte inca.</p>}
            </div>
          </Panel>
          <Panel title="CMS real">
            <div className="grid gap-3">
              <Input label="Key" value={cms.key} setValue={(v: string) => setCms({ ...cms, key: v })} />
              <Input label="Titlu" value={cms.title} setValue={(v: string) => setCms({ ...cms, title: v })} />
              <Input label="Sectiune" value={cms.section} setValue={(v: string) => setCms({ ...cms, section: v })} />
              <Input label="Headline" value={cms.headline} setValue={(v: string) => setCms({ ...cms, headline: v })} />
              <label><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Body</span><textarea className="form-input min-h-24" value={cms.body} onChange={(e) => setCms({ ...cms, body: e.target.value })} /></label>
              <button onClick={saveCms} disabled={saving === "cms"} className="rounded-lg bg-accent px-4 py-3 text-sm font-black text-white disabled:opacity-50">Salveaza CMS</button>
            </div>
          </Panel>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Clienti si conturi">{(data.client_profiles || []).map((row) => <Mini key={row.id} title={row.full_name} meta={row.email || row.phone || "fara contact"} value={`EUR ${Number(row.budget).toLocaleString("ro-RO")}`} />)}</Panel>
          <Panel title="Documente client">{(data.client_documents || []).map((row) => <Mini key={row.id} title={row.title} meta={row.type} value={row.status} />)}</Panel>
          <Panel title="Roluri admin">{(data.admin_roles || []).map((row) => <Mini key={row.id} title={row.email} meta={JSON.stringify(row.permissions)} value={row.role} />)}</Panel>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Harti si POI">{(data.zone_poi || []).map((row) => <Mini key={row.id} title={`${row.zone} - ${row.name}`} meta={`${row.category}, ${row.minutes} min`} value={`${row.score}/100`} />)}</Panel>
          <Panel title="Istoric CRM">{(data.lead_history || []).map((row) => <Mini key={row.id} title={row.status} meta={row.note || row.assigned_to || "fara nota"} value={`${row.score}/100`} />)}</Panel>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-bg-surface dark:bg-bg-card"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}

function Panel({ title, children }: { title: string; children: any }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-bg-surface dark:bg-bg-card"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</div>
}

function Mini({ title, meta, value }: { title: string; meta: string; value: string }) {
  return <div className="mb-3 flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 text-sm dark:border-bg-surface"><div><b>{title}</b><p className="text-slate-500">{meta}</p></div><b className="text-accent">{value}</b></div>
}

function Input({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><input className="form-input" value={value} onChange={(event) => setValue(event.target.value)} /></label>
}
