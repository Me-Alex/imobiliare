import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import {
  canTransitionLead,
  isValidLeadStatus,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  toJsonArray,
  type LeadPriority,
  type LeadSource,
  type LeadStatus,
} from '@/lib/crm'
import { notifyLeadAssigned, notifyNewLeadToTeam } from '@/lib/notifications'
import { isValidEmail } from '@/lib/validators'

export const dynamic = 'force-dynamic'

function parseList(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ─── GET /api/leads ───────────────────────────────────────────
// Query: status, assignedToId, source, q, page, pageSize
export async function GET(request: NextRequest) {
  const db = await getSafeDb()
  if (!db) {
    return NextResponse.json({ leads: [], total: 0, page: 1, pageSize: 20 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const assignedToId = searchParams.get('assignedToId')
  const source = searchParams.get('source')
  const q = searchParams.get('q')?.trim()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20))

  const where: Record<string, unknown> = {}
  if (status && isValidLeadStatus(status)) where.status = status
  if (assignedToId) where.assignedToId = assignedToId
  if (source) where.source = source
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { notes: { contains: q } },
    ]
  }

  try {
    const [total, leads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          property: { select: { id: true, title: true, slug: true, zone: true } },
          _count: { select: { activities: true, offers: true } },
        },
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      leads,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    })
  } catch (error) {
    console.error('[leads GET]', error)
    return NextResponse.json({ error: 'Nu am putut încărca lead-urile.' }, { status: 500 })
  }
}

// ─── POST /api/leads ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  const source = (typeof body.source === 'string' ? body.source : 'website') as LeadSource
  const priority = (typeof body.priority === 'string' ? body.priority : 'NORMAL') as LeadPriority
  const propertyId = typeof body.propertyId === 'string' ? body.propertyId : undefined
  const clientUserId = typeof body.clientUserId === 'string' ? body.clientUserId : undefined
  const transaction = typeof body.transaction === 'string' ? body.transaction : undefined
  const budgetMin = typeof body.budgetMin === 'number' ? body.budgetMin : undefined
  const budgetMax = typeof body.budgetMax === 'number' ? body.budgetMax : undefined
  const assignedToId = typeof body.assignedToId === 'string' ? body.assignedToId : undefined

  if (name.length < 2) {
    return NextResponse.json({ error: 'Numele este obligatoriu (min. 2 caractere).' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Email invalid.' }, { status: 400 })
  }
  if (!(LEAD_SOURCES as readonly string[]).includes(source)) {
    return NextResponse.json({ error: 'Sursă invalidă.' }, { status: 400 })
  }
  if (!(LEAD_PRIORITIES as readonly string[]).includes(priority)) {
    return NextResponse.json({ error: 'Prioritate invalidă.' }, { status: 400 })
  }

  const db = await getSafeDb()
  if (!db) {
    // Demo mode — accept without persistence
    return NextResponse.json({
      lead: {
        id: `demo-${Date.now()}`,
        name,
        email,
        phone,
        status: 'NEW',
        source,
        priority,
      },
      demo: true,
    })
  }

  try {
    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        notes,
        source,
        priority,
        status: 'NEW',
        propertyId: propertyId || null,
        clientUserId: clientUserId || null,
        transaction: transaction || null,
        budgetMin: budgetMin ?? null,
        budgetMax: budgetMax ?? null,
        preferredZones: toJsonArray(body.preferredZones),
        preferredTypes: toJsonArray(body.preferredTypes),
        assignedToId: assignedToId || null,
        activities: {
          create: {
            type: 'NOTE',
            actorName: 'system',
            body: `Lead creat din sursa „${source}”.`,
            metadata: JSON.stringify({ source }),
          },
        },
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true, slug: true } },
      },
    })

    // Notify team (non-blocking)
    const teamEmails = parseList(process.env.CRM_TEAM_EMAILS) || []
    if (teamEmails.length > 0) {
      void notifyNewLeadToTeam({
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        source,
        propertyTitle: lead.property?.title,
        teamEmails,
      })
    }

    // Notify assigned agent if set at creation
    if (lead.assignedTo?.email) {
      void notifyLeadAssigned({
        leadName: name,
        leadEmail: email,
        agentName: lead.assignedTo.name,
        agentEmail: lead.assignedTo.email,
        propertyTitle: lead.property?.title,
      })
    }

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('[leads POST]', error)
    return NextResponse.json({ error: 'Nu am putut crea lead-ul.' }, { status: 500 })
  }
}
