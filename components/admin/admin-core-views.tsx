"use client"

import { useState } from "react"
import { appointmentStatuses, countBy, date, leadStatuses, money, propertyStatuses, propertyTypes, slugify, type Row } from "./admin-shared"
import { Badge, BarList, Button, Empty, Field, Grid, Kpis, MiniRow, Panel, Recent, Select, SelectField, Table, Td, Title } from "./admin-ui"

export function Overview({ core, modules, platform, report, metrics, setView, exportServer, saving }: any) {
  return (
    <div className="space-y-6">
      <Kpis cards={[
        ["Portofoliu public", metrics.published.length, money(metrics.portfolio), "P"],
        ["Leaduri active", metrics.activeLeads.length, `${core.leads.length} total CRM`, "L"],
        ["Pipeline oferte", money(metrics.pipeline), `${(platform.property_offers || []).length} oferte`, "O"],
        ["Tasks deschise", modules.activities.length, `${modules.documents.length} documente`, "T"],
      ]} />
      <Panel>
        <div className="max-w-3xl">
          <p className="text-sm font-black text-accent">Control operational complet</p>
          <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">Command center pentru vanzari, portofoliu si operatiuni.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-text-muted">Toate modulele admin sunt intr-un singur flux: CRM, proprietati, programari, documente, notificari, continut, utilizatori, rapoarte si audit.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setView("crm")}>Deschide CRM</Button>
            <Button variant="ghost" onClick={() => setView("properties")}>Portofoliu</Button>
            <Button variant="ghost" disabled={saving === "export-json"} onClick={() => exportServer("json")}>Export server</Button>
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-3">
        <Recent title="Leaduri" rows={core.leads.slice(0, 5)} render={(row: Row) => <MiniRow key={row.id} title={row.name || row.phone || "Lead"} meta={row.phone || row.email || "-"} value={row.status} />} />
        <Recent title="Proprietati" rows={core.properties.slice(0, 5)} render={(row: Row) => <MiniRow key={row.id} title={row.title} meta={row.city || row.type} value={money(row.price, row.currency || "EUR")} />} />
        <Recent title="Programari" rows={core.appointments.slice(0, 5)} render={(row: Row) => <MiniRow key={row.id} title={row.client_name} meta={row.property_title || row.client_phone || "-"} value={date(row.requested_at)} />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel><BarList title="Funnel leaduri" data={report.funnel || countBy(core.leads, "status")} /></Panel>
        <Panel><BarList title="Inventar pe oras" data={report.cityInventory || countBy(core.properties, "city")} /></Panel>
      </div>
    </div>
  )
}

export function CrmView({ filtered, saving, patchLead, followUp, platformAction }: any) {
  const [client, setClient] = useState<Row>({ full_name: "", email: "", phone: "", budget: 250000, purpose: "locuire", status: "ACTIVE" })
  return (
    <div className="space-y-6">
      <Title title="CRM si clienti" subtitle="Leaduri, scoring, follow-up si profiluri de clienti." />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel tight>
          <Table heads={["Client", "Status", "Scor", "Urmatorul pas", "Actiuni"]} rows={filtered.leads} empty="Nu exista leaduri." render={(lead: Row) => (
            <tr key={lead.id} className="border-t border-bg-surface">
              <Td><p className="font-black">{lead.name || "Lead fara nume"}</p><p className="text-xs text-text-muted">{lead.phone || lead.email || "-"}</p></Td>
              <Td><Select value={lead.status || "NEW"} onChange={(value) => patchLead(lead, value)} disabled={saving === `lead-${lead.id}`}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</Select></Td>
              <Td><Badge>{lead.score ?? 0}</Badge></Td>
              <Td>{lead.next_follow_up ? date(lead.next_follow_up, true) : lead.message || "-"}</Td>
              <Td><Button size="sm" variant="ghost" disabled={saving === `follow-${lead.id}`} onClick={() => followUp(lead)}>Follow-up</Button></Td>
            </tr>
          )} />
        </Panel>
        <Panel>
          <Title compact title="Profil client" subtitle="Creeaza sau actualizeaza profilul clientului." />
          <Grid columns={1}>{["full_name", "email", "phone", "budget", "purpose", "status"].map((key) => <Field key={key} label={key} value={String(client[key] || "")} onChange={(value) => setClient({ ...client, [key]: value })} />)}</Grid>
        <Button className="mt-4 w-full" disabled={!client.full_name || saving === "client-profile"} onClick={() => platformAction("client-profile", { type: "client_profile", payload: { ...client, budget: Number(client.budget || 0) } }, "Profil client salvat.")}>Salveaza profil</Button>
        </Panel>
      </div>
      <Panel tight>
        <Table heads={["Profil", "Preferinte", "Status", "Creat"]} rows={filtered.clients} empty="Nu exista profiluri client." render={(row: Row) => (
          <tr key={row.id || row.email} className="border-t border-bg-surface"><Td><p className="font-black">{row.full_name || row.name || "Client"}</p><p className="text-xs text-text-muted">{row.email || row.phone || "-"}</p></Td><Td>{money(row.budget || row.max_budget || 0)} / {row.purpose || "-"}</Td><Td><Badge>{row.status || "ACTIVE"}</Badge></Td><Td>{date(row.created_at)}</Td></tr>
        )} />
      </Panel>
    </div>
  )
}

