/**
 * Document Checklists API Routes
 * Handles CRUD for document checklists linked to appointments
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, hasResponse } from '@/lib/server-admin-auth'

export const dynamic = 'force-dynamic'

// Valid document types
const VALID_DOCUMENT_TYPES = [
  'id_card',
  'proof_of_income',
  'ownership_title',
  'land_registry_excerpt',
  'fiscal_certificate',
  'energy_certificate',
  'vizionare_sign',
  'brokerage_contract',
  'owner_mandate',
  'reservation_offer',
  'rental_contract',
  'handover_protocol',
  'addendum',
  'termination_notice',
  'other',
] as const

type DocumentType = typeof VALID_DOCUMENT_TYPES[number]

// ─── GET /api/appointments-v2/document-checklists ──────────────────────────────
// Query params: appointmentId
export async function GET(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId, role } = account
  const { searchParams } = new URL(request.url)
  const appointmentId = searchParams.get('appointmentId')

  if (!appointmentId) {
    return NextResponse.json(
      { error: 'appointmentId este obligatoriu.' },
      { status: 400 }
    )
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(appointmentId)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Verify access to the appointment
  const { data: appointment, error: aptError } = await client
    .from('appointments_v2')
    .select('id, client_id, agent_id')
    .eq('id', appointmentId)
    .single()

  if (aptError || !appointment) {
    return NextResponse.json({ error: 'Programarea nu a fost găsită.' }, { status: 404 })
  }

  // Authorization check
  const isOwner = appointment.client_id === userId
  const isStaff = role !== 'CLIENT'

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: 'Acces neautorizat.' }, { status: 403 })
  }

  // Fetch checklists
  const { data, error } = await client
    .from('document_checklists')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[document-checklists GET]', error)
    return NextResponse.json(
      { error: 'Nu am putut încărca documentele.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ checklists: data ?? [] })
}

// ─── POST /api/appointments-v2/document-checklists ────────────────────────────
// Create a new checklist item or bulk create checklist items
export async function POST(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, role } = account
  const isStaff = role !== 'CLIENT'

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : ''

  if (!appointmentId) {
    return NextResponse.json(
      { error: 'appointmentId este obligatoriu.' },
      { status: 400 }
    )
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(appointmentId)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Only staff can create checklists
  if (!isStaff) {
    return NextResponse.json(
      { error: 'Doar personalul poate crea liste de documente.' },
      { status: 403 }
    )
  }

  // Verify appointment exists
  const { data: appointment, error: aptError } = await client
    .from('appointments_v2')
    .select('id')
    .eq('id', appointmentId)
    .single()

  if (aptError || !appointment) {
    return NextResponse.json({ error: 'Programarea nu a fost găsită.' }, { status: 404 })
  }

  // Support bulk creation
  const items = Array.isArray(body.items) ? body.items : [body]

  const checklistsToInsert = items.map((item: Record<string, unknown>) => {
    const documentType = item.documentType as string
    const isRequired = item.isRequired !== false

    if (!VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      throw new Error(`Tip de document invalid: ${documentType}`)
    }

    return {
      appointment_id: appointmentId,
      document_type: documentType,
      required: isRequired,
      status: 'PENDING',
    }
  })

  try {
    const { data, error } = await client
      .from('document_checklists')
      .insert(checklistsToInsert)
      .select()

    if (error) {
      console.error('[document-checklists POST]', error)
      return NextResponse.json(
        { error: 'Nu am putut crea lista de documente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ checklists: data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare necunoscută'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
