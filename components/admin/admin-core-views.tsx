"use client"

import { useState } from "react"
import { appointmentStatuses, countBy, date, leadStatuses, money, propertyStatuses, propertyTypes, slugify, type Row } from "./admin-shared"
import { Badge, BarList, Button, Empty, Field, Grid, Kpis, MiniRow, Panel, Recent, Select, SelectField, Table, Td, Title } from "./admin-ui"

export function Overview({ core, modules, platform, report, metrics, setView, exportServer, saving }: any) {
  const pendingListings = core.properties.filter((row: Row) => row.status !== "PUBLISHED").slice(0, 6)
  const todayTours = core.appointments
    .filter((row: Row) => ["REQUESTED", "CONFIRMED"].includes(String(row.status || "")))
    .slice(0, 6)
  const maintenance = modules.activities
    .filter((row: Row) => [row.entity, row.type, row.category, row.title].some((value) => String(value || "").toLowerCase().includes("maintenance")))
    .slice(0, 5)
  const documents = [...modules.documents, ...(platform.client_documents || [])]
  const pendingDocuments = documents.filter((row: Row) => !["APPROVED", "SIGNED", "VALID"].includes(String(row.status || ""))).slice(0, 5)
  const offers = platform.property_offers || []

  return (
    <div className="space-y-6">
      <Kpis cards={[
        ["Total listings", core.properties.length, `${metrics.published.length} live`, "INV"],
        ["Occupancy / closed", `${metrics.occupancyRate}%`, `${metrics.occupied.length} sold/rented`, "OCC"],
        ["Active leads", metrics.activeLeads.length, `${core.leads.length} total CRM`, "CRM"],
        ["Scheduled tours", metrics.scheduledTours.length, "requested + confirmed", "CAL"],
        ["Pending contracts", metrics.pendingContracts.length, `${documents.length} documents`, "DOC"],
        ["Monthly revenue", money(metrics.monthlyRevenue), "payments + advances", "REV"],
        ["Offer pipeline", money(metrics.pipeline), `${offers.length} offers`, "PIPE"],
        ["Maintenance", maintenance.length, "open queue", "MNT"],
      ]} />
      <Panel className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
        <div className="relative grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="max-w-3xl">
            <p className="text-sm font-black text-accent">Real estate operating system</p>
            <h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">Admin complet pentru inventar, clienti, tranzactii si operatiuni.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-text-muted">Dashboard-ul centralizeaza proprietati, listinguri, leaduri, tururi, oferte, contracte, plati, mentenanta, documente, marketing, rapoarte, roluri si audit.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => setView("listings")}>Approve listing</Button>
              <Button variant="ghost" onClick={() => setView("crm")}>Assign lead</Button>
              <Button variant="ghost" onClick={() => setView("documents")}>Upload contract</Button>
              <Button variant="ghost" disabled={saving === "export-json"} onClick={() => exportServer("json")}>Export report</Button>
            </div>
          </div>
          <div className="rounded-xl border border-bg-surface bg-bg-secondary/80 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black">Market map</h3>
              <Badge>{core.properties.length} assets</Badge>
            </div>
            <div className="mt-4 grid h-56 grid-cols-6 grid-rows-5 gap-2">
              {["Pipera", "Floreasca", "Aviatiei", "Corbeanca", "Baneasa", "Herastrau"].map((zone, index) => (
                <button key={zone} type="button" onClick={() => setView("properties")} className={`rounded-lg border border-bg-surface p-2 text-left text-xs font-black transition hover:border-accent ${index % 3 === 0 ? "col-span-3 row-span-2 bg-accent/15 text-accent" : index % 2 === 0 ? "col-span-2 bg-bg-card" : "col-span-3 bg-bg-card"}`}>
                  {zone}
                  <span className="mt-1 block text-[10px] font-bold text-text-muted">{core.properties.filter((row: Row) => String(row.city || "").toLowerCase().includes(zone.toLowerCase())).length || index + 1} listings</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-4">
        <Recent title="Recent inquiries" rows={core.leads.slice(0, 5)} render={(row: Row) => <MiniRow key={row.id} title={row.name || row.phone || "Lead"} meta={row.phone || row.email || "-"} value={row.status} />} />
        <Recent title="Pending approvals" rows={pendingListings} render={(row: Row) => <MiniRow key={row.id} title={row.title} meta={row.city || row.type} value={row.status} />} />
        <Recent title="Today's tours" rows={todayTours} render={(row: Row) => <MiniRow key={row.id} title={row.client_name || "Vizionare"} meta={row.property_title || row.client_phone || "-"} value={date(row.requested_at, true)} />} />
        <Recent title="Documents" rows={pendingDocuments} render={(row: Row) => <MiniRow key={row.id || row.title} title={row.title || row.type || "Document"} meta={row.client_email || row.property || "-"} value={row.status || "PENDING"} />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel><BarList title="Funnel leaduri" data={report.funnel || countBy(core.leads, "status")} /></Panel>
        <Panel><BarList title="Oferte si tranzactii" data={report.offerFlow || countBy(offers, "status")} /></Panel>
        <Panel><BarList title="Inventar pe oras" data={report.cityInventory || countBy(core.properties, "city")} /></Panel>
        <Recent title="Maintenance queue" rows={maintenance} render={(row: Row) => <MiniRow key={row.id || row.title} title={row.title} meta={row.priority || row.entity || "MAINTENANCE"} value={row.status || "OPEN"} />} />
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
