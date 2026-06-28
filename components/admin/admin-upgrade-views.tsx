"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { supabase } from "@/lib/supabase"
import { apiJson, confirmRisk, countBy, date, money, statusLabel, type Row } from "./admin-shared"
import { ActionPanel, ModuleEditor } from "./admin-operations"
import { Badge, BarList, Button, Field, Grid, Kpis, MiniRow, Panel, Table, Td, Title } from "./admin-ui"

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value : []
}

export function MediaView({ filtered, platform, saving }: any) {
  const [propertyId, setPropertyId] = useState("")
  const [kind, setKind] = useState("gallery")
  const [alt, setAlt] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const media = rows(platform.property_media)

  const updateMedia = async (row: Row, patch: Row) => {
    await apiJson("/api/admin/media", { method: "PATCH", body: JSON.stringify({ ...row, ...patch }) })
    window.location.reload()
  }

  const deleteMedia = async (row: Row) => {
    if (!row.id || !confirmRisk(`Stergi media "${row.alt || row.path || row.id}"? Daca este cover, proprietatea poate ramane nepublicabila.`)) return
    await apiJson(`/api/admin/media?id=${row.id}`, { method: "DELETE" })
    window.location.reload()
  }

  const upload = async () => {
    if (!file || !propertyId) return
    setBusy(true)
    try {
      const signed = await apiJson<Row>("/api/admin/media/upload-url", { method: "POST", body: JSON.stringify({ property_id: propertyId, file_name: file.name, content_type: file.type, kind }) })
      const { error } = await supabase.storage.from(signed.bucket || "property-media").uploadToSignedUrl(signed.path, signed.token, file)
      if (error) throw error
      await apiJson("/api/admin/media", { method: "POST", body: JSON.stringify({ property_id: propertyId, path: signed.path, kind, alt }) })
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6"><Title title="Media si planuri" subtitle="Incarcare, imagine cover, metadate galerie si media publica pentru proprietati." /><Kpis cards={[["Media", media.length, "bucket property-media", "IMG"], ["Cover", media.filter((item) => item.kind === "cover").length, "imagini principale", "COV"], ["Planuri", media.filter((item) => item.kind === "floorplan").length, "planuri", "PLN"], ["Proprietati", filtered.properties.length, "disponibile", "P"]]} /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><Panel><Title compact title="Incarcare media" /><Grid columns={1}><Field label="property_id" value={propertyId} onChange={setPropertyId} /><Field label="kind" value={kind} onChange={setKind} /><Field label="alt" value={alt} onChange={setAlt} /></Grid><input className="mt-4 block w-full text-sm" type="file" accept="image/*,.pdf" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] || null)} /><Button className="mt-4 w-full" disabled={!file || !propertyId || busy} onClick={upload}>{busy ? "Se incarca..." : "Incarca media semnata"}</Button></Panel><Panel tight><Table heads={["Media", "Tip", "Proprietate", "Ordine", "Actiuni"]} rows={media} empty="Nu exista media." render={(row) => <tr key={row.id || row.path} className="border-t border-bg-surface"><Td><p className="font-black">{row.alt || row.path}</p><p className="max-w-md truncate text-xs text-text-muted">{row.public_url || row.path}</p></Td><Td><Badge>{row.kind}</Badge></Td><Td>{row.property_id}</Td><Td>{row.sort_order || 0}</Td><Td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => updateMedia(row, { kind: "cover", sort_order: 0 })}>Cover</Button><Button size="sm" variant="ghost" onClick={() => updateMedia(row, { sort_order: Number(row.sort_order || 0) - 1 })}>Sus</Button><Button size="sm" variant="ghost" onClick={() => updateMedia(row, { sort_order: Number(row.sort_order || 0) + 1 })}>Jos</Button><Button size="sm" variant="danger" onClick={() => deleteMedia(row)}>Sterge</Button></div></Td></tr>} /></Panel></div></div>
}

export function CalendarOpsView({ filtered }: any) {
  const [form, setForm] = useState<Row>({ appointment_id: "", summary: "Vizionare HQS", start: "", end: "", client_email: "", agent_email: "" })
  const [busy, setBusy] = useState(false)
  const sync = async () => {
    setBusy(true)
    try { await apiJson("/api/admin/calendar/sync", { method: "POST", body: JSON.stringify(form) }); window.location.reload() } finally { setBusy(false) }
  }
  return <div className="space-y-6"><Title title="Sincronizare calendar" subtitle="Creare evenimente Google Calendar pentru vizionari si disponibilitatea agentilor." /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><Panel><Title compact title="Sincronizeaza eveniment" /><Grid columns={1}>{["appointment_id", "summary", "start", "end", "client_email", "agent_email"].map((key) => <Field key={key} label={key} value={String(form[key] || "")} onChange={(value) => setForm({ ...form, [key]: value })} />)}</Grid><Button className="mt-4 w-full" disabled={busy || (!form.appointment_id && !form.start)} onClick={sync}>{busy ? "Se sincronizeaza..." : "Creeaza eveniment Google"}</Button></Panel><Panel tight><Table heads={["Client", "Data", "Status", "Agent"]} rows={filtered.appointments} empty="Nu exista programari." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td><p className="font-black">{row.client_name || row.client_email}</p><p className="text-xs text-text-muted">{row.property_title || row.id}</p></Td><Td>{date(row.requested_at || row.starts_at, true)}</Td><Td><Badge>{statusLabel(row.status || "REQUESTED")}</Badge></Td><Td>{row.agent_email || "-"}</Td></tr>} /></Panel></div></div>
}

export function AccountingView({ filtered, platform }: any) {
  const [invoice, setInvoice] = useState<Row>({ client_email: "", client_name: "", amount: 500, currency: "eur", description: "Servicii HQS Imobiliare", property_id: "" })
  const [busy, setBusy] = useState(false)
  const invoices = rows(platform.admin_invoices)
  const commissions = rows(platform.admin_commissions)
  const create = async () => { setBusy(true); try { await apiJson("/api/admin/stripe/invoices", { method: "POST", body: JSON.stringify(invoice) }); window.location.reload() } finally { setBusy(false) } }
  return <div className="space-y-6"><Title title="Contabilitate" subtitle="Facturi Stripe, urmarire comisioane, TVA si operatiuni de plata." /><Kpis cards={[["Facturi", invoices.length, "prin Stripe", "INV"], ["Valoare facturi", money(invoices.reduce((sum, row) => sum + Number(row.amount || 0), 0)), "brut", "EUR"], ["Comisioane", commissions.length, "plati agenti", "COM"], ["Deal-uri", filtered.offers.length, "pipeline oferte", "OF"]]} /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><Panel><Title compact title="Creeaza factura Stripe" /><Grid columns={1}>{["client_email", "client_name", "amount", "currency", "description", "property_id"].map((key) => <Field key={key} label={key} value={String(invoice[key] || "")} onChange={(value) => setInvoice({ ...invoice, [key]: value })} />)}</Grid><Button className="mt-4 w-full" disabled={busy || !invoice.client_email || !invoice.amount} onClick={create}>{busy ? "Se creeaza..." : "Creeaza si trimite factura"}</Button></Panel><Panel tight><Table heads={["Factura", "Client", "Suma", "Status"]} rows={invoices} empty="Nu exista facturi." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td><p className="font-black">{row.stripe_invoice_id || row.id}</p><p className="max-w-md truncate text-xs text-text-muted">{row.hosted_invoice_url || "-"}</p></Td><Td>{row.client_email}</Td><Td>{money(row.amount, row.currency || "EUR")}</Td><Td><Badge>{statusLabel(row.status)}</Badge></Td></tr>} /></Panel></div></div>
}

export function IntegrationsView({ platform }: any) {
  const [status, setStatus] = useState<Row>({})
  const [target, setTarget] = useState("")
  const [busy, setBusy] = useState("")
  const jobs = rows(platform.admin_provider_jobs)
  const health = platform.runtime_health || {}
  const variables = rows(health.variables)
  const missingRequired = variables.filter((item) => item.required && !item.configured)
  const missingProvider = variables.filter((item) => !item.required && !item.configured)
  useEffect(() => { apiJson<Row>("/api/admin/integrations/test").then((data) => setStatus(data.providers || {})).catch(() => setStatus({})) }, [])
  const test = async (provider: string) => { setBusy(provider); try { await apiJson("/api/admin/integrations/test", { method: "POST", body: JSON.stringify({ provider, target }) }); window.location.reload() } finally { setBusy("") } }
  return <div className="space-y-6"><Title title="Integrari live" subtitle="Resend, Twilio, Google Calendar, DocuSign si Stripe cu erori de configurare controlate." /><Kpis cards={[["Runtime", missingRequired.length ? `${missingRequired.length} lipsa` : "pregatit", "secrete obligatorii", "ENV"], ["Provideri", `${health.summary?.readyProviders || 0}/${health.summary?.totalProviders || 0}`, "configurati", "API"], ["Variabile optionale", missingProvider.length, "inca lipsa", "CFG"], ["Joburi", jobs.length, "coada provider", "JOB"]]} /><Panel><div className="grid gap-3 md:grid-cols-[1fr_auto]"><Field label="destinatie test email/telefon" value={target} onChange={setTarget} /><div className="flex flex-wrap items-end gap-2">{["resend", "twilio", "google", "docusign", "stripe"].map((provider) => <Button key={provider} disabled={busy === provider || !target} onClick={() => test(provider)}>{provider}: {status[provider] ? "pregatit" : "lipsa"}</Button>)}</div></div></Panel><div className="grid gap-5 xl:grid-cols-[420px_1fr]"><Panel><Title compact title="Readiness Cloudflare" subtitle="Valorile secrete nu sunt afisate aici." /><div className="mt-3 space-y-2">{variables.map((item) => <div key={item.key} className={`rounded-lg border p-3 ${item.configured ? "border-emerald-500/30 bg-emerald-500/10" : item.required ? "border-rose-500/30 bg-rose-500/10" : "border-amber-500/30 bg-amber-500/10"}`}><div className="flex items-center justify-between gap-3"><p className="font-black">{item.label}</p><Badge>{item.configured ? "OK" : item.required ? "OBLIGATORIU" : "LIPSA"}</Badge></div><p className="mt-1 text-xs text-text-muted">{item.key}</p></div>)}</div></Panel><Panel tight><Table heads={["Provider", "Actiune", "Status", "Eroare"]} rows={jobs} empty="Nu exista joburi provider." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td>{row.provider}</Td><Td>{row.action}</Td><Td><Badge>{statusLabel(row.status)}</Badge></Td><Td><p className="max-w-lg truncate">{row.error || row.target || "-"}</p></Td></tr>} /></Panel></div></div>
}

export function BulkOpsView(_props: any) {
  const [csv, setCsv] = useState("title,price,city,type,status\nApartament test,250000,Bucuresti,APARTMENT,DRAFT")
  const [busy, setBusy] = useState(false)
  const importRows = async () => {
    const [headerLine, ...lines] = csv.trim().split(/\r?\n/)
    const headers = headerLine.split(",").map((item) => item.trim())
    const data = lines.map((line) => Object.fromEntries(line.split(",").map((cell, index) => [headers[index], cell.trim()])))
    setBusy(true)
    try { await apiJson("/api/admin/bulk/properties", { method: "POST", body: JSON.stringify({ rows: data }) }); window.location.reload() } finally { setBusy(false) }
  }
  return <Panel><Title title="Operatiuni bulk" subtitle="Import CSV pentru anunturi. Primul rand trebuie sa contina numele campurilor proprietatii." /><textarea className="form-input mt-4 min-h-72 font-mono text-xs" value={csv} onChange={(event) => setCsv(event.target.value)} /><Button className="mt-4" disabled={busy || !csv.includes("\n")} onClick={importRows}>{busy ? "Se importa..." : "Importa proprietati"}</Button></Panel>
}

export function OwnerPortalAdminView({ filtered, platform, saving, saveModule, deleteModule }: any) {
  const reports = rows(platform.owner_reports)
  return <div className="space-y-6"><Title title="Portal proprietari" subtitle="Inregistrari vanzator/proprietar, rapoarte pentru proprietari si status mandat." /><div className="grid gap-5 xl:grid-cols-2"><ModuleEditor type="owners" title="Proprietari" fields={["name", "phone", "email", "type", "status", "notes"]} rows={filtered.owners} defaults={{ type: "PRIVATE", status: "ACTIVE" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} /><ActionPanel title="Raport proprietar" fields={["owner_email", "property_id", "title", "summary", "status", "period_start", "period_end"]} defaults={{ status: "DRAFT" }} saving={saving === "owner-report"} onSubmit={(payload) => apiJson("/api/admin/owner-reports", { method: "POST", body: JSON.stringify(payload) }).then(() => window.location.reload())} /></div><Panel tight><Table heads={["Proprietar", "Raport", "Status", "Creat"]} rows={reports} empty="Nu exista rapoarte proprietar." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td>{row.owner_email}</Td><Td>{row.title}</Td><Td><Badge>{statusLabel(row.status)}</Badge></Td><Td>{date(row.created_at)}</Td></tr>} /></Panel></div>
}

export function AnalyticsOpsView({ core, platform, platformAction, saving }: any) {
  const attribution = rows(platform.analytics_attribution)
  const jobs = rows(platform.admin_provider_jobs)
  const marketRows = rows(platform.market_data)
  const [form, setForm] = useState<Row>({ zone: "", avg_price: 2450, rent_yield: 5.2, liquidity: 86, growth: 7.8, risk: "mediu", poi: "" })

  return <div className="space-y-6"><Title title="Analitice avansate" subtitle="Atribuire, sanatate provideri, semnale de conversie si inteligenta operationala." /><Kpis cards={[["Evenimente atribuire", attribution.length, "campanie/sursa", "UTM"], ["Conversie leaduri", `${core.leads.length ? Math.round((core.leads.filter((lead: Row) => ["QUALIFIED", "CLOSED"].includes(lead.status)).length / core.leads.length) * 100) : 0}%`, "calificate+inchise", "CVR"], ["Erori provider", jobs.filter((job) => String(job.status).includes("FAILED")).length, "sanatate integrari", "ERR"], ["Zone market data", marketRows.length, "surse administrabile", "MKT"]]} /><div className="grid gap-5 xl:grid-cols-2"><Panel><BarList title="Surse" data={countBy(attribution, "source")} /></Panel><Panel><BarList title="Joburi provider" data={countBy(jobs, "status")} /></Panel></div><div className="grid gap-5 xl:grid-cols-[420px_1fr]"><Panel><Title compact title="Market data" subtitle="Datele salvate aici alimenteaza evaluarile si analiza de scenarii." /><Grid columns={1}>{["zone", "avg_price", "rent_yield", "liquidity", "growth", "risk", "poi"].map((key) => <Field key={key} label={key} value={String(form[key] || "")} onChange={(value) => setForm({ ...form, [key]: value })} />)}</Grid><div className="mt-4 flex flex-wrap gap-2"><Button disabled={saving === "market-data" || !String(form.zone || "").trim()} onClick={() => platformAction("market-data", { type: "market_data", payload: form }, "Datele de piata au fost salvate.")}>{saving === "market-data" ? "Se salveaza..." : "Salveaza zona"}</Button><Button variant="ghost" onClick={() => setForm({ zone: "", avg_price: 2450, rent_yield: 5.2, liquidity: 86, growth: 7.8, risk: "mediu", poi: "" })}>Reset</Button></div></Panel><Panel tight><Table heads={["Zona", "Pret/mp", "Randament", "Lichiditate", "Actiuni"]} rows={marketRows} empty="Nu exista date de piata." render={(row) => <tr key={row.zone} className="border-t border-bg-surface"><Td><p className="font-black">{row.zone}</p><p className="text-xs text-text-muted">{Array.isArray(row.poi) ? row.poi.join(", ") : row.poi || "-"}</p></Td><Td>{money(row.avg_price)}</Td><Td>{row.rent_yield}%</Td><Td>{row.liquidity}/100</Td><Td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setForm({ zone: row.zone, avg_price: row.avg_price, rent_yield: row.rent_yield, liquidity: row.liquidity, growth: row.growth, risk: row.risk, poi: Array.isArray(row.poi) ? row.poi.join(", ") : row.poi || "" })}>Editeaza</Button><Button size="sm" variant="danger" onClick={() => platformAction(`market-${row.zone}`, { type: "market_data", payload: { zone: row.zone, action: "delete" } }, "Zona a fost stearsa.")}>Sterge</Button></div></Td></tr>} /></Panel></div></div>
}
