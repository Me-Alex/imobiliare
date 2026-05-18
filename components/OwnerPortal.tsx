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
}

export default function OwnerPortal() {
  const [token, setToken] = useState("")
  const [data, setData] = useState<OwnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Proprietati" value={data?.properties.length || 0} />
          <Metric label="Rapoarte" value={data?.reports.length || 0} />
          <Metric label="Documente" value={data?.documents.length || 0} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <Panel title="Proprietati administrate">
            {(data?.properties || []).length ? data?.properties.map((property) => <div key={property.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{property.title}</p><p className="mt-1 text-sm text-text-muted">{property.city || property.zone || "-"} · {money(property.price || 0, property.currency || "EUR")} · {property.status || "DRAFT"}</p></div>) : <Empty text="Nu exista proprietati asociate acestui email." />}
          </Panel>
          <Panel title="Rapoarte proprietar">
            {(data?.reports || []).length ? data?.reports.map((report) => <div key={report.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{report.title}</p><p className="mt-1 text-sm text-text-muted">{report.summary || "Fara sumar."}</p><p className="mt-2 text-xs font-black uppercase text-accent">{report.status} · {date(report.created_at)}</p></div>) : <Empty text="Nu exista rapoarte publicate." />}
          </Panel>
        </div>

        <Panel title="Documente si mandate">
          {(data?.documents || []).length ? data?.documents.map((doc) => <div key={doc.id} className="border-t border-bg-surface py-4 first:border-t-0 first:pt-0"><p className="font-black text-text-primary">{doc.title}</p><p className="mt-1 text-sm text-text-muted">{doc.status || "DRAFT"} · {doc.docusign_envelope_id || doc.file_url || "document privat"}</p></div>) : <Empty text="Nu exista documente asociate." />}
        </Panel>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card"><p className="text-xs font-black uppercase text-text-muted">{label}</p><p className="mt-2 text-3xl font-black text-text-primary">{value}</p></div>
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card"><h2 className="text-lg font-black text-text-primary">{title}</h2><div className="mt-4">{children}</div></div>
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-bg-surface bg-bg-secondary p-4 text-sm text-text-muted">{text}</p>
}

