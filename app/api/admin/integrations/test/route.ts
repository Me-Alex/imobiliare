import { getAdminClient, jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { createDocuSignEnvelope, createGoogleCalendarEvent, createStripeInvoice, providerStatus, sendResendEmail, sendTwilioSms } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "integrations")
  if ("error" in auth) return auth.error
  return NextResponse.json({ providers: providerStatus() })
}

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "integrations")
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => ({}))
  const provider = String(body.provider || "")
  const target = String(body.target || body.email || body.phone || auth.session.email)
  try {
    let response: any
    if (provider === "resend") response = await sendResendEmail({ to: target, subject: "HQS Resend test", text: "Test email trimis din admin." })
    else if (provider === "twilio") response = await sendTwilioSms({ to: target, body: "HQS Twilio test din admin." })
    else if (provider === "google") response = await createGoogleCalendarEvent({ summary: "HQS Calendar test", description: "Test eveniment admin.", start: new Date(Date.now() + 3600000).toISOString(), end: new Date(Date.now() + 7200000).toISOString(), attendees: target.includes("@") ? [target] : [] })
    else if (provider === "docusign") response = await createDocuSignEnvelope({ signerEmail: target, signerName: body.name || "Client HQS", subject: "HQS DocuSign test", documentHtml: "<h1>HQS test</h1><p>Document de test.</p>" })
    else if (provider === "stripe") response = await createStripeInvoice({ clientEmail: target, clientName: body.name || "Client HQS", description: "HQS Stripe test", amount: Number(body.amount || 1), currency: "eur" })
    else return jsonError("Provider invalid", 400)
    await job(provider, "test", "SENT", target, { body }, response, auth.session.actor)
    return NextResponse.json({ provider, response })
  } catch (error: any) {
    await job(provider || "unknown", "test", error?.name === "IntegrationConfigError" ? "FAILED_CONFIG" : "FAILED_PROVIDER", target, { body }, {}, auth.session.actor, error?.message)
    return jsonError(error.message || "Provider test failed", error?.name === "IntegrationConfigError" ? 400 : 502)
  }
}

async function job(provider: string, action: string, status: string, target: string, request: any, response: any, actor: string, error?: string) {
  await getAdminClient().from("admin_provider_jobs").insert({ provider, action, status, target, request, response, error: error || null, provider_event_id: providerEventId(response), created_by: actor, attempts: 1, updated_at: new Date().toISOString() })
}

function providerEventId(response: any) {
  return response?.id || response?.sid || response?.envelopeId || response?.invoice?.id || response?.event?.id || null
}
