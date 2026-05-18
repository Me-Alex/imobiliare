"use client"

import { useState } from "react"
import { apiJson, countBy, date, defaultModules, money, type Row } from "./admin-shared"
import { ActionPanel, ModuleEditor } from "./admin-operations"
import { Badge, BarList, Button, Empty, Field, Grid, Kpis, MiniRow, Panel, Result, Table, Td, Title } from "./admin-ui"

export function ContentView({ filtered, saving, platformAction }: any) {
  return (
    <div className="space-y-6">
      <Title title="Continut" subtitle="CMS, pagini, SEO si puncte de interes pentru zone." />
      <div className="grid gap-5 xl:grid-cols-2">
        <ActionPanel title="CMS entry" fields={["slug", "title", "type", "status", "body"]} defaults={{ type: "page", status: "DRAFT" }} saving={saving === "cms"} onSubmit={(payload) => platformAction("cms", { type: "cms", payload }, "Continut salvat.")} />
        <ActionPanel title="Punct de interes" fields={["zone_slug", "name", "category", "lat", "lng", "score", "notes"]} defaults={{ category: "school", score: 5 }} saving={saving === "zone"} onSubmit={(payload) => platformAction("zone", { type: "zone_poi", payload }, "Punct zona salvat.")} />
      </div>
      <Panel tight><Table heads={["Continut", "Tip", "Status", "Creat"]} rows={filtered.cms} empty="Nu exista continut CMS." render={(row: Row) => <tr key={row.id || row.slug} className="border-t border-bg-surface"><Td>{row.title || row.slug}</Td><Td>{row.type || "page"}</Td><Td><Badge>{row.status || "DRAFT"}</Badge></Td><Td>{date(row.created_at)}</Td></tr>} /></Panel>
      <Panel tight><Table heads={["Zona", "POI", "Categorie", "Scor"]} rows={filtered.zones} empty="Nu exista puncte de interes." render={(row: Row) => <tr key={row.id || row.name} className="border-t border-bg-surface"><Td>{row.zone || row.zone_slug}</Td><Td>{row.name}</Td><Td>{row.category}</Td><Td>{row.score || "-"}</Td></tr>} /></Panel>
    </div>
  )
}

