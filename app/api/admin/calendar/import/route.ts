import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { IntegrationConfigError, listGoogleCalendarEvents } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

function asItems(value: unknown): Record<string, any>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, any> => Boolean(item) && typeof item === "object") : []
}

function eventStart(event: Record<string, any>) {
  return event.start?.dateTime || event.start?.date || null
}

function eventEnd(event: Record<string, any>) {
  return event.end?.dateTime || event.end?.date || null
}

function appointmentStatus(event: Record<string, any>) {
  return event.status === "cancelled" ? "CANCELLED" : "CONFIRMED"
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "calendar")
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => ({}))
  const timeMin = body.timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = body.timeMax || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()

  try {
    const calendar = await listGoogleCalendarEvents({
      timeMin,
      timeMax,
      maxResults: Number(body.maxResults || 100),
      syncToken: body.syncToken || undefined,
    })
    const events = asItems(calendar.items)
    let linkedAppointments = 0

    for (const event of events) {
      const providerEventId = String(event.id || "")
      if (!providerEventId) continue

      const existing = await auth.supabase
        .from("calendar_sync_events")
        .select("appointment_id")
        .eq("provider", "google")
        .eq("provider_event_id", providerEventId)
        .maybeSingle()

      const appointmentId = event.extendedProperties?.private?.appointment_id || existing.data?.appointment_id || null
      const syncRow = {
        appointment_id: appointmentId,
        provider: "google",
        provider_event_id: providerEventId,
        calendar_id: event.organizer?.email || event.creator?.email || null,
        status: event.status === "cancelled" ? "CANCELLED" : "IMPORTED",
        payload: { timeMin, timeMax, imported_from_google: true },
        response: event,
        created_by: auth.session.actor,
        updated_at: new Date().toISOString(),
      }

      await auth.supabase
        .from("calendar_sync_events")
        .upsert(syncRow, { onConflict: "provider,provider_event_id" })

      if (appointmentId) {
        const start = eventStart(event)
        const end = eventEnd(event)
        await auth.supabase
          .from("appointments")
          .update({
            status: appointmentStatus(event),
            start_at: start,
            end_at: end,
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
        linkedAppointments += 1
      }
    }

    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({
        actor: auth.session.actor,
        action: "GOOGLE_CALENDAR_IMPORTED",
        entity: "calendar_sync_events",
        entity_id: null,
        details: { imported: events.length, linkedAppointments, timeMin, timeMax },
        metadata: { imported: events.length, linkedAppointments, timeMin, timeMax },
      }),
    ])

    return NextResponse.json({
      imported: events.length,
      linkedAppointments,
      nextSyncToken: calendar.nextSyncToken || null,
    })
  } catch (error: any) {
    const status = error instanceof IntegrationConfigError || error?.name === "IntegrationConfigError" ? 400 : 502
    return jsonError(error?.message || "Calendar import failed", status)
  }
}
