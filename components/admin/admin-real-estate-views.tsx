"use client"

import { useState } from "react"
import { ActionPanel, ModuleEditor } from "./admin-operations"
import { countBy, date, money, slugify, type ModuleType, type Row } from "./admin-shared"
import { Badge, BarList, Button, Empty, Field, Grid, Kpis, MiniRow, Panel, Table, Td, Title } from "./admin-ui"

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value : []
}

function statusTone(status?: string) {
  const normalized = String(status || "").toUpperCase()
  if (["PUBLISHED", "ACTIVE", "APPROVED", "SIGNED", "CONFIRMED", "SENT"].includes(normalized)) return "ok"
  if (["DRAFT", "REQUESTED", "PENDING", "QUEUED", "NEGOTIATING"].includes(normalized)) return "warn"
  if (["CANCELLED", "LOST", "EXPIRED", "REJECTED"].includes(normalized)) return "bad"
  return "neutral"
}

function StatusBadge({ status }: { status?: string }) {
  const tone = statusTone(status)
  const className =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
        : tone === "bad"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
          : "border-bg-surface bg-bg-secondary"

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${className}`}>{status || "UNKNOWN"}</span>
}

export function ListingsView({ filtered, saving, patchProperty, createProperty, setView }: any) {
  const [draft, setDraft] = useState<Row>({
    title: "",
    type: "APARTMENT",
    status: "DRAFT",
    price: 250000,
    currency: "EUR",
    city: "Bucuresti",
    area_sqm: 90,
    rooms: 3,
  })
  const rows = asRows(filtered.properties)
  const pending = rows.filter((row) => row.status !== "PUBLISHED")
  const published = rows.filter((row) => row.status === "PUBLISHED")
  const featured = rows.filter((row) => row.featured)

  return (
    <div className="space-y-6">
      <Title
        title="Listings command"
        subtitle="Publicare, aprobare, featured inventory si verificari de calitate inainte de promovare."
        action={<Button onClick={() => setView("marketing")}>Marketing</Button>}
      />
      <Kpis cards={[
        ["Publicate", published.length, `${rows.length} total`, "LIVE"],
        ["In aprobare", pending.length, "draft / sold / rented", "QA"],
        ["Featured", featured.length, "homepage + campanii", "TOP"],
        ["Valoare listata", money(published.reduce((sum: number, row: Row) => sum + Number(row.price || 0), 0)), "portfolio live", "EUR"],
      ]} />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel tight>
          <Table heads={["Listing", "Pret", "Calitate", "Status", "Actiuni"]} rows={rows} empty="Nu exista listinguri." render={(row: Row) => {
            const quality = [
              row.title ? "titlu" : "",
              row.description ? "descriere" : "",
              row.cover_image_url ? "foto" : "",
              row.price ? "pret" : "",
              row.city ? "zona" : "",
            ].filter(Boolean)
            return (
              <tr key={row.id} className="border-t border-bg-surface">
                <Td><p className="font-black">{row.title}</p><p className="text-xs text-text-muted">{row.slug || row.city || "-"}</p></Td>
                <Td>{money(row.price, row.currency || "EUR")}</Td>
                <Td>{quality.length}/5 <span className="text-xs text-text-muted">campuri</span></Td>
                <Td><StatusBadge status={row.status} /></Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={saving === `property-${row.id}`} onClick={() => patchProperty(row, { status: "PUBLISHED", published_at: new Date().toISOString() })}>Aproba</Button>
                    <Button size="sm" variant="ghost" disabled={saving === `property-${row.id}`} onClick={() => patchProperty(row, { status: "DRAFT" })}>Draft</Button>
                    <Button size="sm" variant="ghost" disabled={saving === `property-${row.id}`} onClick={() => patchProperty(row, { featured: !row.featured })}>{row.featured ? "Unfeature" : "Feature"}</Button>
                  </div>
                </Td>
              </tr>
            )
          }} />
        </Panel>
        <Panel>
          <Title compact title="Listing rapid" subtitle="Creeaza un listing draft si trimite-l in fluxul de aprobare." />
          <Grid columns={1}>
            {["title", "price", "currency", "city", "area_sqm", "rooms"].map((key) => <Field key={key} label={key} value={String(draft[key] || "")} onChange={(value) => setDraft({ ...draft, [key]: value })} />)}
          </Grid>
          <Button className="mt-4 w-full" disabled={!draft.title || saving === "create-property"} onClick={() => createProperty({ ...draft, slug: slugify(draft.title), price: Number(draft.price || 0), area_sqm: Number(draft.area_sqm || 0), rooms: Number(draft.rooms || 0) })}>Add property draft</Button>
          <div className="mt-5 space-y-3">
            {["Fair-housing copy review", "Photo and floor-plan check", "Price and commission check", "Owner mandate attached"].map((item) => <MiniRow key={item} title={item} meta="quality gate" value="required" />)}
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function ClientsView({ filtered, saving, platformAction }: any) {
  const [client, setClient] = useState<Row>({ full_name: "", email: "", phone: "", budget: 250000, purpose: "buy", financing_status: "pre-approved", status: "ACTIVE" })
  const clients = asRows(filtered.clients)
  const leads = asRows(filtered.leads)
  const offers = asRows(filtered.offers)
  return (
    <div className="space-y-6">
      <Title title="Clients" subtitle="Cumparatori, chiriasi, proprietari si istoric comercial intr-un singur profil." />
      <Kpis cards={[
        ["Profiluri", clients.length, "client portal + CRM", "CL"],
        ["Leaduri corelate", leads.length, "inquiries", "IN"],
        ["Oferte active", offers.filter((row) => !["CLOSED", "REJECTED"].includes(String(row.status || ""))).length, "negocieri", "OF"],
        ["Buget mediu", money(clients.length ? clients.reduce((sum: number, row: Row) => sum + Number(row.budget || row.max_budget || 0), 0) / clients.length : 0), "client profiles", "EUR"],
      ]} />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel tight>
          <Table heads={["Client", "Preferinte", "Status", "Ultima activitate"]} rows={clients} empty="Nu exista profiluri client." render={(row: Row) => (
            <tr key={row.id || row.email || row.phone} className="border-t border-bg-surface">
              <Td><p className="font-black">{row.full_name || row.name || "Client"}</p><p className="text-xs text-text-muted">{row.email || row.phone || "-"}</p></Td>
              <Td>{money(row.budget || row.max_budget || 0)} / {row.purpose || row.rooms || "-"}</Td>
              <Td><StatusBadge status={row.status || row.financing_status || "ACTIVE"} /></Td>
              <Td>{date(row.updated_at || row.created_at, true)}</Td>
            </tr>
          )} />
        </Panel>
        <Panel>
          <Title compact title="Profil client" subtitle="Creeaza sau actualizeaza datele comerciale." />
          <Grid columns={1}>{["full_name", "email", "phone", "budget", "purpose", "financing_status", "status"].map((key) => <Field key={key} label={key} value={String(client[key] || "")} onChange={(value) => setClient({ ...client, [key]: value })} />)}</Grid>
          <Button className="mt-4 w-full" disabled={!client.full_name || saving === "client-profile"} onClick={() => platformAction("client-profile", { type: "client_profile", payload: { ...client, budget: Number(client.budget || 0) } }, "Profil client salvat.")}>Save client</Button>
        </Panel>
      </div>
    </div>
  )
}

export function AgentsView({ filtered, saving, saveModule, deleteModule, platformAction }: any) {
  const agents = asRows(filtered.teamUsers)
  const roles = asRows(filtered.roles)
  const slots = asRows(filtered.slots)
  return (
    <div className="space-y-6">
      <Title title="Agents and teams" subtitle="Agent workload, roles, permissions, schedule capacity and ownership." />
      <Kpis cards={[
        ["Agenti", agents.length, "team users", "AG"],
        ["Roluri admin", roles.length, "RBAC", "RBAC"],
        ["Sloturi vizionare", slots.length, "capacity", "CAL"],
        ["Sloturi libere", slots.filter((row) => ["OPEN", "AVAILABLE"].includes(String(row.status || ""))).length, "available", "OK"],
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <ModuleEditor type="team_users" title="Membri echipa" fields={["name", "email", "role", "status", "notes"]} rows={agents} defaults={{ role: "agent", status: "ACTIVE" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
        <ActionPanel title="Rol si permisiuni" fields={["email", "role", "permissions", "status"]} defaults={{ role: "agent", permissions: "leads,clients,appointments,offers,documents", status: "ACTIVE" }} saving={saving === "role"} onSubmit={(payload) => platformAction("role", { type: "admin_role", payload }, "Rol admin salvat.")} />
      </div>
      <Panel><BarList title="Capacitate pe agent" data={countBy(slots, "agent_email")} /></Panel>
    </div>
  )
}

export function TransactionsView({ filtered, saving, saveModule, deleteModule, platformAction, exportServer }: any) {
  const [offer, setOffer] = useState<Row>({ id: "", status: "NEGOTIATING", counter_offer: "" })
  const offers = asRows(filtered.offers)
  const plans = asRows(filtered.paymentPlans)
  const contracts = asRows(filtered.documents).filter((row) => String(row.type || row.title || "").toLowerCase().includes("contract"))
  const pipeline = offers.reduce((sum: number, row: Row) => sum + Number(row.counter_offer || row.offer_price || 0), 0)
  return (
    <div className="space-y-6">
      <Title title="Transactions, offers and payments" subtitle="Pipeline de oferte, contracte, planuri de plata, comisioane si export financiar." action={<Button onClick={() => exportServer("json")}>Export</Button>} />
      <Kpis cards={[
        ["Oferte", offers.length, money(pipeline), "OF"],
        ["Contracte", contracts.length, "intern + client", "CT"],
        ["Planuri plata", plans.length, "deposit / schedule", "PAY"],
        ["Acceptate", offers.filter((row) => ["ACCEPTED", "CLOSED"].includes(String(row.status || ""))).length, "won", "WIN"],
      ]} />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel tight>
          <Table heads={["Deal", "Client", "Valoare", "Status", "Actualizare"]} rows={offers} empty="Nu exista oferte." render={(row: Row) => (
            <tr key={row.id} className="border-t border-bg-surface">
              <Td><p className="font-black">{row.property_title || row.property_slug || "Proprietate"}</p><p className="text-xs text-text-muted">{row.id}</p></Td>
              <Td>{row.client_name || row.client_email || row.client_phone || "-"}</Td>
              <Td>{money(row.counter_offer || row.offer_price || 0)}</Td>
              <Td><StatusBadge status={row.status || "SUBMITTED"} /></Td>
              <Td><Button size="sm" variant="ghost" onClick={() => setOffer({ id: row.id, status: row.status || "NEGOTIATING", counter_offer: row.counter_offer || row.offer_price || "" })}>Edit</Button></Td>
            </tr>
          )} />
        </Panel>
        <Panel>
          <Title compact title="Update deal" subtitle="Counteroffer, close, reject or move negotiation forward." />
          <Grid columns={1}>{["id", "status", "counter_offer"].map((key) => <Field key={key} label={key} value={String(offer[key] || "")} onChange={(value) => setOffer({ ...offer, [key]: value })} />)}</Grid>
          <Button className="mt-4 w-full" disabled={!offer.id || saving === "offer"} onClick={() => platformAction("offer", { type: "offer_status", payload: offer }, "Oferta actualizata.")}>Save deal</Button>
        </Panel>
      </div>
      <ModuleEditor type="payment_plans" title="Payments and commissions" fields={["name", "property", "total", "advance", "months", "status", "notes"]} rows={plans} defaults={{ status: "DRAFT", months: 12 }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
    </div>
  )
}

export function MaintenanceView({ filtered, saving, saveModule, deleteModule }: any) {
  const tickets = asRows(filtered.maintenance)
  return (
    <div className="space-y-6">
      <Title title="Maintenance" subtitle="Tichete pentru proprietati, furnizori, prioritati, costuri si SLA." />
      <Kpis cards={[
        ["Tichete", tickets.length, "maintenance queue", "MT"],
        ["High priority", tickets.filter((row) => String(row.priority || "").toUpperCase() === "HIGH").length, "urgent", "HI"],
        ["Deschise", tickets.filter((row) => !["DONE", "CLOSED"].includes(String(row.status || ""))).length, "open", "OP"],
        ["Scadente", tickets.filter((row) => row.due_at && new Date(row.due_at).getTime() < Date.now()).length, "past due", "DUE"],
      ]} />
      <ModuleEditor type="activities" title="Maintenance ticket" fields={["title", "entity", "status", "priority", "due_at", "notes"]} rows={tickets} defaults={{ entity: "MAINTENANCE", status: "OPEN", priority: "MEDIUM" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
    </div>
  )
}

export function DocumentsCenterView({ filtered, saving, saveModule, deleteModule, platformAction }: any) {
  const docs = asRows(filtered.documents)
  const clientDocs = asRows(filtered.clientDocuments)
  const [review, setReview] = useState<Row>({ id: "", status: "APPROVED", notes: "" })
  return (
    <div className="space-y-6">
      <Title title="Documents" subtitle="Contracte, acte proprietate, dosare clienti, expirari si review." />
      <Kpis cards={[
        ["Documente interne", docs.length, "contracts + files", "DOC"],
        ["Documente client", clientDocs.length, "portal uploads", "CL"],
        ["Pending review", clientDocs.filter((row) => !["APPROVED", "SIGNED"].includes(String(row.status || ""))).length, "needs action", "QA"],
        ["Expirate", [...docs, ...clientDocs].filter((row) => row.expires_at && new Date(row.expires_at).getTime() < Date.now()).length, "renew", "EXP"],
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <ModuleEditor type="documents" title="Document intern" fields={["title", "owner_name", "property", "type", "status", "expires_at", "url", "notes"]} rows={docs} defaults={{ status: "VALID", type: "CONTRACT" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
        <Panel>
          <Title compact title="Review document client" />
          <Grid columns={1}>{["id", "status", "notes"].map((key) => <Field key={key} label={key} value={String(review[key] || "")} onChange={(value) => setReview({ ...review, [key]: value })} />)}</Grid>
          <Button className="mt-4 w-full" disabled={!review.id || saving === "client-doc"} onClick={() => platformAction("client-doc", { type: "document_status", payload: review }, "Document client salvat.")}>Save review</Button>
        </Panel>
      </div>
      <Panel tight><Table heads={["Client document", "Status", "Expira", "Detalii"]} rows={clientDocs} empty="Nu exista documente client." render={(row: Row) => <tr key={row.id || row.title} className="border-t border-bg-surface"><Td>{row.title || row.type}</Td><Td><StatusBadge status={row.status || "REQUESTED"} /></Td><Td>{date(row.expires_at)}</Td><Td>{row.client_email || row.property_title || row.id}</Td></tr>} /></Panel>
    </div>
  )
}

export function MarketingView({ filtered, saving, saveModule, deleteModule, platformAction }: any) {
  const campaigns = asRows(filtered.notifications)
  const outbox = asRows(filtered.outbox)
  const cms = asRows(filtered.cms)
  return (
    <div className="space-y-6">
      <Title title="Marketing" subtitle="Campanii, continut, lead source tracking, email/SMS outbox si listing promotion." />
      <Kpis cards={[
        ["Campanii", campaigns.length, "internal campaigns", "MK"],
        ["Outbox", outbox.length, "email/SMS queue", "OB"],
        ["CMS", cms.length, "landing pages", "CMS"],
        ["Lead sources", Object.keys(countBy(asRows(filtered.leads), "source")).length, "tracked", "SRC"],
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <ModuleEditor type="notifications" title="Campanie / mesaj" fields={["title", "body", "channel", "status", "due_at", "target"]} rows={campaigns} defaults={{ channel: "email", status: "DRAFT" }} saving={saving} saveModule={saveModule} deleteModule={deleteModule} />
        <ActionPanel title="Landing / CMS" fields={["slug", "title", "type", "status", "body"]} defaults={{ type: "landing", status: "DRAFT" }} saving={saving === "cms"} onSubmit={(payload) => platformAction("cms", { type: "cms", payload }, "Continut salvat.")} />
      </div>
      <Panel tight><Table heads={["Outbox", "Canal", "Status", "Target"]} rows={outbox} empty="Nu exista mesaje in outbox." render={(row: Row) => <tr key={row.id || row.subject} className="border-t border-bg-surface"><Td>{row.subject || row.title}</Td><Td>{row.channel || "email"}</Td><Td><StatusBadge status={row.status || "QUEUED"} /></Td><Td>{row.target || row.client_email || "-"}</Td></tr>} /></Panel>
    </div>
  )
}

export function ComplianceView({ filtered, platform, saving, platformAction, setView }: any) {
  const audit = asRows(filtered.audit)
  const roles = asRows(filtered.roles)
  const docs = [...asRows(filtered.documents), ...asRows(filtered.clientDocuments)]
  const outbox = asRows(filtered.outbox)
  const checks = [
    ["Role-based access", roles.length ? "Configured" : "Needs roles", "Users must have scoped permissions, not shared admin access."],
    ["Fair housing review", "Manual gate", "Marketing and listing copy should describe property features, not protected classes."],
    ["Customer data safeguards", docs.length ? "Documents tracked" : "Needs document inventory", "Sensitive client files need retention, expiry, and review status."],
    ["Audit trail", audit.length ? `${audit.length} events` : "No events", "Important admin actions should produce audit records."],
    ["Notification review", outbox.filter((row) => row.status !== "SENT").length ? "Queued messages" : "Clear", "Outbound housing communication should be reviewable."],
  ]
  return (
    <div className="space-y-6">
      <Title
        title="Compliance and security"
        subtitle="RBAC, audit trail, fair-housing review, customer-data controls and operational safeguards."
        action={<Button disabled={saving === "audit"} onClick={() => platformAction("audit", { type: "audit_event", payload: { action: "COMPLIANCE_REVIEW", entity: "admin", details: { source: "compliance_view" } } }, "Compliance review logged.")}>Log review</Button>}
      />
      <Kpis cards={[
        ["Admin role", platform?._admin?.role || "unknown", "current session", "ID"],
        ["Permissions", Array.isArray(platform?._admin?.permissions) ? platform._admin.permissions.length : 0, "scoped access", "P"],
        ["Audit events", audit.length, "traceability", "AUD"],
        ["Docs needing review", docs.filter((row) => !["APPROVED", "SIGNED", "VALID"].includes(String(row.status || ""))).length, "risk queue", "RISK"],
      ]} />
      <div className="grid gap-4 xl:grid-cols-2">
        {checks.map(([title, state, body]) => (
          <Panel key={title}>
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-text-muted">{body}</p></div>
              <Badge>{state}</Badge>
            </div>
          </Panel>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel><Title compact title="Fast controls" /><div className="space-y-2"><Button className="w-full" variant="ghost" onClick={() => setView("users")}>Review roles</Button><Button className="w-full" variant="ghost" onClick={() => setView("audit")}>Open audit</Button><Button className="w-full" variant="ghost" onClick={() => setView("documents")}>Review documents</Button></div></Panel>
        <Panel className="xl:col-span-2"><BarList title="Audit by action" data={countBy(audit, "action")} /></Panel>
      </div>
    </div>
  )
}
