"use client"

import { useEffect, useState, type ReactNode } from "react"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import { supabase } from "@/lib/supabase"
import { date, money, type Row } from "@/components/admin/admin-shared"

type OwnerData = {
  owner: { email: string }
  properties: Row[]
  reports: Row[]
  documents: Row[]
  feedback: Row[]
  leads: Row[]
  appointments: Row[]
  offers: Row[]
  attribution: Row[]
  property_metrics: Row[]
  totals: Row
}

export default function OwnerPortal() {
  const [token, setToken] = useState("")
  const [data, setData] = useState<OwnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [feedbackBusy, setFeedbackBusy] = useState(false)
  const [feedbackNotice, setFeedbackNotice] = useState("")
  const [feedbackForm, setFeedbackForm] = useState<Row>({ property_id: "", rating: 5, category: "GENERAL", message: "" })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || ""
      setToken(accessToken)
      if (accessToken) void load(accessToken)
      else setLoading(false)
    })
  }, [])

  async function load(accessToken: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/owner/dashboard", { headers: { Authorization: `Bearer ${accessToken}` } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Portalul proprietar nu s-a incarcat.")
      setData(body)
    } catch (err: any) {
      setError(err?.message || "Portalul proprietar nu s-a incarcat.")
    } finally {
      setLoading(false)
    }
  }

  async function submitFeedback() {
    const propertyId = feedbackForm.property_id || data?.properties?.[0]?.id || ""
    if (!propertyId || !feedbackForm.message) return
    setFeedbackBusy(true)
    setError("")
    setFeedbackNotice("")
    try {
      const res = await fetch("/api/owner/feedback", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...feedbackForm, property_id: propertyId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Feedback-ul nu a fost salvat.")
      setFeedbackNotice("Feedback trimis catre echipa HQS.")
      setFeedbackForm({ property_id: propertyId, rating: 5, category: "GENERAL", message: "" })
      await load(token)
    } catch (err: any) {
      setError(err?.message || "Feedback-ul nu a fost salvat.")
    } finally {
      setFeedbackBusy(false)
    }
  }

  if (!token) return <PortalAuthGateway redirectTo="/owner" onAuthenticated={(accessToken) => { setToken(accessToken); void load(accessToken) }} />
  if (loading) return <section className="px-4 py-16"><div className="mx-auto max-w-7xl rounded-lg border border-bg-surface bg-bg-card p-8 font-black">Se incarca portalul proprietar...</div></section>

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-bg-surface bg-bg-card p-6 shadow-card md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-accent">Owner portal</p>
            <h1 className="mt-2 text-3xl font-black text-text-primary md:text-5xl">Rapoarte si proprietati pentru proprietar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-muted">Datele sunt filtrate dupa emailul autentificat: {data?.owner.email || "-"}.</p>
          </div>
          <button className="rounded-lg border border-bg-surface px-4 py-3 text-sm font-black" type="button" onClick={() => supabase.auth.signOut().then(() => { setToken(""); setData(null) })}>Logout</button>
        </div>

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-500">{error}</div>}
        {feedbackNotice && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600">{feedbackNotice}</div>}

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Proprietati" value={data?.totals?.properties || data?.properties.length || 0} />
          <Metric label="Lead-uri" value={data?.totals?.leads || 0} />
          <Metric label="Vizionari" value={data?.totals?.appointments || 0} />
          <Metric label="Oferte" value={data?.totals?.offers || 0} />
          <Metric label="Pipeline" value={money(data?.totals?.offer_pipeline || 0)} />
          <Metric label="Rapoarte" value={data?.reports.length || 0} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <Panel title="Proprietati administrate">
            {(data?.properties || []).length ? data?.properties.map((property) => {
              const metrics = data?.property_metrics?.find((item) => item.property_id === property.id)
              return (
                <div key={property.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0">
                  <p className="font-black text-text-primary">{property.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{property.city || property.zone || "-"} - {money(property.price || 0, property.currency || "EUR")} - {property.status || "DRAFT"}</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-black text-text-muted">
                    <span>{metrics?.leads || 0} lead-uri</span>
                    <span>{metrics?.tours || 0} vizionari</span>
                    <span>{metrics?.offers || 0} oferte</span>
                    <span>{money(metrics?.offer_pipeline || 0)}</span>
                  </div>
                </div>
              )
            }) : <Empty text="Nu exista proprietati asociate acestui email." />}
          </Panel>
          <Panel title="Rapoarte proprietar">
            {(data?.reports || []).length ? data?.reports.map((report) => <div key={report.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{report.title}</p><p className="mt-1 text-sm text-text-muted">{report.summary || "Fara sumar."}</p><p className="mt-2 text-xs font-black uppercase text-accent">{report.status} - {date(report.created_at)}</p></div>) : <Empty text="Nu exista rapoarte publicate." />}
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Lead-uri fara date personale">
            {(data?.leads || []).length ? data?.leads.slice(0, 8).map((lead) => <div key={lead.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{lead.status || "NEW"} - scor {lead.score || 0}</p><p className="mt-1 text-sm text-text-muted">{lead.source || "site"} - {date(lead.created_at)}</p></div>) : <Empty text="Nu exista lead-uri pentru proprietatile tale." />}
          </Panel>
          <Panel title="Vizionari">
            {(data?.appointments || []).length ? data?.appointments.slice(0, 8).map((appointment) => <div key={appointment.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{appointment.status || "REQUESTED"}</p><p className="mt-1 text-sm text-text-muted">{date(appointment.start_at || appointment.requested_at, true)} - {appointment.agent_email || "agent HQS"}</p></div>) : <Empty text="Nu exista vizionari programate." />}
          </Panel>
          <Panel title="Promovare si surse">
            {(data?.property_metrics || []).length ? data?.property_metrics.map((metric) => <div key={metric.property_id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{metric.title}</p><p className="mt-1 text-sm text-text-muted">{metric.attribution_events || 0} evenimente - {(metric.sources || []).join(", ") || "surse in lucru"}</p></div>) : <Empty text="Nu exista date de promovare inca." />}
          </Panel>
        </div>

        <Panel title="Documente si mandate">
          {(data?.documents || []).length ? data?.documents.map((doc) => <div key={doc.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{doc.title}</p><p className="mt-1 text-sm text-text-muted">{doc.status || "DRAFT"} - {doc.docusign_envelope_id || doc.file_url || "document privat"}</p></div>) : <Empty text="Nu exista documente asociate." />}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <Panel title="Feedback catre HQS">
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-text-muted">Proprietate<select className="mt-2 w-full rounded-lg border border-bg-surface bg-bg-secondary px-3 py-3 text-sm text-text-primary" value={feedbackForm.property_id || data?.properties?.[0]?.id || ""} onChange={(event) => setFeedbackForm({ ...feedbackForm, property_id: event.target.value })}>{(data?.properties || []).map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
              <label className="block text-xs font-black uppercase text-text-muted">Rating<select className="mt-2 w-full rounded-lg border border-bg-surface bg-bg-secondary px-3 py-3 text-sm text-text-primary" value={feedbackForm.rating || 5} onChange={(event) => setFeedbackForm({ ...feedbackForm, rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}</select></label>
              <label className="block text-xs font-black uppercase text-text-muted">Categorie<input className="mt-2 w-full rounded-lg border border-bg-surface bg-bg-secondary px-3 py-3 text-sm text-text-primary" value={feedbackForm.category || ""} onChange={(event) => setFeedbackForm({ ...feedbackForm, category: event.target.value })} /></label>
              <label className="block text-xs font-black uppercase text-text-muted">Mesaj<textarea className="mt-2 min-h-32 w-full rounded-lg border border-bg-surface bg-bg-secondary px-3 py-3 text-sm text-text-primary" value={feedbackForm.message || ""} onChange={(event) => setFeedbackForm({ ...feedbackForm, message: event.target.value })} /></label>
              <button className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary disabled:opacity-50" type="button" disabled={feedbackBusy || !feedbackForm.message || !(data?.properties || []).length} onClick={submitFeedback}>{feedbackBusy ? "Se trimite..." : "Trimite feedback"}</button>
            </div>
          </Panel>
          <Panel title="Feedback trimis">
            {(data?.feedback || []).length ? data?.feedback.map((item) => <div key={item.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{item.category || "GENERAL"} - {item.rating || 5}/5</p><p className="mt-1 text-sm text-text-muted">{item.message}</p><p className="mt-2 text-xs font-black uppercase text-accent">{item.status || "NEW"} - {date(item.created_at)}</p></div>) : <Empty text="Nu exista feedback trimis." />}
          </Panel>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card"><p className="text-xs font-black uppercase text-text-muted">{label}</p><p className="mt-2 text-2xl font-black text-text-primary">{value}</p></div>
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card"><h2 className="text-lg font-black text-text-primary">{title}</h2><div className="mt-4">{children}</div></div>
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-bg-surface bg-bg-secondary p-4 text-sm text-text-muted">{text}</p>
}
