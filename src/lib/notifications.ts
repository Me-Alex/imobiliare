/**
 * Notification service abstraction.
 *
 * Channels:
 *  - console  → always available (dev / fallback)
 *  - email    → Resend when RESEND_API_KEY is set, otherwise console
 *  - sms      → stub (Twilio-ready)
 *  - in_app   → persists to NotificationLog only
 *
 * Usage:
 *   import { notify } from '@/lib/notifications'
 *   await notify({ channel: 'email', to: 'user@example.com', subject: '...', body: '...' })
 */

import { getSafeDb } from '@/lib/edge-db'

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'console'

export interface NotifyPayload {
  channel: NotificationChannel
  to: string
  subject?: string
  body: string
  template?: string
  metadata?: Record<string, unknown>
  /** Skip actual send, only log (useful in tests) */
  dryRun?: boolean
}

export interface NotifyResult {
  ok: boolean
  channel: NotificationChannel
  status: 'SENT' | 'FAILED' | 'SKIPPED'
  error?: string
  providerId?: string
}

// ─── Providers ────────────────────────────────────────────────

async function sendConsole(payload: NotifyPayload): Promise<NotifyResult> {
  console.info(
    `[notify:console] → ${payload.to}`,
    payload.subject ? `| ${payload.subject}` : '',
    `| ${payload.body.slice(0, 120)}${payload.body.length > 120 ? '…' : ''}`,
  )
  return { ok: true, channel: 'console', status: 'SENT' }
}

async function sendEmail(payload: NotifyPayload): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFICATION_FROM_EMAIL || 'HQS Imobiliare <noreply@hqsimobiliare.ro>'

  if (!apiKey) {
    // Fallback to console in dev / when not configured
    const fallback = await sendConsole({ ...payload, channel: 'console' })
    return { ...fallback, channel: 'email', status: 'SKIPPED', error: 'RESEND_API_KEY not configured' }
  }

  if (payload.dryRun) {
    return { ok: true, channel: 'email', status: 'SKIPPED', error: 'dryRun' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject || 'Notificare HQS Imobiliare',
        html: payload.body.includes('<') ? payload.body : `<p>${payload.body.replace(/\n/g, '<br/>')}</p>`,
        text: payload.body.replace(/<[^>]+>/g, ''),
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { ok: false, channel: 'email', status: 'FAILED', error: `Resend ${res.status}: ${text}` }
    }

    const data = (await res.json()) as { id?: string }
    return { ok: true, channel: 'email', status: 'SENT', providerId: data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, channel: 'email', status: 'FAILED', error: message }
  }
}

async function sendSms(payload: NotifyPayload): Promise<NotifyResult> {
  // Twilio-ready stub
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from) {
    const fallback = await sendConsole({ ...payload, channel: 'console' })
    return { ...fallback, channel: 'sms', status: 'SKIPPED', error: 'Twilio not configured' }
  }

  if (payload.dryRun) {
    return { ok: true, channel: 'sms', status: 'SKIPPED', error: 'dryRun' }
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64')
    const body = new URLSearchParams({
      To: payload.to,
      From: from,
      Body: payload.body.slice(0, 1600),
    })

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { ok: false, channel: 'sms', status: 'FAILED', error: `Twilio ${res.status}: ${text}` }
    }

    const data = (await res.json()) as { sid?: string }
    return { ok: true, channel: 'sms', status: 'SENT', providerId: data.sid }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, channel: 'sms', status: 'FAILED', error: message }
  }
}

// ─── Persistence ──────────────────────────────────────────────

async function logNotification(
  payload: NotifyPayload,
  result: NotifyResult,
): Promise<void> {
  try {
    const db = await getSafeDb()
    if (!db) return

    await db.notificationLog.create({
      data: {
        channel: result.channel,
        to: payload.to,
        subject: payload.subject || null,
        body: payload.body,
        template: payload.template || null,
        status: result.status,
        error: result.error || null,
        metadata: JSON.stringify({
          ...(payload.metadata || {}),
          providerId: result.providerId,
        }),
        sentAt: result.status === 'SENT' ? new Date() : null,
      },
    })
  } catch (error) {
    console.error('[notify] failed to persist NotificationLog:', error)
  }
}

