import { getAdminClient, jsonError } from "@/lib/admin-api"
import { requireDocusignWebhookSignature } from "@/lib/webhook-security"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signatureError = await requireDocusignWebhookSignature(request, rawBody)
    if (signatureError) return signatureError
    const payload = rawBody ? JSON.parse(rawBody) : {}
    const eventId = String(payload.envelopeId || payload.data?.envelopeId || payload.eventId || crypto.randomUUID())
    const eventType = String(payload.event || payload.status || payload.data?.status || "docusign_event")
    await getAdminClient().from("admin_provider_events").upsert({ provider: "docusign", event_id: eventId, event_type: eventType, payload }, { onConflict: "provider,event_id" })
    await getAdminClient().from("admin_document_versions").update({ status: eventType.toUpperCase(), metadata: payload, updated_at: new Date().toISOString() }).eq("docusign_envelope_id", eventId)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return jsonError(error.message || "DocuSign webhook failed", 400)
  }
}
