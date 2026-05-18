import { getAdminClientIfConfigured, jsonError } from "@/lib/admin-api"
import { verifyDocuSignWebhook, webhookVerificationError } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    const verified = await verifyDocuSignWebhook(raw, request.headers)
    if (!verified.ok) return jsonError(webhookVerificationError(verified, "DocuSign"), verified.configured ? 400 : 503)
    const supabase = getAdminClientIfConfigured()
    if (!supabase) return jsonError("Webhook storage unavailable: SUPABASE_SERVICE_ROLE_KEY is missing", 503)
    const payload = raw ? JSON.parse(raw) : {}
    const eventId = String(payload.envelopeId || payload.data?.envelopeId || payload.eventId || crypto.randomUUID())
    const eventType = String(payload.event || payload.status || payload.data?.status || "docusign_event")
    await supabase.from("admin_provider_events").upsert({ provider: "docusign", event_id: eventId, event_type: eventType, payload }, { onConflict: "provider,event_id" })
    await supabase.from("admin_document_versions").update({ status: eventType.toUpperCase(), metadata: payload, updated_at: new Date().toISOString() }).eq("docusign_envelope_id", eventId)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return jsonError(error.message || "DocuSign webhook failed", 400)
  }
}