// ─── Public API ───────────────────────────────────────────────

export async function notify(payload: NotifyPayload): Promise<NotifyResult> {
  let result: NotifyResult

  switch (payload.channel) {
    case 'email':
      result = await sendEmail(payload)
      break
    case 'sms':
      result = await sendSms(payload)
      break
    case 'in_app':
      result = { ok: true, channel: 'in_app', status: 'SENT' }
      break
    case 'push':
      // Push not yet wired — log only
      result = { ok: true, channel: 'push', status: 'SKIPPED', error: 'push not implemented' }
      break
    case 'console':
    default:
      result = await sendConsole(payload)
      break
  }

  await logNotification(payload, result)
  return result
}

/** Notify multiple recipients / channels in parallel. */
export async function notifyMany(payloads: NotifyPayload[]): Promise<NotifyResult[]> {
  return Promise.all(payloads.map((p) => notify(p)))
}

// ─── Domain helpers ───────────────────────────────────────────

export async function notifyLeadAssigned(opts: {
  leadName: string
  leadEmail: string
  agentName: string
  agentEmail: string
  propertyTitle?: string
}) {
  const subject = `Lead nou asignat: ${opts.leadName}`
  const body = [
    `Salut ${opts.agentName},`,
    '',
    `Ți-a fost asignat un lead nou:`,
    `• Nume: ${opts.leadName}`,
    `• Email: ${opts.leadEmail}`,
    opts.propertyTitle ? `• Proprietate: ${opts.propertyTitle}` : null,
    '',
    'Intră în panoul CRM pentru detalii.',
  ]
    .filter(Boolean)
    .join('\n')

  return notify({
    channel: 'email',
    to: opts.agentEmail,
    subject,
    body,
    template: 'lead_assigned',
    metadata: { leadEmail: opts.leadEmail },
  })
}

export async function notifyOfferStatus(opts: {
  to: string
  buyerName: string
  propertyTitle: string
  amount: number
  currency: string
  status: string
  note?: string
}) {
  const statusLabel: Record<string, string> = {
    SUBMITTED: 'trimisă',
    COUNTERED: 'contraofertă',
    ACCEPTED: 'acceptată',
    REJECTED: 'respinsă',
    WITHDRAWN: 'retrasă',
    EXPIRED: 'expirată',
  }

  const label = statusLabel[opts.status] || opts.status.toLowerCase()
  const subject = `Ofertă ${label}: ${opts.propertyTitle}`
  const body = [
    `Salut ${opts.buyerName},`,
    '',
    `Oferta ta de ${opts.amount.toLocaleString('ro-RO')} ${opts.currency} pentru „${opts.propertyTitle}” a fost ${label}.`,
    opts.note ? `\nNotă: ${opts.note}` : null,
    '',
    'Poți vedea detaliile în contul tău HQS Imobiliare.',
  ]
    .filter(Boolean)
    .join('\n')

  return notify({
    channel: 'email',
    to: opts.to,
    subject,
    body,
    template: 'offer_status',
    metadata: { status: opts.status, propertyTitle: opts.propertyTitle },
  })
}

export async function notifyNewLeadToTeam(opts: {
  leadName: string
  leadEmail: string
  leadPhone?: string
  source: string
  propertyTitle?: string
  teamEmails: string[]
}) {
  const subject = `Lead nou (${opts.source}): ${opts.leadName}`
  const body = [
    `Lead nou primit pe platformă.`,
    '',
    `• Nume: ${opts.leadName}`,
    `• Email: ${opts.leadEmail}`,
    opts.leadPhone ? `• Telefon: ${opts.leadPhone}` : null,
    `• Sursă: ${opts.source}`,
    opts.propertyTitle ? `• Proprietate: ${opts.propertyTitle}` : null,
    '',
    'Asignează-l din panoul CRM.',
  ]
    .filter(Boolean)
    .join('\n')

  return notifyMany(
    opts.teamEmails.map((to) => ({
      channel: 'email' as const,
      to,
      subject,
      body,
      template: 'new_lead_team',
      metadata: { leadEmail: opts.leadEmail, source: opts.source },
    })),
  )
}
