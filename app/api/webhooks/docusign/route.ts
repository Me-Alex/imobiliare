import { getAdminClient, jsonError } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}))
    const eventId = String(payload.envelopeId || payload.data?.envelopeId || payload.eventId || crypto.randomUUID())
    const eventType = String(payload.event || payload.status || payload.data?.status || "docusign_event")
    await getAdminClient().from("admin_provider_events").upsert({ provider: "docusign", event_id: eventId, event_type: eventType, payload }, { onConflict: "provider,event_id" })
    await getAdminClient().from("admin_document_versions").update({ status: eventType.toUpperCase(), metadata: payload, updated_at: new Date().toISOString() }).eq("docusign_envelope_id", eventId)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return jsonError(error.message || "DocuSign webhook failed", 400)
  }
}
