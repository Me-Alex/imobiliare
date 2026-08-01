/**
 * Single Document Checklist Item API Routes
 * Handles PATCH and DELETE for individual checklist items
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, requireStaff, hasResponse } from '@/lib/server-admin-auth'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// Valid statuses
const VALID_STATUSES = ['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'] as const

// ─── PATCH /api/appointments-v2/document-checklists/[id] ─────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId, role } = account
  const { id } = await params
  const isStaff = role !== 'CLIENT'

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Fetch current checklist item
  const { data: current, error: fetchError } = await client
    .from('document_checklists')
    .select('*, appointments_v2!inner(id, client_id, agent_id)')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Documentul nu a fost găsit.' }, { status: 404 })
  }

  const appointment = current.appointments_v2 as { id: string; client_id: string; agent_id: string | null }
  const isOwner = appointment.client_id === userId

  // Authorization
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

  const updates: Record<string, unknown> = {}

  // Client-writable fields
  if (body.status === 'UPLOADED' && isOwner) {
    updates.status = 'UPLOADED'
    updates.uploaded_at = new Date().toISOString()
  }

  // Staff-writable fields
  if (isStaff) {
    if (typeof body.status === 'string' && VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
      updates.status = body.status
    }
    if (body.verifiedAt !== undefined) {
      updates.verified_at = body.verifiedAt ? new Date().toISOString() : null
    }
    if (body.verifiedBy !== undefined) {
      updates.verified_by = body.verifiedBy || null
    }
    if (typeof body.rejectionReason === 'string') {
      updates.rejection_reason = body.rejectionReason.trim() || null
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nicio actualizare furnizită.' }, { status: 400 })
  }

  const { data, error } = await client
    .from('document_checklists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[document-checklists/[id] PATCH]', error)
    return NextResponse.json(
      { error: 'Nu am putut actualiza documentul.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ checklist: data })
}

// ─── DELETE /api/appointments-v2/document-checklists/[id] ───────────────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const account = await requireStaff(request)
  if (hasResponse(account)) return account.response

  const { client } = account
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Verify the checklist item exists
  const { data: current, error: fetchError } = await client
    .from('document_checklists')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Documentul nu a fost găsit.' }, { status: 404 })
  }

  // Delete
  const { error: deleteError } = await client
    .from('document_checklists')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[document-checklists/[id] DELETE]', deleteError)
    return NextResponse.json(
      { error: 'Nu am putut șterge documentul.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
