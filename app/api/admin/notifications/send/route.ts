import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { sendResendEmail, sendTwilioSms } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "notifications")
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => ({}))
  const channel = String(body.channel || "EMAIL").toUpperCase()
  const target = String(body.target || "")
  try {
    const response = channel === "SMS"
      ? await sendTwilioSms({ to: target, body: body.body || body.subject || "HQS notification" })
      : await sendResendEmail({ to: target, subject: body.subject || "HQS notification", html: body.html, text: body.body })
    const { data } = await auth.supabase.from("admin_notification_outbox").insert({ channel, target, subject: body.subject || "HQS notification", body: body.body || body.html || "", status: "SENT", sent_at: new Date().toISOString(), entity: body.entity || null, entity_id: body.entity_id || null, metadata: response, created_by: auth.session.actor }).select("*").single()
    await auth.supabase.from("admin_provider_jobs").insert({ provider: channel === "SMS" ? "twilio" : "resend", action: "send_notification", status: "SENT", target, request: body, response, provider_event_id: response?.sid || response?.id || null, created_by: auth.session.actor, attempts: 1 })
    return NextResponse.json({ notification: data, response })
  } catch (error: any) {
    await auth.supabase.from("admin_provider_jobs").insert({ provider: channel === "SMS" ? "twilio" : "resend", action: "send_notification", status: error?.name === "IntegrationConfigError" ? "FAILED_CONFIG" : "FAILED_PROVIDER", target, request: body, response: {}, error: error?.message, created_by: auth.session.actor, attempts: 1 })
    return jsonError(error.message || "Notification send failed", error?.name === "IntegrationConfigError" ? 400 : 502)
  }
}
