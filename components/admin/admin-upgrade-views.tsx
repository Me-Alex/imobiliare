"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { supabase } from "@/lib/supabase"
import { apiJson, countBy, date, money, type Row } from "./admin-shared"
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
    if (!row.id) return
    await apiJson(`/api/admin/media?id=${row.id}`, { method: "DELETE" })
    window.location.reload()
  }

  const upload = async () => {
    if (!file || !propertyId) return
    setBusy(true)
    try {
      const details = await fileDetails(file)
      const signed = await apiJson<Row>("/api/admin/media/upload-url", { method: "POST", body: JSON.stringify({ property_id: propertyId, file_name: file.name, content_type: file.type, size: file.size, kind, ...details }) })
      const { error } = await supabase.storage.from(signed.bucket || "property-media").uploadToSignedUrl(signed.path, signed.token, file)
      if (error) throw error
      await apiJson("/api/admin/media", { method: "POST", body: JSON.stringify({ property_id: propertyId, path: signed.path, kind, alt, metadata: { content_type: signed.content_type, size: file.size, ...details } }) })
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6"><Title title="Media and floorplans" subtitle="Upload, cover image, gallery metadata and public property media." /><Kpis cards={[["Media", media.length, "property-media bucket", "IMG"], ["Cover", media.filter((item) => item.kind === "cover").length, "primary images", "COV"], ["Floorplans", media.filter((item) => item.kind === "floorplan").length, "plans", "PLN"], ["Properties", filtered.properties.length, "available", "P"]]} /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><Panel><Title compact title="Upload media" /><Grid columns={1}><Field label="property_id" value={propertyId} onChange={setPropertyId} /><Field label="kind (cover/gallery/floorplan)" value={kind} onChange={setKind} /><Field label="alt" value={alt} onChange={setAlt} /></Grid><input className="mt-4 block w-full text-sm" type="file" accept="image/*,.pdf" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] || null)} /><Button className="mt-4 w-full" disabled={!file || !propertyId || busy} onClick={upload}>{busy ? "Uploading..." : "Upload signed media"}</Button></Panel><Panel tight><Table heads={["Media", "Kind", "Property", "Order", "Actions"]} rows={media} empty="Nu exista media." render={(row) => <tr key={row.id || row.path} className="border-t border-bg-surface"><Td><p className="font-black">{row.alt || row.path}</p><p className="max-w-md truncate text-xs text-text-muted">{row.public_url || row.path}</p></Td><Td><Badge>{row.kind}</Badge></Td><Td>{row.property_id}</Td><Td>{row.sort_order || 0}</Td><Td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => updateMedia(row, { kind: "cover", sort_order: 0 })}>Cover</Button><Button size="sm" variant="ghost" onClick={() => updateMedia(row, { sort_order: Number(row.sort_order || 0) - 1 })}>Up</Button><Button size="sm" variant="ghost" onClick={() => updateMedia(row, { sort_order: Number(row.sort_order || 0) + 1 })}>Down</Button><Button size="sm" variant="danger" onClick={() => deleteMedia(row)}>Delete</Button></div></Td></tr>} /></Panel></div></div>
}

async function fileDetails(file: File) {
  const checksum = await crypto.subtle.digest("SHA-256", await file.arrayBuffer()).then((digest) => Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""))
  if (!file.type.startsWith("image/")) return { checksum, width: 0, height: 0 }
  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }) }
    image.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0 }) }
    image.src = url
  })
  return { checksum, ...dimensions }
}

export function CalendarOpsView({ filtered }: any) {
  const [form, setForm] = useState<Row>({ appointment_id: "", summary: "Vizionare HQS", start: "", end: "", client_email: "", agent_email: "" })
  const [busy, setBusy] = useState(false)
  const sync = async () => {
    setBusy(true)
    try { await apiJson("/api/admin/calendar/sync", { method: "POST", body: JSON.stringify(form) }); window.location.reload() } finally { setBusy(false) }
  }
  return <div className="space-y-6"><Title title="Calendar sync" subtitle="Google Calendar event creation for tours and agent availability." /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><Panel><Title compact title="Sync event" /><Grid columns={1}>{["appointment_id", "summary", "start", "end", "client_email", "agent_email"].map((key) => <Field key={key} label={key} value={String(form[key] || "")} onChange={(value) => setForm({ ...form, [key]: value })} />)}</Grid><Button className="mt-4 w-full" disabled={busy || (!form.appointment_id && !form.start)} onClick={sync}>{busy ? "Sync..." : "Create Google event"}</Button></Panel><Panel tight><Table heads={["Client", "Data", "Status", "Agent"]} rows={filtered.appointments} empty="Nu exista programari." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td><p className="font-black">{row.client_name || row.client_email}</p><p className="text-xs text-text-muted">{row.property_title || row.id}</p></Td><Td>{date(row.requested_at || row.starts_at, true)}</Td><Td><Badge>{row.status || "REQUESTED"}</Badge></Td><Td>{row.agent_email || "-"}</Td></tr>} /></Panel></div></div>
}

export function AccountingView({ filtered, platform }: any) {
  const [invoice, setInvoice] = useState<Row>({ client_email: "", client_name: "", amount: 500, currency: "eur", description: "Servicii HQS Imobiliare", property_id: "" })
  const [busy, setBusy] = useState(false)
  const invoices = rows(platform.admin_invoices)
  const commissions = rows(platform.admin_commissions)
  const create = async () => { setBusy(true); try { await apiJson("/api/admin/stripe/invoices", { method: "POST", body: JSON.stringify(invoice) }); window.location.reload() } finally { setBusy(false) } }
  return <div className="space-y-6"><Title title="Accounting" subtitle="Stripe invoices, commission tracking, VAT and payment operations." /><Kpis cards={[["Invoices", invoices.length, "Stripe-backed", "INV"], ["Invoice value", money(invoices.reduce((sum, row) => sum + Number(row.amount || 0), 0)), "gross", "EUR"], ["Commissions", commissions.length, "agent payouts", "COM"], ["Deals", filtered.offers.length, "offer pipeline", "OF"]]} /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><Panel><Title compact title="Create Stripe invoice" /><Grid columns={1}>{["client_email", "client_name", "amount", "currency", "description", "property_id"].map((key) => <Field key={key} label={key} value={String(invoice[key] || "")} onChange={(value) => setInvoice({ ...invoice, [key]: value })} />)}</Grid><Button className="mt-4 w-full" disabled={busy || !invoice.client_email || !invoice.amount} onClick={create}>{busy ? "Creating..." : "Create and send invoice"}</Button></Panel><Panel tight><Table heads={["Invoice", "Client", "Amount", "Status"]} rows={invoices} empty="Nu exista facturi." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td><p className="font-black">{row.stripe_invoice_id || row.id}</p><p className="max-w-md truncate text-xs text-text-muted">{row.hosted_invoice_url || "-"}</p></Td><Td>{row.client_email}</Td><Td>{money(row.amount, row.currency || "EUR")}</Td><Td><Badge>{row.status}</Badge></Td></tr>} /></Panel></div></div>
}

export function IntegrationsView({ platform }: any) {
  const [status, setStatus] = useState<Row>({})
  const [target, setTarget] = useState("")
  const [busy, setBusy] = useState("")
  const jobs = rows(platform.admin_provider_jobs)
  useEffect(() => { apiJson<Row>("/api/admin/integrations/test").then((data) => setStatus(data.providers || {})).catch(() => setStatus({})) }, [])
  const test = async (provider: string) => { setBusy(provider); try { await apiJson("/api/admin/integrations/test", { method: "POST", body: JSON.stringify({ provider, target }) }); window.location.reload() } finally { setBusy("") } }
  return <div className="space-y-6"><Title title="Live integrations" subtitle="Resend, Twilio, Google Calendar, DocuSign and Stripe with safe config failures." /><Panel><div className="grid gap-3 md:grid-cols-[1fr_auto]"><Field label="test target email/phone" value={target} onChange={setTarget} /><div className="flex flex-wrap items-end gap-2">{["resend", "twilio", "google", "docusign", "stripe"].map((provider) => <Button key={provider} disabled={busy === provider || !target} onClick={() => test(provider)}>{provider}: {status[provider] ? "ready" : "missing"}</Button>)}</div></div></Panel><Panel tight><Table heads={["Provider", "Action", "Status", "Error"]} rows={jobs} empty="Nu exista joburi provider." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td>{row.provider}</Td><Td>{row.action}</Td><Td><Badge>{row.status}</Badge></Td><Td><p className="max-w-lg truncate">{row.error || row.target || "-"}</p></Td></tr>} /></Panel></div>
}

export function BulkOpsView(_props: any) {
  const [csv, setCsv] = useState("title,price,city,type,status\nApartament test,250000,Bucuresti,APARTMENT,DRAFT")
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<Row | null>(null)
  const submitRows = async (dry_run: boolean) => {
    const data = parseCsvRows(csv)
    setBusy(true)
    try {
      const result = await apiJson<Row>("/api/admin/bulk/properties", { method: "POST", body: JSON.stringify({ rows: data, dry_run }) })
      if (dry_run) setPreview(result.preview || result)
      else window.location.reload()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Panel>
      <Title title="Bulk operations" subtitle="CSV import cu preview, validari, deduplicare slug si audit pentru rollback." />
      <textarea className="form-input mt-4 min-h-72 font-mono text-xs" value={csv} onChange={(event) => setCsv(event.target.value)} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy || !csv.includes("\n")} onClick={() => submitRows(true)}>{busy ? "Checking..." : "Preview import"}</Button>
        <Button variant="ghost" disabled={busy || !csv.includes("\n")} onClick={() => submitRows(false)}>{busy ? "Importing..." : "Import valid rows"}</Button>
      </div>
      {preview && <div className="mt-5 rounded-lg border border-bg-surface bg-bg-secondary p-4"><p className="font-black text-text-primary">Preview: {preview.success_count || 0} randuri valide, {preview.error_count || 0} erori.</p><div className="mt-3 space-y-2">{rows(preview.errors).slice(0, 8).map((error, index) => <p key={index} className="text-sm text-rose-500">Rand {error.row || "-"}: {error.message}</p>)}</div></div>}
    </Panel>
  )
}

function parseCsvRows(input: string) {
  const lines = input.trim().split(/\r?\n/).filter(Boolean)
  const headers = parseCsvLine(lines[0] || "").map((item) => item.trim())
  return lines.slice(1).map((line) => Object.fromEntries(parseCsvLine(line).map((cell, index) => [headers[index], cell.trim()])))
}

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"' && line[i + 1] === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === "," && !quoted) {
      cells.push(current)
      current = ""
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

export function OwnerPortalAdminView({ filtered, platform, saving, saveModule, deleteModule }: any) {
  const reports = rows(platform.owner_reports)
  return <div className="space-y-6"><Title title="Owner portal" subtitle="Seller/owner records, owner-facing property reports and mandate status." /><div className="grid gap-5 xl:grid-cols-2"><ModuleEditor type="owners" title="Owners" fields={["name", "phone", "email", "type", "status", "notes"]} rows={filtered.owners} defaults={{ type: "PRIVATE", status: "ACTIVE" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} /><ActionPanel title="Owner report" fields={["owner_email", "property_id", "title", "summary", "status", "period_start", "period_end"]} defaults={{ status: "PUBLISHED" }} saving={saving === "owner-report"} onSubmit={(payload) => apiJson("/api/admin/owner-reports", { method: "POST", body: JSON.stringify(payload) }).then(() => window.location.reload())} /></div><Panel tight><Table heads={["Owner", "Report", "Status", "Created"]} rows={reports} empty="Nu exista rapoarte proprietar." render={(row) => <tr key={row.id} className="border-t border-bg-surface"><Td>{row.owner_email}</Td><Td>{row.title}</Td><Td><Badge>{row.status}</Badge></Td><Td>{date(row.created_at)}</Td></tr>} /></Panel></div>
}

export function AnalyticsOpsView({ core, platform }: any) {
  const attribution = rows(platform.analytics_attribution)
  const jobs = rows(platform.admin_provider_jobs)
  return <div className="space-y-6"><Title title="Advanced analytics" subtitle="Attribution, provider health, conversion signals and operational intelligence." /><Kpis cards={[["Attribution events", attribution.length, "campaign/source", "UTM"], ["Lead conversion", `${core.leads.length ? Math.round((core.leads.filter((lead: Row) => ["QUALIFIED", "CLOSED"].includes(lead.status)).length / core.leads.length) * 100) : 0}%`, "qualified+closed", "CVR"], ["Provider failures", jobs.filter((job) => String(job.status).includes("FAILED")).length, "integration health", "ERR"], ["Published inventory", core.properties.filter((property: Row) => property.status === "PUBLISHED").length, "live", "PUB"]]} /><div className="grid gap-5 xl:grid-cols-2"><Panel><BarList title="Sources" data={countBy(attribution, "source")} /></Panel><Panel><BarList title="Provider jobs" data={countBy(jobs, "status")} /></Panel></div></div>
}

export function MarketDataView({ platform }: any) {
  const rowsData = rows(platform.market_data)
  const [draft, setDraft] = useState<Row>({ zone: "Pipera", avg_price: 2190, rent_yield: 5.6, liquidity: 82, growth: 8.4, risk: "mediu", poi: "scoli private, birouri", source: "admin", status: "ACTIVE" })
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      await apiJson("/api/admin/market-data", { method: "POST", body: JSON.stringify(draft) })
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-6">
      <Title title="Market data" subtitle="Actualizeaza pret/mp, randament, lichiditate, crestere si risc. Valuation si scenariile folosesc aceste date inainte de fallback-ul local." />
      <Kpis cards={[["Zone active", rowsData.filter((row) => row.status === "ACTIVE").length, "folosite in calcule", "MD"], ["Pret mediu", money(rowsData.length ? rowsData.reduce((sum, row) => sum + Number(row.avg_price || 0), 0) / rowsData.length : 0), "EUR/mp", "EUR"], ["Risc ridicat", rowsData.filter((row) => row.risk === "ridicat").length, "zone", "R"], ["Surse", new Set(rowsData.map((row) => row.source || "manual")).size, "feeds/manual", "SRC"]]} />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel>
          <Title compact title="Upsert zona" />
          <Grid columns={1}>
            {["zone", "avg_price", "rent_yield", "liquidity", "growth", "risk", "poi", "source", "status"].map((key) => <Field key={key} label={key} value={String(draft[key] || "")} onChange={(value) => setDraft({ ...draft, [key]: value })} />)}
          </Grid>
          <Button className="mt-4 w-full" disabled={busy || !draft.zone} onClick={save}>{busy ? "Saving..." : "Save market data"}</Button>
        </Panel>
        <Panel tight>
          <Table heads={["Zona", "EUR/mp", "Yield", "Lichiditate", "Risc", "Sursa"]} rows={rowsData} empty="Nu exista market data." render={(row) => (
            <tr key={row.id || row.zone} className="border-t border-bg-surface">
              <Td><button className="text-left font-black text-accent" onClick={() => setDraft({ ...row, poi: Array.isArray(row.poi) ? row.poi.join(", ") : row.poi || "" })}>{row.zone}</button></Td>
              <Td>{money(row.avg_price, "EUR")}</Td>
              <Td>{row.rent_yield}%</Td>
              <Td>{row.liquidity}/100</Td>
              <Td><Badge>{row.risk}</Badge></Td>
              <Td>{row.source || "manual"}</Td>
            </tr>
          )} />
        </Panel>
      </div>
    </div>
  )
}