export function ReportsView({ core, modules, platform, report, metrics, exportLocalCsv, exportServer, saving }: any) {
  return (
    <div className="space-y-6">
      <Title title="Rapoarte" subtitle={`Ultima generare: ${date(report.generated_at, true)}`} action={<div className="flex gap-2"><Button variant="ghost" onClick={exportLocalCsv}>CSV local</Button><Button disabled={saving === "export-json"} onClick={() => exportServer("json")}>JSON</Button></div>} />
      <Kpis cards={[["Leaduri", core.leads.length, `${metrics.activeLeads.length} active`, "L"], ["Portofoliu", money(metrics.portfolio), `${metrics.published.length} publicate`, "P"], ["Oferte", (platform.property_offers || []).length, money(metrics.pipeline), "O"], ["Documente", modules.documents.length + (platform.client_documents || []).length, "intern + client", "D"]]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel><BarList title="Funnel CRM" data={report.funnel || countBy(core.leads, "status")} /></Panel>
        <Panel><BarList title="Oferte" data={report.offerFlow || countBy(platform.property_offers || [], "status")} /></Panel>
        <Panel><BarList title="Documente" data={report.documentFlow || countBy(platform.client_documents || [], "status")} /></Panel>
        <Panel><BarList title="Orase" data={report.cityInventory || countBy(core.properties, "city")} /></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel><Title compact title="Riscuri" />{(report.risks || ["Nu exista riscuri raportate."]).map((item: string) => <p key={item} className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">{item}</p>)}</Panel>
        <Panel><Title compact title="Actiuni recomandate" />{(report.nextActions || []).map((item: Row, index: number) => <MiniRow key={index} title={item.title} meta={item.area || "-"} value={item.priority || "-"} />)}{!(report.nextActions || []).length && <Empty text="Nu exista actiuni recomandate." />}</Panel>
      </div>
    </div>
  )
}

export function UsersView({ filtered, saving, saveModule, deleteModule, platformAction, reload }: any) {
  const [busy, setBusy] = useState("")
  const userAction = async (row: Row, action: string) => {
    setBusy(`${action}-${row.email}`)
    try {
      await apiJson("/api/admin/users", { method: "POST", body: JSON.stringify({ email: row.email, action }) })
      await reload()
    } finally {
      setBusy("")
    }
  }
  return (
    <div className="space-y-6">
      <Title title="Echipa" subtitle="Utilizatori operationali si roluri admin." />
      <div className="grid gap-5 xl:grid-cols-2">
        <ModuleEditor type="team_users" title="Membri echipa" fields={["name", "email", "role", "status"]} rows={filtered.teamUsers} defaults={{ role: "agent", status: "ACTIVE" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
        <ActionPanel title="Rol admin" fields={["email", "role", "permissions", "status"]} defaults={{ role: "manager", permissions: "leads,clients,appointments,properties,documents,reports", status: "ACTIVE" }} saving={saving === "role"} onSubmit={(payload) => apiJson("/api/admin/users", { method: "POST", body: JSON.stringify({ ...payload, action: "invite" }) }).then(() => platformAction("role", { type: "audit_event", payload: { action: "ADMIN_INVITE_FROM_UI", entity: "admin_roles", details: { email: payload.email } } }, "Invitatie admin salvata."))} />
      </div>
      <Panel tight><Table heads={["Email", "Rol", "Permisiuni", "Status", "Actiuni"]} rows={filtered.roles} empty="Nu exista roluri admin." render={(row: Row) => <tr key={row.id || row.email} className="border-t border-bg-surface"><Td>{row.email}</Td><Td>{row.role}</Td><Td>{Array.isArray(row.permissions) ? row.permissions.join(", ") : row.permissions}</Td><Td><Badge>{row.status || "ACTIVE"}</Badge></Td><Td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" disabled={busy === `reset-${row.email}`} onClick={() => userAction(row, "reset")}>Reset</Button><Button size="sm" variant="danger" disabled={busy === `deactivate-${row.email}`} onClick={() => userAction(row, "deactivate")}>Deactivate</Button></div></Td></tr>} /></Panel>
    </div>
  )
}

export function ToolsView({ filtered, modules }: any) {
  const settings = modules.settings || defaultModules.settings
  const [price, setPrice] = useState("250000")
  const [advance, setAdvance] = useState("50000")
  const [months, setMonths] = useState("240")
  const principal = Math.max(0, Number(price || 0) - Number(advance || 0))
  const monthly = principal ? Math.round((principal * 0.005) / (1 - Math.pow(1.005, -Number(months || 1)))) : 0
  const avg = filtered.properties.length ? Math.round(filtered.properties.reduce((sum: number, row: Row) => sum + Number(row.price || 0), 0) / filtered.properties.length) : 0
  return <div className="space-y-6"><Title title="Instrumente" subtitle="Calculatoare rapide, evaluare, comision si data browser server-side." /><div className="grid gap-5 xl:grid-cols-3"><Panel><Title compact title="Credit" /><Grid columns={1}>{[["price", price, setPrice], ["advance", advance, setAdvance], ["months", months, setMonths]].map(([label, value, set]: any) => <Field key={label} label={label} value={value} onChange={set} />)}</Grid><Result label="Rata estimata" value={money(monthly)} /></Panel><Panel><Title compact title="Evaluator" /><Result label="Pret mediu portofoliu" value={money(avg)} /><Result label="Inventar filtrat" value={filtered.properties.length} /></Panel><Panel><Title compact title="Comision" /><Result label="Comision standard" value={`${settings.commission || 3}%`} /><Result label="La pretul introdus" value={money(Number(price || 0) * Number(settings.commission || 3) / 100)} /></Panel></div><AdminDataBrowser /></div>
}

function AdminDataBrowser() {
  const [table, setTable] = useState("leads")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Row>({ rows: [], total: 0, page_count: 1 })
  const [busy, setBusy] = useState(false)
  const dataTables = ["leads", "properties", "appointments", "slots", "media", "documents", "invoices", "provider_jobs", "owners", "roles", "audit", "bulk_imports", "rate_limits"]
  const rows = Array.isArray(result.rows) ? result.rows : []
  const keys = Array.from(rows.reduce<Set<string>>((set, row) => {
    Object.keys(row || {}).slice(0, 10).forEach((key) => set.add(key))
    return set
  }, new Set<string>())).slice(0, 6)
  const load = async (nextPage = page) => {
    setBusy(true)
    try {
      const params = new URLSearchParams({ table, q: query, page: String(nextPage), page_size: "25" })
      const data = await apiJson<Row>(`/api/admin/list?${params.toString()}`)
      setResult(data)
      setPage(nextPage)
    } finally {
      setBusy(false)
    }
  }
  const exportPage = () => {
    const headers = keys.length ? keys : ["json"]
    const lines = [headers.join(","), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? JSON.stringify(row)).replace(/"/g, '""')}"`).join(","))]
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `admin-${table}-page-${page}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return <Panel tight><div className="p-5"><Title compact title="Server-side data browser" subtitle="Cautare paginata pe tabele admin, fara sa incarci tot snapshot-ul in browser." /><div className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto]"><label className="block text-xs font-bold uppercase text-text-muted">table<select className="form-input mt-2" value={table} onChange={(event) => setTable(event.target.value)}>{dataTables.map((item) => <option key={item}>{item}</option>)}</select></label><Field label="search" value={query} onChange={setQuery} /><Button disabled={busy} onClick={() => load(1)}>{busy ? "Loading..." : "Search"}</Button><Button variant="ghost" disabled={!rows.length} onClick={exportPage}>Export page</Button></div></div><Table heads={keys.length ? [...keys, "json"] : ["json"]} rows={rows} empty="Ruleaza o cautare server-side." render={(row) => <tr key={row.id || JSON.stringify(row).slice(0, 80)} className="border-t border-bg-surface">{keys.map((key) => <Td key={key}><p className="max-w-[220px] truncate">{String(row[key] ?? "-")}</p></Td>)}<Td><p className="max-w-xs truncate text-xs text-text-muted">{JSON.stringify(row)}</p></Td></tr>} /><div className="flex items-center justify-between gap-3 border-t border-bg-surface p-4 text-sm text-text-muted"><span>Total {result.total || 0}, pagina {page}/{result.page_count || 1}</span><div className="flex gap-2"><Button size="sm" variant="ghost" disabled={busy || page <= 1} onClick={() => load(page - 1)}>Prev</Button><Button size="sm" variant="ghost" disabled={busy || page >= Number(result.page_count || 1)} onClick={() => load(page + 1)}>Next</Button></div></div></Panel>
}

export function SettingsView({ modules, saving, saveSettings }: any) {
  const [form, setForm] = useState<Row>({ ...defaultModules.settings, ...(modules.settings || {}) })
  return <Panel><Title title="Setari" subtitle="Configurare agentie, target, comision si TVA." /><Grid columns={4}>{["agency", "commission", "target", "vat", "theme"].map((key) => <Field key={key} label={key} value={String(form[key] || "")} onChange={(value) => setForm({ ...form, [key]: value })} />)}</Grid><Button className="mt-4" disabled={saving === "settings"} onClick={() => saveSettings({ ...form, commission: Number(form.commission || 0), target: Number(form.target || 0), vat: Number(form.vat || 0) })}>Salveaza setari</Button></Panel>
}

export function AuditView({ filtered, saving, platformAction }: any) {
  return (
    <div className="space-y-6">
      <Title title="Audit" subtitle="Jurnal de evenimente si trasabilitate." action={<Button variant="ghost" disabled={saving === "audit"} onClick={() => platformAction("audit", { type: "audit_event", payload: { action: "manual_check", entity: "admin", details: { source: "admin-ui" } } }, "Eveniment audit salvat.")}>Log manual</Button>} />
      <Panel tight><Table heads={["Actiune", "Entitate", "Actor", "Detalii", "Data"]} rows={filtered.audit} empty="Nu exista evenimente audit." render={(row: Row) => <tr key={row.id || `${row.action}-${row.created_at}`} className="border-t border-bg-surface"><Td><Badge>{row.action}</Badge></Td><Td>{row.entity || "-"}</Td><Td>{row.actor || "-"}</Td><Td><p className="max-w-lg truncate">{JSON.stringify(row.details || {})}</p></Td><Td>{date(row.created_at, true)}</Td></tr>} /></Panel>
    </div>
  )
}
