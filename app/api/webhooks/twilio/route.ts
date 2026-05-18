import { getAdminClientIfConfigured, jsonError } from "@/lib/admin-api"
import { verifyTwilioWebhook, webhookVerificationError } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const text = await request.text()
    const form = new URLSearchParams(text)
    const payload = Object.fromEntries(form.entries())
    const verified = await verifyTwilioWebhook(request.url, payload, request.headers.get("x-twilio-signature"))
    if (!verified.ok) return jsonError(webhookVerificationError(verified, "Twilio"), verified.configured ? 400 : 503)
    const supabase = getAdminClientIfConfigured()
    if (!supabase) return jsonError("Webhook storage unavailable: SUPABASE_SERVICE_ROLE_KEY is missing", 503)
    const sid = String(payload.MessageSid || payload.SmsSid || crypto.randomUUID())
    const status = String(payload.MessageStatus || payload.SmsStatus || "received")
    await supabase.from("admin_provider_events").upsert({ provider: "twilio", event_id: sid, event_type: status, payload }, { onConflict: "provider,event_id" })
    await supabase.from("admin_provider_jobs").update({ status: normalizeTwilioStatus(status), response: payload, updated_at: new Date().toISOString() }).eq("provider", "twilio").eq("provider_event_id", sid)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return jsonError(error.message || "Twilio webhook failed", 400)
  }
}

function normalizeTwilioStatus(status: string) {
  const value = status.toLowerCase()
  if (["delivered", "sent"].includes(value)) return "SENT"
  if (["failed", "undelivered"].includes(value)) return "FAILED_PROVIDER"
  if (["canceled", "cancelled"].includes(value)) return "CANCELLED"
  return "RETRYING"
}
