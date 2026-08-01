/**
 * Signatures API Routes
 * Handles electronic signature operations for appointment documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, hasResponse } from '@/lib/server-admin-auth'

export const dynamic = 'force-dynamic'

// ─── GET /api/appointments-v2/signatures ─────────────────────────────────────
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
    .select('id, client_id')
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

  // Fetch signatures
  const { data, error } = await client
    .from('signatures')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('signed_at', { ascending: false })

  if (error) {
    console.error('[signatures GET]', error)
    return NextResponse.json(
      { error: 'Nu am putut încărca semnăturile.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ signatures: data ?? [] })
}

// ─── POST /api/appointments-v2/signatures ────────────────────────────────────
// Create a new signature record
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

  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : ''
  const documentType = typeof body.documentType === 'string' ? body.documentType : ''
  const signerName = typeof body.signerName === 'string' ? body.signerName.trim() : ''
  const signerRole = typeof body.signerRole === 'string' ? body.signerRole : 'CLIENT'
  const method = typeof body.method === 'string' ? body.method : 'TYPED'
  const signatureText = typeof body.signatureText === 'string' ? body.signatureText.trim() : ''
  const signatureImageUrl = typeof body.signatureImageUrl === 'string' ? body.signatureImageUrl : ''
  const consentAccepted = body.consentAccepted === true

  // Validations
  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId este obligatoriu.' }, { status: 400 })
  }

  if (!documentType) {
    return NextResponse.json({ error: 'documentType este obligatoriu.' }, { status: 400 })
  }

  if (!signerName || signerName.length < 2) {
    return NextResponse.json(
      { error: 'Numele semnatarului este obligatoriu (min. 2 caractere).' },
      { status: 400 }
    )
  }

  if (!['CLIENT', 'AGENT'].includes(signerRole)) {
    return NextResponse.json({ error: 'Rol invalid pentru semnatar.' }, { status: 400 })
  }

  if (!['TYPED', 'DRAWN'].includes(method)) {
    return NextResponse.json({ error: 'Metoda de semnare invalida.' }, { status: 400 })
  }

  if (method === 'TYPED' && !signatureText) {
    return NextResponse.json(
      { error: 'Textul semnaturii este obligatoriu pentru semnatura tiparita.' },
      { status: 400 }
    )
  }

  if (method === 'DRAWN' && !signatureImageUrl) {
    return NextResponse.json(
      { error: 'Imaginea semnaturii este obligatorie pentru semnatura desenata.' },
      { status: 400 }
    )
  }

  if (!consentAccepted) {
    return NextResponse.json(
      { error: 'Trebuie sa acceptati consimtamantul pentru semnare.' },
      { status: 400 }
    )
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(appointmentId)) {
    return NextResponse.json({ error: 'ID invalid.' }, { status: 400 })
  }

  // Verify appointment exists and user has access
  const { data: appointment, error: aptError } = await client
    .from('appointments_v2')
    .select('id, client_id')
    .eq('id', appointmentId)
    .single()

  if (aptError || !appointment) {
    return NextResponse.json({ error: 'Programarea nu a fost gasita.' }, { status: 404 })
  }

  // Only the signer themselves or staff can create signatures
  const isOwner = appointment.client_id === userId

  if (!isOwner) {
    return NextResponse.json(
      { error: 'Doar participantii pot semna documente.' },
      { status: 403 }
    )
  }

  // Get client IP and user agent for audit
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : null
  const userAgent = request.headers.get('user-agent') || null

  try {
    const { data, error } = await client
      .from('signatures')
      .insert({
        appointment_id: appointmentId,
        document_type: documentType,
        signer_id: userId,
        signer_name: signerName,
        signer_role: signerRole,
        method,
        signature_text: method === 'TYPED' ? signatureText : null,
        signature_image_url: method === 'DRAWN' ? signatureImageUrl : null,
        consent_accepted_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ati semnat deja acest document.' },
          { status: 409 }
        )
      }
      console.error('[signatures POST]', error)
      return NextResponse.json(
        { error: 'Nu am putut crea semnatura.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ signature: data }, { status: 201 })
  } catch (error) {
    console.error('[signatures POST]', error)
    return NextResponse.json(
      { error: 'Nu am putut crea semnatura.' },
      { status: 500 }
    )
  }
}
