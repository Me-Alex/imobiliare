import { getAdminClient, jsonError } from "@/lib/admin-api"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const sid = String(form.get("MessageSid") || form.get("SmsSid") || crypto.randomUUID())
    const status = String(form.get("MessageStatus") || form.get("SmsStatus") || "received")
    const payload = Object.fromEntries(form.entries())
    await getAdminClient().from("admin_provider_events").upsert({ provider: "twilio", event_id: sid, event_type: status, payload }, { onConflict: "provider,event_id" })
    await getAdminClient().from("admin_provider_jobs").update({ status: normalizeTwilioStatus(status), response: payload, updated_at: new Date().toISOString() }).eq("provider", "twilio").eq("provider_event_id", sid)
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
