/**
 * Appointment Notifications API
 * Triggers email/SMS notifications for appointment events
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, hasResponse } from '@/lib/server-admin-auth'
import { supabase } from '@/lib/supabase'
import { 
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendAppointmentCancellationEmail,
  sendAppointmentUpdateEmail,
} from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// ─── POST /api/appointments-v2/notify ─────────────────────────────────────────
// Send notification for an appointment event
export async function POST(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId, role } = account
  const isStaff = role !== 'CLIENT'

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : ''
  const eventType = typeof body.eventType === 'string' ? body.eventType : ''

  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId este obligatoriu.' }, { status: 400 })
  }

  if (!eventType) {
    return NextResponse.json({ error: 'eventType este obligatoriu.' }, { status: 400 })
  }

  const validEventTypes = ['CONFIRMATION', 'REMINDER', 'CANCELLATION', 'UPDATE', 'COMPLETION']
  if (!validEventTypes.includes(eventType)) {
    return NextResponse.json({ error: 'Tip de eveniment invalid.' }, { status: 400 })
  }

  // Only staff can send notifications
  if (!isStaff) {
    return NextResponse.json(
      { error: 'Doar personalul poate trimite notificari.' },
      { status: 403 }
    )
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(appointmentId)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Fetch appointment details
  const { data: appointment, error: aptError } = await client
    .from('appointments_v2')
    .select('*')
    .eq('id', appointmentId)
    .single()

  if (aptError || !appointment) {
    return NextResponse.json({ error: 'Programarea nu a fost gasita.' }, { status: 404 })
  }

  // Check user notification preferences
  const { data: prefs } = await client
    .from('notification_preferences')
    .select('email_reminders, sms_reminders')
    .eq('user_id', appointment.client_id)
    .single()

  // Default to email enabled
  const emailEnabled = prefs?.email_reminders ?? true

  try {
    // Format date and time
    const scheduledDate = new Date(appointment.scheduled_at)
    const formattedDate = scheduledDate.toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const formattedTime = scheduledDate.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const emailData = {
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      propertyTitle: appointment.property_title,
      appointmentDate: formattedDate,
      appointmentTime: formattedTime,
      agentName: appointment.agent_name,
    }

    // Send appropriate notification
    switch (eventType) {
      case 'CONFIRMATION':
        if (emailEnabled) {
          await sendAppointmentConfirmationEmail(emailData)
        }
        break

      case 'REMINDER':
        if (emailEnabled) {
          await sendAppointmentReminderEmail(emailData)
        }
        break

      case 'CANCELLATION':
        if (emailEnabled) {
          await sendAppointmentCancellationEmail({
            ...emailData,
            cancellationReason: typeof body.cancellationReason === 'string' 
              ? body.cancellationReason 
              : undefined,
          })
        }
        break

      case 'UPDATE':
        if (emailEnabled) {
          await sendAppointmentUpdateEmail({
            ...emailData,
            updateDetails: typeof body.updateDetails === 'string' 
              ? body.updateDetails 
              : 'Detaliile programarii au fost actualizate.',
          })
        }
        break

      case 'COMPLETION':
        if (emailEnabled) {
          // Send completion thank you email
          await sendAppointmentConfirmationEmail({
            ...emailData,
            // Could add special completion message
          })
        }
        break
    }

    return NextResponse.json({ 
      success: true,
      message: `Notificare de tip ${eventType} trimisa cu succes.`,
    })
  } catch (error) {
    console.error('[appointments-v2/notify POST]', error)
    return NextResponse.json(
      { error: 'Nu am putut trimite notificarea.' },
      { status: 500 }
    )
  }
}
