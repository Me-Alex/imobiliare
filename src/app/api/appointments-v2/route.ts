/**
 * Appointments v2 API Routes
 * Handles CRUD operations for the new Vizionare & Document System appointments
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedAccount, requireStaff, hasResponse } from '@/lib/server-admin-auth'
import { supabase } from '@/lib/supabase'
import { createIpRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// Rate limiter for creating appointments
const appointmentCreateRateLimiter = createIpRateLimiter({ windowMs: 60_000, max: 20 })

export const dynamic = 'force-dynamic'

// ─── GET /api/appointments-v2 ────────────────────────────────────────────────
// Query params: status, propertyId, agentId, clientId, from, to, page, pageSize
export async function GET(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId, role } = account
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const propertyId = searchParams.get('propertyId')
  const agentId = searchParams.get('agentId')
  const clientId = searchParams.get('clientId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20))

  // Build query
  let query = client
    .from('appointments_v2')
    .select('*', { count: 'exact' })

  // Apply filters
  if (status) {
    query = query.eq('status', status)
  }
  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }
  if (agentId) {
    query = query.eq('agent_id', agentId)
  }
  if (clientId) {
    query = query.eq('client_id', clientId)
  }
  if (from) {
    query = query.gte('scheduled_at', from)
  }
  if (to) {
    query = query.lte('scheduled_at', to)
  }

  // Non-staff users can only see their own appointments
  if (role === 'CLIENT') {
    query = query.eq('client_id', userId)
  }

  // Staff can see all appointments they manage
  // Order by scheduled_at desc
  const { data, error, count } = await query
    .order('scheduled_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) {
    console.error('[appointments-v2 GET]', error)
    return NextResponse.json(
      { error: 'Nu am putut încărca programările.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    appointments: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    hasMore: (page * pageSize) < (count ?? 0),
  })
}

// ─── POST /api/appointments-v2 ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account.response

  const { client, userId } = account
  const limit = appointmentCreateRateLimiter.check(getClientIp(request))

  if (limit.limited) {
    return rateLimitResponse(
      limit,
      'Ai creat prea multe programări. Încearcă din nou peste un minut.'
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  // Validate required fields
  const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : ''
  const clientEmail = typeof body.clientEmail === 'string' ? body.clientEmail.trim() : ''
  const clientPhone = typeof body.clientPhone === 'string' ? body.clientPhone.trim() : null
  const propertyId = typeof body.propertyId === 'string' ? body.propertyId : null
  const propertyTitle = typeof body.propertyTitle === 'string' ? body.propertyTitle.trim() : ''
  const agentId = typeof body.agentId === 'string' ? body.agentId : null
  const agentName = typeof body.agentName === 'string' ? body.agentName.trim() : ''
  const scheduledAt = typeof body.scheduledAt === 'string' ? body.scheduledAt : ''
  const scheduledEnd = typeof body.scheduledEnd === 'string' ? body.scheduledEnd : ''
  const termsAccepted = body.termsAccepted === true
  const privacyAccepted = body.privacyAccepted === true

  if (!clientName || clientName.length < 2) {
    return NextResponse.json(
      { error: 'Numele clientului este obligatoriu (min. 2 caractere).' },
      { status: 400 }
    )
  }

  if (!clientEmail || !clientEmail.includes('@')) {
    return NextResponse.json({ error: 'Email invalid.' }, { status: 400 })
  }

  if (!propertyTitle) {
    return NextResponse.json({ error: 'Titlul proprietății este obligatoriu.' }, { status: 400 })
  }

  if (!agentName) {
    return NextResponse.json({ error: 'Numele agentului este obligatoriu.' }, { status: 400 })
  }

  if (!scheduledAt) {
    return NextResponse.json({ error: 'Data și ora programării sunt obligatorii.' }, { status: 400 })
  }

  if (!scheduledEnd) {
    return NextResponse.json({ error: 'Ora de sfârșit este obligatorie.' }, { status: 400 })
  }

  // Validate end time is after start time
  const startTime = new Date(scheduledAt).getTime()
  const endTime = new Date(scheduledEnd).getTime()
  if (endTime <= startTime) {
    return NextResponse.json(
      { error: 'Ora de sfârșit trebuie să fie după ora de începere.' },
      { status: 400 }
    )
  }

  // Validate terms and privacy acceptance
  if (!termsAccepted || !privacyAccepted) {
    return NextResponse.json(
      { error: 'Trebuie să acceptați termenii și condițiile și politica de confidențialitate.' },
      { status: 400 }
    )
  }

  try {
    // Check for overlapping appointments for the same property
    if (propertyId) {
      const { data: overlapping } = await client
        .from('appointments_v2')
        .select('id')
        .eq('property_id', propertyId)
        .neq('status', 'CANCELLED')
        .or(`scheduled_at.lt.${scheduledEnd},scheduled_end.gt.${scheduledAt}`)
        .limit(1)

      if (overlapping && overlapping.length > 0) {
        return NextResponse.json(
          { error: 'Există deja o programare pentru această proprietate în intervalul selectat.' },
          { status: 409 }
        )
      }
    }

    // Create the appointment
    const { data, error } = await client
      .from('appointments_v2')
      .insert({
        client_id: userId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        property_id: propertyId,
        property_title: propertyTitle,
        agent_id: agentId,
        agent_name: agentName,
        scheduled_at: scheduledAt,
        scheduled_end: scheduledEnd,
        status: 'SCHEDULED',
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[appointments-v2 POST]', error)
      return NextResponse.json(
        { error: 'Nu am putut crea programarea.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error) {
    console.error('[appointments-v2 POST]', error)
    return NextResponse.json(
      { error: 'Nu am putut crea programarea.' },
      { status: 500 }
    )
  }
}