export function PropertiesView({ filtered, saving, patchProperty, deleteProperty, createProperty }: any) {
  const [draft, setDraft] = useState<Row>({ title: "", type: "APARTMENT", status: "DRAFT", price: 150000, currency: "EUR", city: "Bucuresti", area_sqm: 70, rooms: 3, featured: false })
  return (
    <div className="space-y-6">
      <Title title="Proprietati" subtitle="Portofoliu, publicare, featured si creare proprietati." />
      <Panel tight>
        <Table heads={["Proprietate", "Pret", "Status", "Featured", "Actiuni"]} rows={filtered.properties} empty="Nu exista proprietati." render={(row: Row) => (
          <tr key={row.id} className="border-t border-bg-surface">
            <Td><p className="font-black">{row.title}</p><p className="text-xs text-text-muted">{row.city} / {row.type} / {row.area_sqm} mp</p></Td>
            <Td>{money(row.price, row.currency || "EUR")}</Td>
            <Td><Select value={row.status || "DRAFT"} onChange={(value) => patchProperty(row, { status: value })} disabled={saving === `property-${row.id}`}>{propertyStatuses.map((status) => <option key={status}>{status}</option>)}</Select></Td>
            <Td><Button size="sm" variant="ghost" onClick={() => patchProperty(row, { featured: !row.featured })}>{row.featured ? "Scoate" : "Featured"}</Button></Td>
            <Td><Button size="sm" variant="danger" disabled={saving === `delete-${row.id}`} onClick={() => deleteProperty(row)}>Sterge</Button></Td>
          </tr>
        )} />
      </Panel>
      <Panel>
        <Title compact title="Proprietate noua" subtitle="Creare rapida cu toate campurile principale." />
        <Grid columns={4}>
          {["title", "price", "currency", "city", "area_sqm", "rooms", "address", "slug"].map((key) => <Field key={key} label={key} value={String(draft[key] || "")} onChange={(value) => setDraft({ ...draft, [key]: value })} />)}
          <SelectField label="type" value={draft.type} onChange={(value) => setDraft({ ...draft, type: value })}>{propertyTypes.map((item) => <option key={item}>{item}</option>)}</SelectField>
          <SelectField label="status" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })}>{propertyStatuses.map((item) => <option key={item}>{item}</option>)}</SelectField>
        </Grid>
        <Button className="mt-4" disabled={!draft.title || saving === "create-property"} onClick={() => createProperty({ ...draft, price: Number(draft.price || 0), area_sqm: Number(draft.area_sqm || 0), rooms: Number(draft.rooms || 0), slug: draft.slug || slugify(draft.title) })}>Creeaza proprietate</Button>
      </Panel>
    </div>
  )
}

export function AppointmentsView({ filtered, saving, patchAppointment, platformAction }: any) {
  const [slot, setSlot] = useState<Row>({ starts_at: "", ends_at: "", agent_email: "", capacity: 1, status: "OPEN" })
  return (
    <div className="space-y-6">
      <Title title="Programari" subtitle="Cereri de vizionare, statusuri si sloturi disponibile." />
      <Panel tight>
        <Table heads={["Client", "Proprietate", "Data", "Status", "Actiuni"]} rows={filtered.appointments} empty="Nu exista programari." render={(row: Row) => (
          <tr key={row.id} className="border-t border-bg-surface"><Td><p className="font-black">{row.client_name}</p><p className="text-xs text-text-muted">{row.client_phone || row.client_email || "-"}</p></Td><Td>{row.property_title || "-"}</Td><Td>{date(row.requested_at, true)}</Td><Td><Badge>{row.status || "REQUESTED"}</Badge></Td><Td><Select value={row.status || "REQUESTED"} onChange={(value) => patchAppointment(row, value)} disabled={saving === `appointment-${row.id}`}>{appointmentStatuses.map((item) => <option key={item}>{item}</option>)}</Select></Td></tr>
        )} />
      </Panel>
      <Panel>
        <Title compact title="Slot nou" subtitle="Adauga ferestre de vizionare pentru agenti." />
        <Grid columns={4}>{["starts_at", "ends_at", "agent_email", "capacity", "status"].map((key) => <Field key={key} label={key} value={String(slot[key] || "")} onChange={(value) => setSlot({ ...slot, [key]: value })} />)}</Grid>
        <Button className="mt-4" disabled={!slot.starts_at || saving === "slot"} onClick={() => platformAction("slot", { type: "appointment_slot", payload: { ...slot, capacity: Number(slot.capacity || 1) } }, "Slot salvat.")}>Salveaza slot</Button>
      </Panel>
      <Panel tight>
        <Table heads={["Slot", "Agent", "Capacitate", "Status"]} rows={filtered.slots} empty="Nu exista sloturi." render={(row: Row) => <tr key={row.id || row.starts_at} className="border-t border-bg-surface"><Td>{date(row.starts_at, true)} - {date(row.ends_at, true)}</Td><Td>{row.agent_email || "-"}</Td><Td>{row.capacity || 1}</Td><Td><Badge>{row.status || "OPEN"}</Badge></Td></tr>} />
      </Panel>
    </div>
  )
}
