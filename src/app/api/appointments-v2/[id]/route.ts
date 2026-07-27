/**
 * Single Appointment v2 API Routes
 * Handles GET, PATCH, DELETE for individual appointments
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, requireStaff, hasResponse } from '@/lib/server-admin-auth'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// ─── GET /api/appointments-v2/[id] ───────────────────────────────────────────
export async function GET(request: NextRequest, { params }: RouteParams) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId, role } = account
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  const { data, error } = await client
    .from('appointments_v2')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Programarea nu a fost găsită.' }, { status: 404 })
  }

  // Authorization: client can only see their own, staff can see all
  if (role === 'CLIENT' && data.client_id !== userId) {
    return NextResponse.json({ error: 'Acces neautorizat.' }, { status: 403 })
  }

  return NextResponse.json({ appointment: data })
}

// ─── PATCH /api/appointments-v2/[id] ─────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId, role } = account
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Fetch current appointment
  const { data: current, error: fetchError } = await client
    .from('appointments_v2')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Programarea nu a fost găsită.' }, { status: 404 })
  }

  // Authorization
  const isOwner = current.client_id === userId
  const isStaff = role !== 'CLIENT'

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: 'Acces neautorizat.' }, { status: 403 })
  }

  // Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  // Build update object
  const updates: Record<string, unknown> = {}

  // Client-writable fields
  if (typeof body.clientName === 'string' && body.clientName.trim()) {
    updates.client_name = body.clientName.trim()
  }
  if (typeof body.clientPhone === 'string') {
    updates.client_phone = body.clientPhone.trim() || null
  }
  if (typeof body.notes === 'string') {
    updates.notes = body.notes.trim() || null
  }

  // Staff-writable fields
  if (isStaff) {
    if (typeof body.status === 'string') {
      const validStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
      if (validStatuses.includes(body.status)) {
        updates.status = body.status
      }
    }
    if (typeof body.scheduledAt === 'string') {
      updates.scheduled_at = body.scheduledAt
    }
    if (typeof body.scheduledEnd === 'string') {
      updates.scheduled_end = body.scheduledEnd
    }
    if (typeof body.agentId === 'string') {
      updates.agent_id = body.agentId || null
    }
    if (typeof body.agentName === 'string') {
      updates.agent_name = body.agentName
    }
    if (body.confirmedAt !== undefined) {
      updates.confirmed_at = body.confirmedAt ? new Date().toISOString() : null
    }
    if (body.checkedInAt !== undefined) {
      updates.checked_in_at = body.checkedInAt ? new Date().toISOString() : null
    }
    if (body.completedAt !== undefined) {
      updates.completed_at = body.completedAt ? new Date().toISOString() : null
    }
    if (typeof body.googleEventId === 'string') {
      updates.google_event_id = body.googleEventId || null
    }
    if (typeof body.googleCalendarSynced === 'boolean') {
      updates.google_calendar_synced = body.googleCalendarSynced
    }
  }

  // Status transition validations
  if (updates.status) {
    const currentStatus = current.status
    const newStatus = updates.status as string

    // Clients can only cancel their own appointments
    if (!isStaff && newStatus === 'CANCELLED' && isOwner) {
      // Allow cancellation
    } else if (!isStaff) {
      return NextResponse.json(
        { error: 'Clienții pot doar anula programările proprii.' },
        { status: 403 }
      )
    }

    // Validate status transitions
    const allowedTransitions: Record<string, string[]> = {
      SCHEDULED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: ['CONFIRMED'], // Can reschedule no-shows
    }

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Nu se poate face tranziția de la ${currentStatus} la ${newStatus}.` },
        { status: 400 }
      )
    }
  }

  // Prevent updates to completed/cancelled appointments by clients
  if (!isStaff && ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(current.status)) {
    return NextResponse.json(
      { error: 'Nu se pot modifica programările finalizate sau anulate.' },
      { status: 400 }
    )
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nicio actualizare furnizată.' }, { status: 400 })
  }

  const { data, error } = await client
    .from('appointments_v2')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[appointments-v2/[id] PATCH]', error)
    return NextResponse.json(
      { error: 'Nu am putut actualiza programarea.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ appointment: data })
}

// ─── DELETE /api/appointments-v2/[id] ────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId, role } = account
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Fetch current appointment
  const { data: current, error: fetchError } = await client
    .from('appointments_v2')
    .select('id, client_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Programarea nu a fost găsită.' }, { status: 404 })
  }

  // Authorization: only owner or staff can delete
  const isOwner = current.client_id === userId
  const isStaff = role !== 'CLIENT'

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: 'Acces neautorizat.' }, { status: 403 })
  }

  // Only allow deletion of SCHEDULED appointments by clients
  if (!isStaff && current.status !== 'SCHEDULED') {
    return NextResponse.json(
      { error: 'Doar programările în așteptare pot fi șterse.' },
      { status: 400 }
    )
  }

  // Delete the appointment (cascade will handle related records)
  const { error: deleteError } = await client
    .from('appointments_v2')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[appointments-v2/[id] DELETE]', deleteError)
    return NextResponse.json(
      { error: 'Nu am putut șterge programarea.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
