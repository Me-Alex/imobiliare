type AnyRow = Record<string, any>

function asRows(value: unknown): AnyRow[] {
  return Array.isArray(value) ? value.filter((item): item is AnyRow => item && typeof item === "object") : []
}

function countBy(rows: AnyRow[], key: string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row?.[key] || "neclasificat")
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function sum(rows: AnyRow[], selector: (row: AnyRow) => number) {
  return rows.reduce((total, row) => total + selector(row), 0)
}

function recentRows(rows: AnyRow[], dateKey = "created_at", limit = 8) {
  return [...rows]
    .sort((a, b) => new Date(b?.[dateKey] || 0).getTime() - new Date(a?.[dateKey] || 0).getTime())
    .slice(0, limit)
}

export function buildExecutiveReport(input: Record<string, unknown>) {
  const leads = asRows(input.leads)
  const properties = asRows(input.properties)
  const appointments = asRows(input.appointments)
  const offers = asRows(input.property_offers)
  const documents = asRows(input.client_documents)
  const clients = asRows(input.client_profiles)
  const slots = asRows(input.appointment_slots)
  const outbox = asRows(input.admin_notification_outbox)
  const audit = asRows(input.admin_audit_log)
  const poi = asRows(input.zone_poi)

  const published = properties.filter((property) => property.status === "PUBLISHED")
  const activeLeads = leads.filter((lead) => !["CLOSED", "LOST"].includes(String(lead.status || "")))
  const acceptedOffers = offers.filter((offer) => ["ACCEPTED", "CLOSED"].includes(String(offer.status || "")))
  const blockedDocuments = documents.filter((doc) => !["APPROVED", "SIGNED"].includes(String(doc.status || "")))
  const availableSlots = slots.filter((slot) => slot.status === "AVAILABLE")
  const bookedSlots = slots.filter((slot) => slot.status === "BOOKED")

  const portfolioValue = sum(published, (property) => Number(property.price || 0))
  const averageTicket = published.length ? Math.round(portfolioValue / published.length) : 0
  const offerPipelineValue = sum(offers, (offer) => Number(offer.counter_offer || offer.offer_price || 0))
  const acceptedValue = sum(acceptedOffers, (offer) => Number(offer.counter_offer || offer.offer_price || 0))
  const conversionRate = offers.length ? Math.round((acceptedOffers.length / offers.length) * 100) : 0

  const sourceMix = countBy(leads, "source")
  const funnel = countBy(leads, "status")
  const offerFlow = countBy(offers, "status")
  const documentFlow = countBy(documents, "status")
  const appointmentFlow = countBy(appointments, "status")
  const cityInventory = countBy(published, "city")

  const zoneHeatmap = Object.entries(cityInventory)
    .map(([zone, total]) => {
      const zonePoi = poi.filter((item) => String(item.zone || "").toLowerCase().includes(zone.toLowerCase()))
      const avgPoiScore = zonePoi.length ? Math.round(sum(zonePoi, (item) => Number(item.score || 0)) / zonePoi.length) : 0
      const inventoryValue = sum(published.filter((property) => String(property.city || "") === zone), (property) => Number(property.price || 0))
      return { zone, total, inventoryValue, poi: zonePoi.length, avgPoiScore }
    })
    .sort((a, b) => b.inventoryValue - a.inventoryValue)

  const agentPerformance = Object.entries(countBy([...appointments, ...slots], "agent_email"))
    .filter(([agent]) => agent !== "neclasificat")
    .map(([agent, total]) => ({
      agent,
      total,
      confirmed: appointments.filter((item) => item.agent_email === agent && item.status === "CONFIRMED").length,
      availableSlots: slots.filter((item) => item.agent_email === agent && item.status === "AVAILABLE").length,
    }))
    .sort((a, b) => b.total - a.total)

  const risks = [
    blockedDocuments.length ? `${blockedDocuments.length} documente au nevoie de review sau aprobare` : "",
    outbox.filter((item) => item.status !== "SENT").length ? `${outbox.filter((item) => item.status !== "SENT").length} notificari sunt in outbox` : "",
    activeLeads.length && !appointments.length ? "lead-uri active fara programari inregistrate" : "",
    slots.length && availableSlots.length < Math.max(1, Math.round(slots.length * 0.2)) ? "capacitate redusa pentru vizionari disponibile" : "",
  ].filter(Boolean)

  const nextActions = [
    ...recentRows(blockedDocuments, "created_at", 3).map((doc) => ({
      priority: "high",
      area: "documente",
      title: `Verifica document: ${doc.title || doc.type || doc.id}`,
      target: doc.id,
    })),
    ...recentRows(activeLeads, "created_at", 3).map((lead) => ({
      priority: Number(lead.score || 0) >= 70 ? "high" : "medium",
      area: "crm",
      title: `Follow-up lead: ${lead.name || lead.email || lead.phone}`,
      target: lead.id,
    })),
    ...recentRows(offers.filter((offer) => ["SUBMITTED", "COUNTERED", "NEGOTIATION"].includes(String(offer.status || ""))), "updated_at", 3).map((offer) => ({
      priority: "high",
      area: "oferte",
      title: `Negociaza oferta: ${offer.property_title || offer.id}`,
      target: offer.id,
    })),
  ].slice(0, 8)

  return {
    generated_at: new Date().toISOString(),
    summary: {
      leads: leads.length,
      activeLeads: activeLeads.length,
      clients: clients.length,
      properties: properties.length,
      published: published.length,
      portfolioValue,
      averageTicket,
      offers: offers.length,
      acceptedOffers: acceptedOffers.length,
      offerPipelineValue,
      acceptedValue,
      conversionRate,
      appointments: appointments.length,
      availableSlots: availableSlots.length,
      bookedSlots: bookedSlots.length,
      blockedDocuments: blockedDocuments.length,
      outboxPending: outbox.filter((item) => item.status !== "SENT").length,
      auditEvents: audit.length,
    },
    funnel,
    sourceMix,
    offerFlow,
    documentFlow,
    appointmentFlow,
    cityInventory,
    zoneHeatmap,
    agentPerformance,
    risks,
    nextActions,
  }
}
