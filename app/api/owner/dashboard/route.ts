import { getAdminClientIfConfigured, jsonError } from "@/lib/admin-api"
import { requireClient } from "@/lib/client-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const session = await requireClient(request)
    if ("error" in session) return NextResponse.json({ error: "Autentificare proprietar necesara" }, { status: 401 })
    const email = String(session.user.email || "").toLowerCase()
    const supabase = session.supabase
    const [properties, reports, docs] = await Promise.all([
      supabase.from("properties").select("id,title,slug,status,price,currency,city,updated_at,published_at,featured,cover_image_url").eq("owner_email", email).order("updated_at", { ascending: false }),
      supabase.from("owner_reports").select("*").eq("owner_email", email).order("created_at", { ascending: false }),
      supabase.from("admin_document_versions").select("*").eq("signer_email", email).order("created_at", { ascending: false }),
    ])
    const firstError = [properties.error, reports.error, docs.error].find(Boolean)
    if (firstError) return jsonError(firstError.message, 400)

    const propertyRows = Array.isArray(properties.data) ? properties.data : []
    const propertyIds = propertyRows.map((property: any) => property.id).filter(Boolean)
    const analyticsClient = getAdminClientIfConfigured() || supabase
    const [leads, appointments, offers, attribution] = propertyIds.length
      ? await Promise.all([
        analyticsClient.from("leads").select("id,property_id,status,source,score,budget,created_at,updated_at").in("property_id", propertyIds).order("created_at", { ascending: false }),
        analyticsClient.from("appointments").select("id,property_id,status,requested_at,start_at,end_at,agent_email,created_at").in("property_id", propertyIds).order("created_at", { ascending: false }),
        analyticsClient.from("property_offers").select("id,property_id,status,offer_price,counter_offer,created_at,updated_at").in("property_id", propertyIds).order("created_at", { ascending: false }),
        analyticsClient.from("analytics_attribution").select("id,property_id,source,campaign,value,created_at").in("property_id", propertyIds).order("created_at", { ascending: false }),
      ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

    const leadRows = leads.error ? [] : Array.isArray(leads.data) ? leads.data : []
    const appointmentRows = appointments.error ? [] : Array.isArray(appointments.data) ? appointments.data : []
    const offerRows = offers.error ? [] : Array.isArray(offers.data) ? offers.data : []
    const attributionRows = attribution.error ? [] : Array.isArray(attribution.data) ? attribution.data : []
    const property_metrics = propertyRows.map((property: any) => {
      const id = property.id
      const propertyLeads = leadRows.filter((row: any) => row.property_id === id)
      const propertyTours = appointmentRows.filter((row: any) => row.property_id === id)
      const propertyOffers = offerRows.filter((row: any) => row.property_id === id)
      const propertyAttribution = attributionRows.filter((row: any) => row.property_id === id)
      return {
        property_id: id,
        title: property.title,
        leads: propertyLeads.length,
        tours: propertyTours.length,
        offers: propertyOffers.length,
        attribution_events: propertyAttribution.length,
        active_tours: propertyTours.filter((row: any) => ["REQUESTED", "CONFIRMED"].includes(String(row.status || ""))).length,
        offer_pipeline: propertyOffers.reduce((sum: number, row: any) => sum + Number(row.counter_offer || row.offer_price || 0), 0),
        sources: Array.from(new Set(propertyAttribution.map((row: any) => row.source).filter(Boolean))),
      }
    })

    return NextResponse.json({
      owner: { id: session.user.id, email },
      properties: propertyRows,
      reports: reports.data || [],
      documents: docs.data || [],
      leads: leadRows,
      appointments: appointmentRows,
      offers: offerRows,
      attribution: attributionRows,
      property_metrics,
      totals: {
        properties: propertyRows.length,
        leads: leadRows.length,
        appointments: appointmentRows.length,
        offers: offerRows.length,
        attribution_events: attributionRows.length,
        offer_pipeline: offerRows.reduce((sum: number, row: any) => sum + Number(row.counter_offer || row.offer_price || 0), 0),
      },
    })
  } catch (error: any) {
    return jsonError(error.message || "Owner dashboard failed")
  }
}
