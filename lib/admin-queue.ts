import { getAdminClient, getEnv } from "./admin-api"
import {
  createDocuSignEnvelope,
  createGoogleCalendarEvent,
  createStripeInvoice,
  sendResendEmail,
  sendTwilioSms,
} from "./admin-integrations"

type Row = Record<string, any>

export type AdminQueueSummary = {
  outbox: { claimed: number; sent: number; failed: number }
  jobs: { claimed: number; sent: number; failed: number; skipped: number }
  warnings: string[]
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object") : []
}

function providerFailureStatus(error: any) {
  return error?.name === "IntegrationConfigError" ? "FAILED_CONFIG" : "FAILED_PROVIDER"
}

function nowIso() {
  return new Date().toISOString()
}

export async function processAdminQueues(options?: { outboxLimit?: number; jobLimit?: number }): Promise<AdminQueueSummary> {
  const warnings: string[] = []
  if (!getEnv("SUPABASE_SERVICE_ROLE_KEY")) {
    return {
      outbox: { claimed: 0, sent: 0, failed: 0 },
      jobs: { claimed: 0, sent: 0, failed: 0, skipped: 0 },
      warnings: ["SUPABASE_SERVICE_ROLE_KEY lipseste; coada nu poate fi procesata in acest runtime."],
    }
  }

  const supabase = getAdminClient()
  const outboxLimit = Math.max(1, Math.min(200, Math.round(Number(options?.outboxLimit ?? 25))))
  const jobLimit = Math.max(1, Math.min(200, Math.round(Number(options?.jobLimit ?? 25))))

  const summary: AdminQueueSummary = {
    outbox: { claimed: 0, sent: 0, failed: 0 },
    jobs: { claimed: 0, sent: 0, failed: 0, skipped: 0 },
    warnings,
  }

  // 1) Outbox queue (email/sms)
  const outboxClaim = await supabase.rpc("claim_admin_notification_outbox", { p_limit: outboxLimit })
  const outboxRows = asRows(outboxClaim.data)
  summary.outbox.claimed = outboxRows.length

  await Promise.allSettled(outboxRows.map(async (row) => {
    const channel = String(row.channel || "EMAIL").toUpperCase()
    const target = String(row.target || "").trim()
    try {
      if (!target) throw new Error("Target lipseste pentru outbox.")
      let response: any
      if (channel === "SMS") {
        response = await sendTwilioSms({ to: target, body: row.body || row.subject || "HQS notification" })
      } else {
        response = await sendResendEmail({
          to: target,
          subject: row.subject || "HQS notification",
          text: row.body || row.subject || "HQS notification",
        })
      }

      await Promise.allSettled([
        supabase
          .from("admin_notification_outbox")
          .update({
            status: "SENT",
            sent_at: nowIso(),
            provider_event_id: response?.id || response?.sid || null,
            last_error: null,
            updated_at: nowIso(),
          })
          .eq("id", row.id),
        supabase.from("admin_provider_jobs").insert({
          provider: channel === "SMS" ? "twilio" : "resend",
          action: "outbox_send",
          status: "SENT",
          target,
          entity: "admin_notification_outbox",
          entity_id: row.id,
          request: { outbox_id: row.id, channel, target, subject: row.subject, body: row.body },
          response,
          provider_event_id: response?.id || response?.sid || null,
          created_by: row.created_by || "worker",
          attempts: 1,
          updated_at: nowIso(),
        }),
      ])
      summary.outbox.sent += 1
    } catch (error: any) {
      const status = providerFailureStatus(error)
      await Promise.allSettled([
        supabase
          .from("admin_notification_outbox")
          .update({
            status,
            last_error: error?.message || "Eroare trimitere outbox",
            updated_at: nowIso(),
          })
          .eq("id", row.id),
        supabase.from("admin_provider_jobs").insert({
          provider: channel === "SMS" ? "twilio" : "resend",
          action: "outbox_send",
          status,
          target,
          entity: "admin_notification_outbox",
          entity_id: row.id,
          request: { outbox_id: row.id, channel, target, subject: row.subject, body: row.body },
          response: {},
          error: error?.message || "Eroare trimitere outbox",
          created_by: row.created_by || "worker",
          attempts: 1,
          updated_at: nowIso(),
        }),
      ])
      summary.outbox.failed += 1
    }
  }))

  // 2) Provider job retries (RETRYING/QUEUED)
  const jobClaim = await supabase.rpc("claim_admin_provider_jobs", { p_limit: jobLimit })
  const jobs = asRows(jobClaim.data)
  summary.jobs.claimed = jobs.length

  await Promise.allSettled(jobs.map(async (job) => {
    const provider = String(job.provider || "").toLowerCase()
    const action = String(job.action || "")
    try {
      const request = job.request || {}
      const actor = job.created_by || "worker"
      let response: any = null

      if (provider === "resend") {
        response = await sendResendEmail({
          to: request.to || request.target || job.target,
          subject: request.subject || "HQS notification",
          html: request.html,
          text: request.text || request.body,
        })
      } else if (provider === "twilio") {
        response = await sendTwilioSms({
          to: request.to || request.target || job.target,
          body: request.body || request.text || "HQS SMS",
          statusCallback: request.statusCallback,
        })
      } else if (provider === "google") {
        response = await createGoogleCalendarEvent({
          summary: request.summary || request.title || "Vizionare HQS",
          description: request.description || request.notes,
          start: request.start || request.starts_at || request.requested_at,
          end: request.end || request.ends_at,
          attendees: Array.isArray(request.attendees) ? request.attendees : [],
          location: request.location,
        })
      } else if (provider === "docusign") {
        response = await createDocuSignEnvelope({
          signerEmail: request.signer_email || request.email || job.target,
          signerName: request.signer_name || request.name || "Client HQS",
          subject: request.subject || request.title || "Contract HQS",
          documentHtml: request.document_html || request.body,
          returnUrl: request.return_url,
        })
      } else if (provider === "stripe") {
        response = await createStripeInvoice({
          clientEmail: request.client_email || request.email || job.target,
          clientName: request.client_name || request.name,
          description: request.description || request.property_title || "Servicii HQS Imobiliare",
          amount: Number(request.amount || 0),
          currency: request.currency || "eur",
          propertyId: request.property_id,
        })
      } else {
        summary.jobs.skipped += 1
        await supabase
          .from("admin_provider_jobs")
          .update({ status: "CANCELLED", error: `Provider retry nesuportat: ${provider}`, updated_at: nowIso() })
          .eq("id", job.id)
        return
      }

      await supabase
        .from("admin_provider_jobs")
        .update({
          status: "SENT",
          response,
          error: null,
          provider_event_id: response?.id || response?.sid || response?.envelopeId || response?.invoice?.id || null,
          updated_at: nowIso(),
        })
        .eq("id", job.id)

      // Best-effort side effects for common actions.
      if (provider === "stripe" && action === "create_invoice") {
        const invoice = response?.invoice || {}
        await supabase.from("admin_invoices").insert({
          stripe_customer_id: response?.customer?.id || null,
          stripe_invoice_id: invoice.id || null,
          hosted_invoice_url: invoice.hosted_invoice_url || null,
          invoice_pdf: invoice.invoice_pdf || null,
          client_email: request.client_email || request.email || job.target || null,
          client_name: request.client_name || request.name || null,
          property_id: request.property_id || null,
          amount: Number(request.amount || 0),
          currency: request.currency || "eur",
          status: invoice.status || "SENT",
          metadata: response,
          created_by: actor,
          updated_at: nowIso(),
        })
      }

      summary.jobs.sent += 1
    } catch (error: any) {
      const status = providerFailureStatus(error)
      await supabase
        .from("admin_provider_jobs")
        .update({
          status,
          error: error?.message || "Provider retry failed",
          updated_at: nowIso(),
        })
        .eq("id", job.id)
      summary.jobs.failed += 1
    }
  }))

  return summary
}
