import {
  createDocuSignEnvelope,
  createGoogleCalendarEvent,
  createStripeInvoice,
  IntegrationConfigError,
  sendResendEmail,
  sendTwilioSms,
} from "@/lib/admin-integrations"

type SupabaseLike = any
type Row = Record<string, any>

const retryableStatuses = ["QUEUED", "RETRYING", "FAILED_PROVIDER"]
const terminalStatuses = ["SENT", "CANCELLED", "FAILED_CONFIG"]

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object") : []
}

function nowIso() {
  return new Date().toISOString()
}

function addSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

function retryDelaySeconds(attempts: number) {
  return Math.min(3600, Math.max(60, 2 ** Math.max(1, attempts) * 30))
}

function providerEventId(response: any) {
  return response?.id || response?.sid || response?.envelopeId || response?.invoice?.id || response?.event?.id || null
}

function notificationProvider(row: Row) {
  const channel = String(row.channel || row.request?.channel || "").toUpperCase()
  return channel === "SMS" ? "twilio" : "resend"
}

async function safeInsertAudit(supabase: SupabaseLike, actor: string, action: string, entity: string, entityId: string | null, details: Row) {
  await supabase
    .from("admin_audit_log")
    .insert({ actor, action, entity, entity_id: entityId, details, metadata: details })
    .then(() => undefined)
}

export async function queueDueOutboxNotifications(supabase: SupabaseLike, actor = "provider-cron") {
  const { data } = await supabase
    .from("admin_notification_outbox")
    .select("*")
    .in("status", ["QUEUED", "PENDING", "RETRYING"])
    .or(`due_at.is.null,due_at.lte.${nowIso()}`)
    .order("created_at", { ascending: true })
    .limit(50)

  const queued: Row[] = []
  for (const row of asRows(data)) {
    const existing = await supabase
      .from("admin_provider_jobs")
      .select("id,status")
      .eq("entity", "admin_notification_outbox")
      .eq("entity_id", row.id)
      .in("status", [...retryableStatuses, "SENT"])
      .limit(1)
      .maybeSingle()

    if (existing.data && !["FAILED_PROVIDER", "RETRYING"].includes(String(existing.data.status))) continue

    const provider = notificationProvider(row)
    const request = {
      channel: row.channel || (provider === "twilio" ? "SMS" : "EMAIL"),
      target: row.target,
      subject: row.subject || "HQS notification",
      body: row.body || "",
      html: row.html || null,
      entity: row.entity,
      entity_id: row.entity_id,
    }

    const inserted = await supabase
      .from("admin_provider_jobs")
      .insert({
        provider,
        action: "send_notification",
        status: "QUEUED",
        target: row.target,
        entity: "admin_notification_outbox",
        entity_id: row.id,
        request,
        created_by: actor,
        next_attempt_at: nowIso(),
        updated_at: nowIso(),
      })
      .select("*")
      .maybeSingle()

    if (inserted.data) queued.push(inserted.data)
  }
  return queued
}

export async function queueAppointmentReminders(supabase: SupabaseLike, actor = "provider-cron") {
  const { data } = await supabase
    .from("appointments")
    .select("id,client_name,client_email,client_phone,property_title,requested_at,start_at,end_at,status,agent_email,reminder_at")
    .in("status", ["REQUESTED", "CONFIRMED"])
    .not("reminder_at", "is", null)
    .lte("reminder_at", nowIso())
    .order("reminder_at", { ascending: true })
    .limit(50)

  const queued: Row[] = []
  for (const appointment of asRows(data)) {
    const existing = await supabase
      .from("admin_provider_jobs")
      .select("id,status")
      .eq("action", "appointment_reminder")
      .eq("entity", "appointments")
      .eq("entity_id", appointment.id)
      .in("status", [...retryableStatuses, ...terminalStatuses])
      .limit(1)
      .maybeSingle()
    if (existing.data) continue

    const hasPhone = String(appointment.client_phone || "").trim().length >= 7
    const provider = hasPhone ? "twilio" : "resend"
    const target = hasPhone ? appointment.client_phone : appointment.client_email
    if (!target) continue

    const startsAt = appointment.start_at || appointment.requested_at
    const body = `Reminder HQS: vizionarea ${appointment.property_title || ""} este programata la ${new Date(startsAt).toLocaleString("ro-RO")}.`
    const inserted = await supabase
      .from("admin_provider_jobs")
      .insert({
        provider,
        action: "appointment_reminder",
        status: "QUEUED",
        target,
        entity: "appointments",
        entity_id: appointment.id,
        request: {
          channel: provider === "twilio" ? "SMS" : "EMAIL",
          target,
          subject: "Reminder vizionare HQS",
          body,
          appointment,
        },
        created_by: actor,
        next_attempt_at: nowIso(),
        updated_at: nowIso(),
      })
      .select("*")
      .maybeSingle()

    if (inserted.data) queued.push(inserted.data)
  }
  return queued
}

