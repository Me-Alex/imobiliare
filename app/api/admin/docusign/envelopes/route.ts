import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { createDocuSignEnvelope } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "documents")
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => ({}))
  try {
    const envelope = await createDocuSignEnvelope({ signerEmail: body.signer_email || body.email, signerName: body.signer_name || body.name || "Client HQS", subject: body.subject || body.title || "Contract HQS", documentHtml: body.document_html || body.body, returnUrl: body.return_url })
    const { data } = await auth.supabase.from("admin_document_versions").insert({ title: body.title || body.subject || "Document HQS", property_id: body.property_id || null, docusign_envelope_id: envelope.envelopeId, status: envelope.status || "SENT", signer_email: body.signer_email || body.email, signer_name: body.signer_name || body.name, metadata: envelope, created_by: auth.session.actor }).select("*").single()
    await auth.supabase.from("admin_provider_jobs").insert({ provider: "docusign", action: "create_envelope", status: "SENT", target: body.signer_email || body.email, entity: "admin_document_versions", entity_id: data?.id || null, request: body, response: envelope, provider_event_id: envelope.envelopeId, created_by: auth.session.actor, attempts: 1 })
    return NextResponse.json({ envelope, document: data })
  } catch (error: any) {
    await auth.supabase.from("admin_provider_jobs").insert({ provider: "docusign", action: "create_envelope", status: error?.name === "IntegrationConfigError" ? "FAILED_CONFIG" : "FAILED_PROVIDER", target: body.signer_email || body.email, request: body, response: {}, error: error?.message, created_by: auth.session.actor, attempts: 1 })
    return jsonError(error.message || "DocuSign envelope failed", error?.name === "IntegrationConfigError" ? 400 : 502)
  }
}
