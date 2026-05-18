"use client"

import { useState } from "react"
import { buildPropertyPublishChecklist } from "@/lib/admin-workflows"
import { appointmentStatuses, confirmRisk, countBy, date, leadStatuses, money, propertyStatuses, propertyTypes, slugify, type Row } from "./admin-shared"
import { Area, Badge, BarList, Button, Empty, Field, Grid, Kpis, MiniRow, Panel, Recent, Select, SelectField, Table, Td, Title } from "./admin-ui"

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
  const blank: Row = { title: "", slug: "", description: "", type: "APARTMENT", transaction_type: "sale", status: "DRAFT", price: 150000, currency: "EUR", city: "Bucuresti", county: "Bucuresti", address: "", area_sqm: 70, rooms: 3, bathrooms: 1, parking_spots: 0, floor: "", year_built: "", amenities: "", cover_image_url: "", gallery_urls: "", floorplan_urls: "", meta_title: "", meta_description: "", owner_email: "", agent_email: "", featured: false }
  const [draft, setDraft] = useState<Row>(blank)
  const publishChecklist = buildPropertyPublishChecklist(draft, filtered.media || [])
  const savePayload = {
    ...draft,
    price: Number(draft.price || 0),
    area_sqm: Number(draft.area_sqm || 0),
    rooms: Number(draft.rooms || 0),
    bathrooms: Number(draft.bathrooms || 0),
    parking_spots: Number(draft.parking_spots || 0),
    floor: draft.floor === "" ? null : Number(draft.floor || 0),
    year_built: draft.year_built === "" ? null : Number(draft.year_built || 0),
    slug: draft.slug || slugify(draft.title),
    amenities: String(draft.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
    gallery_urls: String(draft.gallery_urls || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
    floorplan_urls: String(draft.floorplan_urls || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
  }
  const propertySaving = draft.id ? saving === `property-${draft.id}` : saving === "create-property"
  const saveCurrent = (payload: Row) => draft.id ? patchProperty(draft, payload) : createProperty(payload)
  const publishStatus = (property: Row, status: string) => {
    if (status === "PUBLISHED") {
      const checklist = buildPropertyPublishChecklist(property, filtered.media || [])
      if (!checklist.ready && !confirmRisk(`Publici "${property.title || property.slug || property.id}" cu checklist incomplet (${checklist.passed}/${checklist.total})? Recomandat este sa repari criteriile lipsa inainte.`)) return
    }
    patchProperty(property, { status })
  }
  const edit = (row: Row) => setDraft({
    ...blank,
    ...row,
    amenities: Array.isArray(row.amenities) ? row.amenities.join(", ") : row.amenities || "",
    gallery_urls: Array.isArray(row.gallery_urls) ? row.gallery_urls.join("\n") : row.gallery_urls || "",
    floorplan_urls: Array.isArray(row.floorplan_urls) ? row.floorplan_urls.join("\n") : row.floorplan_urls || "",
    transaction_type: row.transaction_type || row.transaction || "sale",
    area_sqm: row.area_sqm || row.surface || "",
    bathrooms: row.bathrooms || row.baths || "",
  })
  return (
    <div className="space-y-6">
      <Title title="Proprietati" subtitle="Editor complet pentru listing, media URLs, SEO, proprietar, agent si publicare." />
      <Panel tight>
        <Table heads={["Proprietate", "Pret", "Status", "Featured", "Actiuni"]} rows={filtered.properties} empty="Nu exista proprietati." render={(row: Row) => (
          <tr key={row.id} className="border-t border-bg-surface">
            <Td><p className="font-black">{row.title}</p><p className="text-xs text-text-muted">{row.city} / {row.type} / {row.area_sqm} mp</p></Td>
            <Td>{money(row.price, row.currency || "EUR")}</Td>
            <Td><Select value={row.status || "DRAFT"} onChange={(value) => publishStatus(row, value)} disabled={saving === `property-${row.id}`}>{propertyStatuses.map((status) => <option key={status}>{status}</option>)}</Select></Td>
            <Td><Button size="sm" variant="ghost" onClick={() => patchProperty(row, { featured: !row.featured })}>{row.featured ? "Scoate" : "Featured"}</Button></Td>
            <Td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => edit(row)}>Edit</Button><Button size="sm" variant="danger" disabled={saving === `delete-${row.id}`} onClick={() => deleteProperty(row)}>Sterge</Button></div></Td>
          </tr>
        )} />
      </Panel>
      <Panel>
        <Title compact title={draft.id ? "Editare proprietate" : "Proprietate noua"} subtitle="Campurile media pot fi completate manual sau generate prin upload in sectiunea Media." />
        <div className="mb-5 rounded-lg border border-bg-surface bg-bg-secondary p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><p className="font-black">Publish checklist</p><p className="text-sm text-text-muted">{publishChecklist.passed}/{publishChecklist.total} criterii completate. Scor {publishChecklist.score}%.</p></div>
            <Badge>{publishChecklist.ready ? "READY" : "NEEDS WORK"}</Badge>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {publishChecklist.checks.map((item) => <div key={item.id} className={`rounded-lg border p-3 text-xs ${item.ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}><p className="font-black">{item.ok ? "OK" : "Fix"}: {item.label}</p>{!item.ok && <p className="mt-1 text-text-muted">{item.fix}</p>}</div>)}
          </div>
          {draft.status === "PUBLISHED" && !publishChecklist.ready && <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-bold text-amber-600">Publishing is blocked until the checklist is ready. Save as draft or complete the missing items first.</p>}
        </div>
        <Grid columns={4}>
          {["title", "slug", "price", "currency", "transaction_type", "city", "county", "address", "area_sqm", "rooms", "bathrooms", "parking_spots", "floor", "year_built", "owner_email", "agent_email", "cover_image_url", "meta_title"].map((key) => <Field key={key} label={key} value={String(draft[key] || "")} onChange={(value) => setDraft({ ...draft, [key]: value })} />)}
          <SelectField label="type" value={draft.type} onChange={(value) => setDraft({ ...draft, type: value })}>{propertyTypes.map((item) => <option key={item}>{item}</option>)}</SelectField>
          <SelectField label="status" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })}>{propertyStatuses.map((item) => <option key={item}>{item}</option>)}</SelectField>
        </Grid>
        <Area label="description" value={String(draft.description || "")} onChange={(value) => setDraft({ ...draft, description: value })} />
        <Area label="amenities CSV" value={String(draft.amenities || "")} onChange={(value) => setDraft({ ...draft, amenities: value })} />
        <Area label="gallery_urls (one per line)" value={String(draft.gallery_urls || "")} onChange={(value) => setDraft({ ...draft, gallery_urls: value })} />
        <Area label="floorplan_urls (one per line)" value={String(draft.floorplan_urls || "")} onChange={(value) => setDraft({ ...draft, floorplan_urls: value })} />
        <Area label="meta_description" value={String(draft.meta_description || "")} onChange={(value) => setDraft({ ...draft, meta_description: value })} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={!draft.title || propertySaving || (draft.status === "PUBLISHED" && !publishChecklist.ready)} onClick={() => saveCurrent(savePayload)}>{draft.id ? "Save current form" : "Create property"}</Button>
          <Button variant="ghost" disabled={!draft.title || propertySaving} onClick={() => saveCurrent({ ...savePayload, status: "DRAFT" })}>Save draft</Button>
          <Button disabled={!draft.title || !publishChecklist.ready || propertySaving} onClick={() => saveCurrent({ ...savePayload, status: "PUBLISHED" })}>Publish when ready</Button>
          <Button variant="ghost" onClick={() => setDraft(blank)}>Reset form</Button>
        </div>
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
