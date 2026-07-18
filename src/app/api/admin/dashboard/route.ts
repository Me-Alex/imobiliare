import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSafeDb } from '@/lib/edge-db'
import { ACCOUNT_ROLES } from '@/lib/account-roles'
import {
  ADMIN_PROPERTY_STATUSES,
  type AdminDashboardData,
  type AdminPriceAlert,
} from '@/lib/admin-dashboard'
import { requireAdmin } from '@/lib/server-admin-auth'

type QueryResult = { data: unknown; error: { message: string } | null }

async function readList(
  source: string,
  operation: PromiseLike<QueryResult>,
  warnings: string[],
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await operation
    if (error) {
      warnings.push(`${source}: ${error.message}`)
      return []
    }
    return Array.isArray(data) ? data as Record<string, unknown>[] : []
  } catch (error) {
    warnings.push(`${source}: ${error instanceof Error ? error.message : 'unavailable'}`)
    return []
  }
}
async function writeAudit(
  client: SupabaseClient,
  actor: string,
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, unknown>,
) {
  const { error } = await client.from('admin_audit_log').insert({
    actor,
    action,
    entity,
    entity_id: entityId,
    details,
    metadata: { source: 'admin-control-center' },
  })
  if (error) console.warn('Admin audit write failed:', error.message)
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('response' in auth) return auth.response

  const warnings: string[] = []
  const db = await getSafeDb()

  const legacyPromise = db
    ? Promise.all([
      db.contactSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch((error) => {
        warnings.push(`D1 contacte: ${error instanceof Error ? error.message : 'unavailable'}`)
        return []
      }),
      db.newsletterSubscription.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch((error) => {
        warnings.push(`D1 newsletter: ${error instanceof Error ? error.message : 'unavailable'}`)
        return []
      }),
      db.priceAlert.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch((error) => {
        warnings.push(`D1 alerte: ${error instanceof Error ? error.message : 'unavailable'}`)
        return []
      }),
    ])
    : Promise.resolve([[], [], []])

  const [
    legacy,
    users,
    properties,
    leads,
    appointments,
    deals,
    documentRequirements,
    legalRequests,
    templates,
    redemptions,
    audit,
    legalProfiles,
  ] = await Promise.all([
    legacyPromise,
    readList('Supabase utilizatori', auth.client
      .from('profiles')
      .select('id,email,full_name,name,phone,role,is_active,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(200), warnings),
    readList('Supabase proprietati', auth.client
      .from('properties')
      .select('id,title,slug,price,currency,type,status,city,zone,owner_id,agent_id,featured,published_at,created_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200), warnings),
    readList('Supabase lead-uri', auth.client
      .from('leads')
      .select('id,name,email,phone,status,source,score,agent_id,property_id,response_due_at,next_follow_up_at,created_at')
      .order('created_at', { ascending: false })
      .limit(200), warnings),
    readList('Supabase vizionari', auth.client
      .from('appointments')
      .select('id,client_name,client_email,property_title,status,start_at,requested_at,agent_id,client_id')
      .order('requested_at', { ascending: false })
      .limit(200), warnings),
    readList('Supabase Deal Rooms', auth.client
      .from('deal_rooms')
      .select('id,title,stage,status,next_step,next_step_due_at,agent_id,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200), warnings),
    readList('Supabase documente', auth.client
      .from('deal_document_requirements')
      .select('id,deal_id,label,responsible_role,status,due_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(300), warnings),
    readList('Supabase solicitari juridice', auth.client
      .from('legal_document_requests')
      .select('id,appointment_id,document_kind,status,staff_note,created_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(100), warnings),
    readList('Supabase sabloane', auth.client
      .from('admin_document_templates')
      .select('id,name,type,status,version,legal_version,legal_review_status,legal_reviewer_name,legal_reviewed_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(100), warnings),
    readList('Supabase Coins', auth.client
      .from('coin_redemptions')
      .select('id,user_id,reward_id,reward_snapshot,cost,status,requested_at,resolved_at,resolution_note')
      .order('requested_at', { ascending: false })
      .limit(100), warnings),
    readList('Supabase audit', auth.client
      .from('admin_audit_log')
      .select('id,action,entity,entity_id,actor,details,created_at')
      .order('created_at', { ascending: false })
      .limit(50), warnings),
    readList('Supabase profil juridic', auth.client
      .from('agency_legal_profiles')
      .select('id,status,legal_name,trade_name,cui,trade_registry_number,privacy_notice_url,privacy_notice_version,updated_at')
      .eq('is_current', true)
      .order('updated_at', { ascending: false })
      .limit(1), warnings),
  ])

  const [contacts, newsletters, rawAlerts] = legacy as [
    AdminDashboardData['contacts'],
    AdminDashboardData['newsletters'],
    Array<Record<string, unknown>>,
  ]
  const alerts = rawAlerts.map((item) => ({
    ...item,
    active: item.active === true || item.active === 1 || item.active === '1',
  })) as unknown as AdminPriceAlert[]

  const now = Date.now()
  const activeLeadStatuses = new Set(['NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING', 'OFFER', 'CONTRACT'])
  const upcomingStatuses = new Set(['PENDING', 'REQUESTED', 'CONFIRMED', 'CHECKED_IN'])
  const completedDocumentStatuses = new Set(['APPROVED', 'WAIVED'])
  const activeRequestStatuses = new Set(['REQUESTED', 'IN_REVIEW', 'NEEDS_INFO'])
  const legalProfile = legalProfiles[0] || null

  const response: AdminDashboardData = {
    generatedAt: new Date().toISOString(),
    contacts,
    newsletters,
    alerts,
    users: users as unknown as AdminDashboardData['users'],
    properties: properties as unknown as AdminDashboardData['properties'],
    leads: leads as unknown as AdminDashboardData['leads'],
    appointments: appointments as unknown as AdminDashboardData['appointments'],
    deals: deals as unknown as AdminDashboardData['deals'],
    documentRequirements: documentRequirements as unknown as AdminDashboardData['documentRequirements'],
    legalRequests: legalRequests as unknown as AdminDashboardData['legalRequests'],
    templates: templates as unknown as AdminDashboardData['templates'],
    redemptions: redemptions as unknown as AdminDashboardData['redemptions'],
    audit: audit as unknown as AdminDashboardData['audit'],
    legalProfile: legalProfile as unknown as AdminDashboardData['legalProfile'],
    stats: {
      totalUsers: users.length,
      activeUsers: users.filter((item) => item.is_active !== false).length,
      clients: users.filter((item) => item.role === 'CLIENT').length,
      owners: users.filter((item) => item.role === 'OWNER').length,
      agents: users.filter((item) => item.role === 'AGENT').length,
      admins: users.filter((item) => item.role === 'ADMIN').length,
      totalProperties: properties.length,
      publishedProperties: properties.filter((item) => item.status === 'PUBLISHED').length,
      draftProperties: properties.filter((item) => item.status === 'DRAFT').length,
      openLeads: leads.filter((item) => activeLeadStatuses.has(String(item.status))).length,
      overdueLeads: leads.filter((item) => {
        const dueAt = item.response_due_at ? Date.parse(String(item.response_due_at)) : 0
        return activeLeadStatuses.has(String(item.status)) && dueAt > 0 && dueAt < now
      }).length,
      upcomingViewings: appointments.filter((item) => {
        const startAt = item.start_at ? Date.parse(String(item.start_at)) : 0
        return upcomingStatuses.has(String(item.status)) && (startAt === 0 || startAt >= now)
      }).length,
      activeDeals: deals.filter((item) => item.status === 'ACTIVE').length,
      pendingDocuments: documentRequirements.filter((item) => !completedDocumentStatuses.has(String(item.status))).length
        + legalRequests.filter((item) => activeRequestStatuses.has(String(item.status))).length,
      pendingRedemptions: redemptions.filter((item) => item.status === 'REQUESTED').length,
      totalContacts: contacts.length,
      totalNewsletters: newsletters.length,
      totalAlerts: alerts.filter((item) => item.active).length,
      templatesApproved: templates.filter((item) => item.legal_review_status === 'APPROVED').length,
      templatesPendingReview: templates.filter((item) => item.legal_review_status !== 'APPROVED').length,
    },
    health: {
      supabase: warnings.some((item) => item.startsWith('Supabase')) ? 'degraded' : 'online',
      d1: db ? 'online' : 'fallback',
      legalProfileReady: Boolean(
        legalProfile
        && legalProfile.status === 'ACTIVE'
        && typeof legalProfile.privacy_notice_url === 'string'
        && legalProfile.privacy_notice_url.length > 0
      ),
      warnings,
    },
  }

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('response' in auth) return auth.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action.trim().toUpperCase() : ''

  if (action === 'UPDATE_USER') {
    const userId = body.userId
    if (!isUuid(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })

    const { data: target, error: targetError } = await auth.client
      .from('profiles')
      .select('id,email,full_name,role,is_active')
      .eq('id', userId)
      .maybeSingle()
    if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.role !== undefined) {
      const role = typeof body.role === 'string' ? body.role.toUpperCase() : ''
      if (!ACCOUNT_ROLES.includes(role as (typeof ACCOUNT_ROLES)[number])) {
        return NextResponse.json({ error: 'Invalid account role' }, { status: 400 })
      }
      if (userId === auth.userId && role !== 'ADMIN') {
        return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 409 })
      }
      updates.role = role
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'Invalid active status' }, { status: 400 })
      }
      if (userId === auth.userId && body.isActive === false) {
        return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 409 })
      }
      updates.is_active = body.isActive
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No user changes supplied' }, { status: 400 })
    }

    const removesActiveAdmin = target.role === 'ADMIN'
      && target.is_active !== false
      && (updates.role !== undefined && updates.role !== 'ADMIN' || updates.is_active === false)
    if (removesActiveAdmin) {
      const { count, error: countError } = await auth.client
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'ADMIN')
        .eq('is_active', true)
      if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'At least one active administrator is required' }, { status: 409 })
      }
    }

    const { data, error } = await auth.client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('id,email,full_name,name,phone,role,is_active,created_at,updated_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await writeAudit(auth.client, auth.email, 'UPDATE_USER', 'profile', userId, {
      previousRole: target.role,
      previousActive: target.is_active,
      role: data.role,
      isActive: data.is_active,
    })
    return NextResponse.json({ ok: true, user: data })
  }

  if (action === 'UPDATE_PROPERTY') {
    const propertyId = body.propertyId
    if (!isUuid(propertyId)) return NextResponse.json({ error: 'Invalid property id' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status !== undefined) {
      const status = typeof body.status === 'string' ? body.status.toUpperCase() : ''
      if (!ADMIN_PROPERTY_STATUSES.includes(status as (typeof ADMIN_PROPERTY_STATUSES)[number])) {
        return NextResponse.json({ error: 'Invalid property status' }, { status: 400 })
      }
      updates.status = status
      if (status === 'PUBLISHED') updates.published_at = new Date().toISOString()
    }

    if (body.agentId !== undefined) {
      if (body.agentId !== null && !isUuid(body.agentId)) {
        return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 })
      }
      if (body.agentId) {
        const { data: agent, error: agentError } = await auth.client
          .from('profiles')
          .select('id')
          .eq('id', body.agentId)
          .eq('role', 'AGENT')
          .eq('is_active', true)
          .maybeSingle()
        if (agentError) return NextResponse.json({ error: agentError.message }, { status: 500 })
        if (!agent) return NextResponse.json({ error: 'Active agent not found' }, { status: 404 })
      }
      updates.agent_id = body.agentId
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No property changes supplied' }, { status: 400 })
    }

    const { data, error } = await auth.client
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .select('id,title,slug,price,currency,type,status,city,zone,owner_id,agent_id,featured,published_at,created_at,updated_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await writeAudit(auth.client, auth.email, 'UPDATE_PROPERTY', 'property', propertyId, updates)
    return NextResponse.json({ ok: true, property: data })
  }

  if (action === 'RESOLVE_REDEMPTION') {
    const redemptionId = body.redemptionId
    const status = typeof body.status === 'string' ? body.status.toUpperCase() : ''
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : ''
    if (!isUuid(redemptionId) || !['FULFILLED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid redemption action' }, { status: 400 })
    }
    if (status === 'REJECTED' && !note) {
      return NextResponse.json({ error: 'A rejection note is required' }, { status: 400 })
    }

    const { data, error } = await auth.client.rpc('admin_resolve_coin_redemption', {
      p_redemption_id: redemptionId,
      p_status: status,
      p_note: note || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await writeAudit(auth.client, auth.email, 'RESOLVE_REDEMPTION', 'coin_redemption', redemptionId, {
      status,
      note: note || null,
    })
    return NextResponse.json({ ok: true, redemption: data })
  }

  if (action === 'DELETE_LEGACY') {
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const entity = typeof body.entity === 'string' ? body.entity.toUpperCase() : ''
    if (!id || !['CONTACT', 'NEWSLETTER', 'ALERT'].includes(entity)) {
      return NextResponse.json({ error: 'Invalid legacy record' }, { status: 400 })
    }
    const db = await getSafeDb()
    if (!db) return NextResponse.json({ error: 'Legacy database unavailable' }, { status: 503 })

    if (entity === 'CONTACT') await db.contactSubmission.delete({ where: { id } })
    if (entity === 'NEWSLETTER') await db.newsletterSubscription.delete({ where: { id } })
    if (entity === 'ALERT') await db.priceAlert.delete({ where: { id } })
    await writeAudit(auth.client, auth.email, 'DELETE_LEGACY', entity.toLowerCase(), id, {})
    return NextResponse.json({ ok: true })
  }

  if (action === 'TOGGLE_ALERT') {
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!id || typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid alert update' }, { status: 400 })
    }
    const db = await getSafeDb()
    if (!db) return NextResponse.json({ error: 'Legacy database unavailable' }, { status: 503 })
    await db.priceAlert.update({ where: { id }, data: { active: body.active } })
    await writeAudit(auth.client, auth.email, 'TOGGLE_ALERT', 'alert', id, { active: body.active })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown admin action' }, { status: 400 })
}
