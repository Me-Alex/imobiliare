"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { date, money, type ModuleType, type Row } from "./admin-shared"
import { Area, Badge, Button, Empty, Field, Filter, Grid, Panel, Table, Td, Title } from "./admin-ui"

export function OperationsView({ filtered, saving, saveModule, deleteModule, platformAction }: any) {
  const [tab, setTab] = useState("tasks")
  const tabs = [
    ["tasks", "Activitati"], ["docs", "Documente"], ["offers", "Oferte"], ["projects", "Proiecte"], ["owners", "Proprietari"], ["payments", "Plati"], ["notifications", "Notificari"],
  ]
  return (
    <div className="space-y-6">
      <Title title="Operatiuni" subtitle="Back-office pentru task-uri, acte, oferte, proprietari si comunicari." />
      <div className="flex gap-2 overflow-x-auto">{tabs.map(([id, label]) => <Filter key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Filter>)}</div>
      {tab === "tasks" && <ModuleEditor type="activities" title="Activitati" fields={["title", "entity", "status", "priority", "due_at", "notes"]} rows={filtered.activities} defaults={{ entity: "CRM", status: "OPEN", priority: "MEDIUM" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />}
      {tab === "projects" && <ModuleEditor type="projects" title="Proiecte" fields={["name", "area", "stage", "progress", "deadline", "notes"]} rows={filtered.projects} defaults={{ stage: "PLANNING", progress: 0 }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />}
      {tab === "owners" && <ModuleEditor type="owners" title="Proprietari" fields={["name", "phone", "email", "type", "status", "notes"]} rows={filtered.owners} defaults={{ type: "PRIVATE", status: "ACTIVE" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />}
      {tab === "payments" && <ModuleEditor type="payment_plans" title="Planuri de plata" fields={["name", "property", "total", "advance", "months", "status", "notes"]} rows={filtered.paymentPlans} defaults={{ status: "DRAFT", months: 12 }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />}
      {tab === "notifications" && <Notifications rows={filtered.notifications} outbox={filtered.outbox} saving={saving} saveModule={saveModule} deleteModule={deleteModule} platformAction={platformAction} />}
      {tab === "docs" && <Documents rows={filtered.documents} clientRows={filtered.clientDocuments} saving={saving} saveModule={saveModule} deleteModule={deleteModule} platformAction={platformAction} />}
      {tab === "offers" && <Offers rows={filtered.offers} saving={saving} platformAction={platformAction} />}
    </div>
  )
}

function Documents({ rows, clientRows, saving, saveModule, deleteModule, platformAction }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ModuleEditor type="documents" title="Documente interne" fields={["title", "owner_name", "property", "type", "status", "expires_at", "url", "notes"]} rows={rows} defaults={{ status: "VALID", type: "CONTRACT" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
      <ActionPanel title="Document client" fields={["title", "client_email", "property_title", "status", "expires_at", "notes"]} defaults={{ status: "REQUESTED" }} saving={saving === "client-doc"} onSubmit={(payload) => platformAction("client-doc", { type: "document_status", payload }, "Document client salvat.")} />
      <Panel tight className="xl:col-span-2">
        <Table heads={["Document", "Status", "Expira", "Detalii"]} rows={clientRows} empty="Nu exista documente client." render={(row: Row) => <tr key={row.id || row.title} className="border-t border-bg-surface"><Td>{row.title || row.type}</Td><Td><Badge>{row.status || "REQUESTED"}</Badge></Td><Td>{date(row.expires_at)}</Td><Td>{row.client_email || row.property_title || "-"}</Td></tr>} />
      </Panel>
    </div>
  )
}

function Offers({ rows, saving, platformAction }: any) {
  const [offer, setOffer] = useState<Row>({ id: "", status: "NEGOTIATING", counter_offer: "" })
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Panel tight>
        <Table heads={["Oferta", "Client", "Valoare", "Status"]} rows={rows} empty="Nu exista oferte." render={(row: Row) => <tr key={row.id} className="border-t border-bg-surface"><Td>{row.property_title || row.property_slug || "-"}</Td><Td>{row.client_name || row.client_email || "-"}</Td><Td>{money(row.offer_price || row.counter_offer || 0)}</Td><Td><Badge>{row.status || "NEW"}</Badge></Td></tr>} />
      </Panel>
      <Panel>
        <Title compact title="Actualizare oferta" />
        <Grid columns={1}>{["id", "status", "counter_offer"].map((key) => <Field key={key} label={key} value={String(offer[key] || "")} onChange={(value) => setOffer({ ...offer, [key]: value })} />)}</Grid>
        <Button className="mt-4 w-full" disabled={!offer.id || saving === "offer"} onClick={() => platformAction("offer", { type: "offer_status", payload: offer }, "Oferta actualizata.")}>Salveaza oferta</Button>
      </Panel>
    </div>
  )
}

function Notifications({ rows, outbox, saving, saveModule, deleteModule, platformAction }: any) {
  const [queue, setQueue] = useState<Row>({ target: "", subject: "", body: "", channel: "email", status: "QUEUED" })
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ModuleEditor type="notifications" title="Notificari interne" fields={["title", "body", "channel", "status", "due_at", "target"]} rows={rows} defaults={{ channel: "email", status: "DRAFT" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
      <Panel>
        <Title compact title="Trimite in outbox" />
        <Grid columns={1}>{["target", "subject", "body", "channel", "status"].map((key) => <Field key={key} label={key} value={String(queue[key] || "")} onChange={(value) => setQueue({ ...queue, [key]: value })} />)}</Grid>
        <Button className="mt-4 w-full" disabled={!queue.target || !queue.subject || saving === "queue"} onClick={() => platformAction("queue", { type: "client_notification", payload: queue }, "Notificare adaugata.")}>Queue notificare</Button>
      </Panel>
      <Panel tight className="xl:col-span-2">
        <Table heads={["Outbox", "Canal", "Status", "Target"]} rows={outbox} empty="Nu exista notificari in outbox." render={(row: Row) => <tr key={row.id || row.subject} className="border-t border-bg-surface"><Td>{row.subject || row.title}</Td><Td>{row.channel || "email"}</Td><Td><Badge>{row.status || "QUEUED"}</Badge></Td><Td>{row.target || row.client_email || "-"}</Td></tr>} />
      </Panel>
    </div>
  )
}

export function ModuleEditor({ type, title, fields, rows, defaults = {}, saving, saveModule, deleteModule }: { type: ModuleType; title: string; fields: string[]; rows: Row[]; defaults?: Row; saving: string; saveModule: (type: ModuleType, payload: Row) => void; deleteModule: (type: ModuleType, id: string) => void }) {
  const blank = useMemo(() => fields.reduce((acc: Row, field: string) => ({ ...acc, [field]: defaults[field] || "" }), {}), [fields, defaults])
  const [form, setForm] = useState<Row>(blank)
  useEffect(() => setForm(blank), [blank])
  return (
    <Panel>
      <Title compact title={title} subtitle="Adauga, actualizeaza si sterge intrari operationale." />
      <Grid columns={3}>{fields.filter((field) => !["notes", "body"].includes(field)).map((field) => <Field key={field} label={field} value={String(form[field] || "")} onChange={(value) => setForm({ ...form, [field]: value })} />)}</Grid>
      {fields.includes("notes") && <Area label="notes" value={String(form.notes || "")} onChange={(value) => setForm({ ...form, notes: value })} />}
      {fields.includes("body") && <Area label="body" value={String(form.body || "")} onChange={(value) => setForm({ ...form, body: value })} />}
      <Button className="mt-4" disabled={saving === `${type}-save`} onClick={() => saveModule(type, form)}><Plus className="h-4 w-4" /> Salveaza</Button>
      <div className="mt-5 space-y-3">
        {rows.map((row) => <div key={row.id || row.name || row.title} className="flex items-center justify-between gap-4 rounded-lg border border-bg-surface bg-bg-secondary p-3"><div><p className="font-black">{row.name || row.title || row.subject || row.email || row.id}</p><p className="text-sm text-text-muted">{row.status || row.stage || row.type || row.role || "-"}</p></div>{row.id && <Button size="sm" variant="danger" disabled={saving === `${type}-${row.id}`} onClick={() => deleteModule(type, row.id)}><Trash2 className="h-4 w-4" /> Sterge</Button>}</div>)}
        {!rows.length && <Empty text="Nu exista intrari." />}
      </div>
    </Panel>
  )
}

export function ActionPanel({ title, fields, defaults = {}, saving, onSubmit }: { title: string; fields: string[]; defaults?: Row; saving?: boolean; onSubmit: (payload: Row) => void }) {
  const [form, setForm] = useState<Row>(defaults)
  return (
    <Panel>
      <Title compact title={title} />
      <Grid columns={1}>{fields.filter((field) => !["body", "notes"].includes(field)).map((field) => <Field key={field} label={field} value={String(form[field] || "")} onChange={(value) => setForm({ ...form, [field]: value })} />)}</Grid>
      {fields.includes("body") && <Area label="body" value={String(form.body || "")} onChange={(value) => setForm({ ...form, body: value })} />}
      {fields.includes("notes") && <Area label="notes" value={String(form.notes || "")} onChange={(value) => setForm({ ...form, notes: value })} />}
      <Button className="mt-4 w-full" disabled={saving} onClick={() => onSubmit(form)}><Plus className="h-4 w-4" /> Salveaza</Button>
    </Panel>
  )
}
