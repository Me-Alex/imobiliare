"use client"

import { useEffect, useState } from "react"

async function api(path: string) {
  const res = await fetch(path, { credentials: "same-origin" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Cererea a esuat")
  return body
}

export default function AdminExecutiveReports() {
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState("")

  async function load() {
    setError("")
    try {
      const body = await api("/api/admin/reports")
      setReport(body.report || null)
    } catch (err: any) {
      setError(err.message || "Raportul nu a putut fi incarcat")
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
  if (!report) return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-bg-surface dark:bg-bg-card">Se incarca raportul executiv...</div>

  const summary = report.summary || {}
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between dark:border-bg-surface">
        <div>
          <h2 className="text-2xl font-black">Executive business report</h2>
          <p className="text-sm text-slate-500">Portofoliu, funnel, oferte, documente blocate, capacitate calendar si riscuri.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadServerExport()} className="rounded-lg border px-4 py-2 text-sm font-black">Export CSV</button>
          <button onClick={() => downloadJson("hqs-executive-report.json", report)} className="rounded-lg border px-4 py-2 text-sm font-black">Export JSON</button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Lead-uri active" value={summary.activeLeads || 0} />
        <Metric label="Clienti" value={summary.clients || 0} />
        <Metric label="Portofoliu" value={`EUR ${Number(summary.portfolioValue || 0).toLocaleString("ro-RO")}`} />
        <Metric label="Conversie" value={`${summary.conversionRate || 0}%`} />
        <Metric label="Sloturi libere" value={summary.availableSlots || 0} />
        <Metric label="Documente blocate" value={summary.blockedDocuments || 0} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Actiuni recomandate">
          {(report.nextActions || []).length ? report.nextActions.map((item: any) => <Row key={`${item.area}-${item.target}`} title={item.title} meta={`${item.area} - ${item.priority}`} />) : <Empty text="Nu exista actiuni urgente." />}
        </Panel>
        <Panel title="Riscuri operationale">
          {(report.risks || []).length ? report.risks.map((risk: string) => <Row key={risk} title={risk} meta="necesita urmarire" />) : <Empty text="Nu exista riscuri majore in datele curente." />}
        </Panel>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Breakdown title="Funnel CRM" data={report.funnel || {}} />
        <Breakdown title="Surse lead" data={report.sourceMix || {}} />
        <Breakdown title="Oferte" data={report.offerFlow || {}} />
        <Breakdown title="Documente" data={report.documentFlow || {}} />
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-bg-surface dark:bg-bg-card"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-bg-surface dark:bg-bg-card"><h3 className="mb-3 font-black">{title}</h3>{children}</div>
}

function Row({ title, meta }: { title: string; meta: string }) {
  return <div className="mb-2 rounded-lg border border-slate-200 p-3 dark:border-bg-surface"><p className="font-black">{title}</p><p className="text-sm text-slate-500">{meta}</p></div>
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const rows = Object.entries(data)
  return <Panel title={title}>{rows.length ? rows.map(([key, value]) => <div key={key} className="flex justify-between gap-3 py-1 text-sm"><span className="text-slate-500">{key}</span><b>{value}</b></div>) : <Empty text="Fara date." />}</Panel>
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>
}

function downloadJson(filename: string, data: any) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data || {}, null, 2)], { type: "application/json" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadServerExport() {
  const res = await fetch("/api/admin/export?format=csv", { credentials: "same-origin" })
  if (!res.ok) return
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `hqs-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
