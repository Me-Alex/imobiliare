/**
 * Notification Preferences API Routes
 * Handles notification settings for appointments
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, hasResponse } from '@/lib/server-admin-auth'

export const dynamic = 'force-dynamic'

// ─── GET /api/appointments-v2/notification-preferences ───────────────────────
export async function GET(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId } = account

  const { data, error } = await client
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine
    console.error('[notification-preferences GET]', error)
    return NextResponse.json(
      { error: 'Nu am putut încărca preferințele de notificare.' },
      { status: 500 }
    )
  }

  // Return defaults if not found
  if (!data) {
    return NextResponse.json({
      preferences: {
        user_id: userId,
        email_reminders: true,
        sms_reminders: true,
        whatsapp_notifications: false,
        reminder_hours_before: 24,
      }
    })
  }

  return NextResponse.json({ preferences: data })
}

// ─── POST /api/appointments-v2/notification-preferences ──────────────────────
// Create or update notification preferences
export async function POST(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId } = account

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  // Parse and validate fields
  const emailReminders = typeof body.emailReminders === 'boolean' ? body.emailReminders : true
  const smsReminders = typeof body.smsReminders === 'boolean' ? body.smsReminders : true
  const whatsappNotifications = typeof body.whatsappNotifications === 'boolean' ? body.whatsappNotifications : false
  const reminderHoursBefore = typeof body.reminderHoursBefore === 'number' 
    ? Math.max(1, Math.min(168, body.reminderHoursBefore))
    : 24

  const { data, error } = await client
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      email_reminders: emailReminders,
      sms_reminders: smsReminders,
      whatsapp_notifications: whatsappNotifications,
      reminder_hours_before: reminderHoursBefore,
    })
    .select()
    .single()

  if (error) {
    console.error('[notification-preferences POST]', error)
    return NextResponse.json(
      { error: 'Nu am putut salva preferințele de notificare.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ preferences: data }, { status: 200 })
}