export async function expireHeldAppointmentSlots(supabase: SupabaseLike) {
  const { data } = await supabase
    .from("appointment_slots")
    .update({ status: "AVAILABLE", updated_at: nowIso() })
    .eq("status", "HELD")
    .lt("updated_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .select("id")
  return asRows(data).length
}

async function executeProviderJob(job: Row) {
  const request = job.request || {}
  if (job.action === "send_notification" || job.action === "appointment_reminder") {
    if (job.provider === "twilio" || String(request.channel || "").toUpperCase() === "SMS") {
      return sendTwilioSms({ to: request.target || job.target, body: request.body || request.subject || "HQS notification" })
    }
    return sendResendEmail({
      to: request.target || job.target,
      subject: request.subject || "HQS notification",
      html: request.html || undefined,
      text: request.body || request.subject,
    })
  }

  if (job.action === "calendar_sync") {
    return createGoogleCalendarEvent({
      summary: request.summary || "Vizionare HQS",
      description: request.description || request.notes,
      start: request.start || request.starts_at || request.requested_at,
      end: request.end || request.ends_at || request.end_at,
      attendees: request.attendees || [request.client_email, request.agent_email].filter(Boolean),
      location: request.location || request.address || request.property_title,
    })
  }

  if (job.action === "create_invoice") {
    return createStripeInvoice({
      clientEmail: request.client_email || request.email || job.target,
      clientName: request.client_name || request.name,
      description: request.description || "Servicii HQS Imobiliare",
      amount: Number(request.amount || 0),
      currency: request.currency || "eur",
      propertyId: request.property_id,
    })
  }

  if (job.action === "create_envelope") {
    return createDocuSignEnvelope({
      signerEmail: request.signer_email || request.email || job.target,
      signerName: request.signer_name || request.name || "Client HQS",
      subject: request.subject || request.title || "Document HQS",
      documentHtml: request.document_html || request.documentHtml,
      returnUrl: request.return_url || request.returnUrl,
    })
  }

  throw new Error(`Provider job action not supported: ${job.action}`)
}

async function markLinkedOutbox(supabase: SupabaseLike, job: Row, status: string, patch: Row) {
  if (job.entity !== "admin_notification_outbox" || !job.entity_id) return
  await supabase
    .from("admin_notification_outbox")
    .update({ status, ...patch, updated_at: nowIso() })
    .eq("id", job.entity_id)
}

export async function processProviderJobs(options: { supabase: SupabaseLike; actor?: string; limit?: number; maxAttempts?: number }) {
  const supabase = options.supabase
  const actor = options.actor || "provider-cron"
  const limit = Math.min(50, Math.max(1, options.limit || 20))
  const maxAttempts = Math.min(10, Math.max(1, options.maxAttempts || 5))
  const expiredHeldSlots = await expireHeldAppointmentSlots(supabase)
  const queuedOutbox = await queueDueOutboxNotifications(supabase, actor)
  const queuedReminders = await queueAppointmentReminders(supabase, actor)

  const { data } = await supabase
    .from("admin_provider_jobs")
    .select("*")
    .in("status", retryableStatuses)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso()}`)
    .order("created_at", { ascending: true })
    .limit(limit)

  const processed: Row[] = []
  const failed: Row[] = []
  const skipped: Row[] = []

  for (const job of asRows(data)) {
    const attempts = Number(job.attempts || 0) + 1
    const locked = await supabase
      .from("admin_provider_jobs")
      .update({ status: "RETRYING", attempts, locked_at: nowIso(), locked_by: actor, updated_at: nowIso() })
      .eq("id", job.id)
      .in("status", retryableStatuses)
      .select("*")
      .maybeSingle()

    if (!locked.data) {
      skipped.push(job)
      continue
    }

    try {
      const response = await executeProviderJob({ ...job, attempts })
      const eventId = providerEventId(response)
      const patch = {
        status: "SENT",
        response,
        error: null,
        provider_event_id: eventId,
        completed_at: nowIso(),
        next_attempt_at: null,
        updated_at: nowIso(),
      }
      const updated = await supabase.from("admin_provider_jobs").update(patch).eq("id", job.id).select("*").maybeSingle()
      await markLinkedOutbox(supabase, job, "SENT", { sent_at: nowIso(), provider_job_id: job.id, last_error: null })
      await safeInsertAudit(supabase, actor, "PROVIDER_JOB_SENT", "admin_provider_jobs", job.id, patch)
      processed.push(updated.data || { ...job, ...patch })
    } catch (error: any) {
      const configFailure = error instanceof IntegrationConfigError || error?.name === "IntegrationConfigError"
      const terminal = configFailure || attempts >= maxAttempts
      const status = configFailure ? "FAILED_CONFIG" : terminal ? "FAILED_PROVIDER" : "RETRYING"
      const patch = {
        status,
        response: {},
        error: error?.message || "Provider job failed",
        next_attempt_at: terminal ? null : addSeconds(retryDelaySeconds(attempts)),
        updated_at: nowIso(),
      }
      const updated = await supabase.from("admin_provider_jobs").update(patch).eq("id", job.id).select("*").maybeSingle()
      await markLinkedOutbox(supabase, job, terminal ? "FAILED" : "RETRYING", { provider_job_id: job.id, last_error: patch.error })
      await safeInsertAudit(supabase, actor, "PROVIDER_JOB_FAILED", "admin_provider_jobs", job.id, patch)
      failed.push(updated.data || { ...job, ...patch })
    }
  }

  return {
    expiredHeldSlots,
    queuedOutbox: queuedOutbox.length,
    queuedReminders: queuedReminders.length,
    processed: processed.length,
    failed: failed.length,
    skipped: skipped.length,
    results: { processed, failed, skipped },
  }
}
