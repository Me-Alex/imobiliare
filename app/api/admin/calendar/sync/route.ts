import { getAdminClient, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { createGoogleCalendarEvent } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "calendar")
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => ({}))
  try {
    let payload = body
    if (body.appointment_id) {
      const { data, error } = await getAdminClient().from("appointments").select("*").eq("id", body.appointment_id).single()
      if (error) return jsonError(error.message, 400)
      payload = data
    }
    const start = payload.starts_at || payload.requested_at || payload.start
    const end = payload.ends_at || payload.end || new Date(new Date(start).getTime() + 3600000).toISOString()
    const event = await createGoogleCalendarEvent({
      summary: payload.summary || `Vizionare HQS: ${payload.property_title || payload.client_name || "client"}`,
      description: payload.notes || `Client: ${payload.client_name || payload.client_email || "-"}`,
      start,
      end,
      attendees: [payload.client_email, payload.agent_email].filter(Boolean),
      location: payload.address || payload.property_title || "HQS Imobiliare",
    })
    await getAdminClient().from("calendar_sync_events").insert({ appointment_id: payload.id || body.appointment_id || null, provider: "google", provider_event_id: event.id, calendar_id: event.organizer?.email || null, status: "SENT", payload, response: event, created_by: auth.session.actor })
    await getAdminClient().from("admin_provider_jobs").insert({ provider: "google", action: "calendar_sync", status: "SENT", entity: "appointments", entity_id: payload.id || body.appointment_id || null, request: payload, response: event, created_by: auth.session.actor, attempts: 1 })
    return NextResponse.json({ event })
  } catch (error: any) {
    await getAdminClient().from("admin_provider_jobs").insert({ provider: "google", action: "calendar_sync", status: error?.name === "IntegrationConfigError" ? "FAILED_CONFIG" : "FAILED_PROVIDER", request: body, response: {}, error: error?.message, created_by: auth.session.actor, attempts: 1 })
    return jsonError(error.message || "Calendar sync failed", error?.name === "IntegrationConfigError" ? 400 : 502)
  }
}
