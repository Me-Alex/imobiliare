import { getAdminClientIfConfigured, jsonError } from "@/lib/admin-api"
import { verifyResendWebhook, webhookVerificationError } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    const verified = await verifyResendWebhook(raw, request.headers)
    if (!verified.ok) return jsonError(webhookVerificationError(verified, "Resend"), verified.configured ? 400 : 503)
    const supabase = getAdminClientIfConfigured()
    if (!supabase) return jsonError("Webhook storage unavailable: SUPABASE_SERVICE_ROLE_KEY is missing", 503)
    const payload = raw ? JSON.parse(raw) : {}
    const eventId = String(payload.id || payload.data?.id || crypto.randomUUID())
    const eventType = String(payload.type || payload.event || "resend_event")
    await supabase.from("admin_provider_events").upsert({ provider: "resend", event_id: eventId, event_type: eventType, payload }, { onConflict: "provider,event_id" })
    await supabase.from("admin_provider_jobs").update({ status: normalizeResendStatus(eventType), response: payload, updated_at: new Date().toISOString() }).eq("provider", "resend").eq("provider_event_id", eventId)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return jsonError(error.message || "Resend webhook failed", 400)
  }
}

function normalizeResendStatus(type: string) {
  const value = type.toLowerCase()
  if (value.includes("delivered") || value.includes("sent")) return "SENT"
  if (value.includes("bounced") || value.includes("complained") || value.includes("failed")) return "FAILED_PROVIDER"
  if (value.includes("cancel")) return "CANCELLED"
  return "RETRYING"
}
