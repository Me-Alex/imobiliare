import { optionalUuid } from "@/lib/admin-properties"

type AppointmentInput = Record<string, any>

function dateOrDefault(value: unknown, fallbackMs: number) {
  const parsed = value ? new Date(String(value)) : null
  if (parsed && Number.isFinite(parsed.getTime())) return parsed
  return new Date(Date.now() + fallbackMs)
}

export function normalizeAppointmentPayload(input: AppointmentInput) {
  const start = dateOrDefault(input.requested_at || input.starts_at || input.start_at || input.start, 86_400_000)
  const end = dateOrDefault(input.ends_at || input.end_at || input.end, 90_000_000)
  if (end.getTime() <= start.getTime()) end.setTime(start.getTime() + 3_600_000)

  return {
    client_name: input.client_name || input.name || "Client HQS",
    client_email: input.client_email || input.email || null,
    client_phone: input.client_phone || input.phone || null,
    requested_at: start.toISOString(),
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    notes: input.notes || null,
    status: input.status || "REQUESTED",
    property_id: optionalUuid(input.property_id),
    slot_id: optionalUuid(input.slot_id),
    agent_email: input.agent_email || null,
    reminder_at: input.reminder_at || null,
    updated_at: new Date().toISOString(),
  }
}
