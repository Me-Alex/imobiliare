/**
 * Single Signature API Routes
 * Handles GET for individual signature records
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, hasResponse } from '@/lib/server-admin-auth'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// ─── GET /api/appointments-v2/signatures/[id] ────────────────────────────────
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

  // Fetch signature with appointment info
  const { data, error } = await client
    .from('signatures')
    .select('*, appointments_v2!inner(id, client_id)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Semnatura nu a fost gasita.' }, { status: 404 })
  }

  const appointment = data.appointments_v2 as { id: string; client_id: string }
  const isSigner = data.signer_id === userId
  const isOwner = appointment.client_id === userId
  const isStaff = role !== 'CLIENT'

  // Authorization: signer, appointment owner, or staff
  if (!isSigner && !isOwner && !isStaff) {
    return NextResponse.json({ error: 'Acces neautorizat.' }, { status: 403 })
  }

  // Remove internal join data from response
  const { appointments_v2, ...signature } = data

  return NextResponse.json({ signature })
}
