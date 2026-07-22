import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { requireStaff } from '@/lib/server-admin-auth'
import { hasLegacyCrmModels } from '@/lib/legacy-crm'
import {
  canTransitionLead,
  isValidLeadStatus,
  LEAD_PRIORITIES,
  toJsonArray,
  type LeadPriority,
  type LeadStatus,
} from '@/lib/crm'
import { notifyLeadAssigned } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// ─── GET /api/leads/:id ───────────────────────────────────────
export async function GET(request: NextRequest, context: Ctx) {
  const staff = await requireStaff(request)
  if ('response' in staff) return staff.response

  const { id } = await context.params
  const db = await getSafeDb()
  if (!db || !hasLegacyCrmModels(db)) return NextResponse.json({ error: 'CRM legacy indisponibil in acest mediu.' }, { status: 503 })

  try {
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        property: { select: { id: true, title: true, slug: true, zone: true, price: true, currency: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        offers: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!lead) return NextResponse.json({ error: 'Lead negăsit.' }, { status: 404 })
    return NextResponse.json({ lead })
  } catch (error) {
    console.error('[leads/:id GET]', error)
    return NextResponse.json({ error: 'Eroare la încărcare.' }, { status: 500 })
  }
}

// ─── PATCH /api/leads/:id ─────────────────────────────────────
// Supports: status, priority, assignedToId, notes, budget*, preferred*, nextFollowUpAt, lostReason
export async function PATCH(request: NextRequest, context: Ctx) {
  const staff = await requireStaff(request)
  if ('response' in staff) return staff.response

  const { id } = await context.params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  const db = await getSafeDb()
  if (!db || !hasLegacyCrmModels(db)) return NextResponse.json({ error: 'CRM legacy indisponibil in acest mediu.' }, { status: 503 })

  try {
    const existing = await db.lead.findUnique({
      where: { id },
      include: { assignedTo: true, property: { select: { title: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Lead negăsit.' }, { status: 404 })

    const data: Record<string, unknown> = {}
    const activities: Array<{ type: string; body: string; actorName?: string; metadata?: string }> = []

    // Status transition
    if (body.status !== undefined) {
      if (!isValidLeadStatus(body.status)) {
        return NextResponse.json({ error: 'Status invalid.' }, { status: 400 })
      }
      const next = body.status as LeadStatus
      const current = existing.status as LeadStatus
      if (!canTransitionLead(current, next)) {
        return NextResponse.json(
          { error: `Tranziție invalidă: ${current} → ${next}.` },
          { status: 422 },
        )
      }
      if (next !== current) {
        data.status = next
        activities.push({
          type: 'STATUS_CHANGE',
          body: `Status: ${current} → ${next}`,
          actorName: typeof body.actorName === 'string' ? body.actorName : 'system',
          metadata: JSON.stringify({ from: current, to: next }),
        })
        if (next === 'CONTACTED') data.lastContactedAt = new Date()
        if (next === 'LOST' && typeof body.lostReason === 'string') {
          data.lostReason = body.lostReason.trim()
        }
      }
    }

    // Assignment
    if (body.assignedToId !== undefined) {
      const newAssigneeId = body.assignedToId === null || body.assignedToId === '' ? null : String(body.assignedToId)
      if (newAssigneeId !== existing.assignedToId) {
        data.assignedToId = newAssigneeId
        activities.push({
          type: 'ASSIGNMENT',
          body: newAssigneeId
            ? `Asignat agentului ${newAssigneeId}`
            : 'Dezasignat',
          actorName: typeof body.actorName === 'string' ? body.actorName : 'system',
          metadata: JSON.stringify({ from: existing.assignedToId, to: newAssigneeId }),
        })
      }
    }

    // Simple fields
    if (typeof body.priority === 'string' && (LEAD_PRIORITIES as readonly string[]).includes(body.priority)) {
      data.priority = body.priority as LeadPriority
    }
    if (typeof body.notes === 'string') data.notes = body.notes
    if (typeof body.budgetMin === 'number') data.budgetMin = body.budgetMin
    if (typeof body.budgetMax === 'number') data.budgetMax = body.budgetMax
    if (body.preferredZones !== undefined) data.preferredZones = toJsonArray(body.preferredZones)
    if (body.preferredTypes !== undefined) data.preferredTypes = toJsonArray(body.preferredTypes)
    if (typeof body.transaction === 'string') data.transaction = body.transaction
    if (typeof body.nextFollowUpAt === 'string') {
      data.nextFollowUpAt = new Date(body.nextFollowUpAt)
    }
    if (typeof body.lostReason === 'string' && data.status !== 'LOST') {
      // allow setting reason without status change
      data.lostReason = body.lostReason.trim()
    }

    // Optional activity note
    if (typeof body.activityNote === 'string' && body.activityNote.trim()) {
      activities.push({
        type: typeof body.activityType === 'string' ? body.activityType : 'NOTE',
        body: body.activityNote.trim(),
        actorName: typeof body.actorName === 'string' ? body.actorName : 'agent',
      })
    }

    const lead = await db.lead.update({
      where: { id },
      data: {
        ...data,
        ...(activities.length > 0
          ? {
              activities: {
                create: activities.map((a) => ({
                  type: a.type,
                  body: a.body,
                  actorName: a.actorName || null,
                  metadata: a.metadata || '{}',
                })),
              },
            }
          : {}),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true, slug: true } },
      },
    })

    // Notify on new assignment
    if (
      data.assignedToId &&
      lead.assignedTo?.email &&
      data.assignedToId !== existing.assignedToId
    ) {
      void notifyLeadAssigned({
        leadName: lead.name,
        leadEmail: lead.email,
        agentName: lead.assignedTo.name,
        agentEmail: lead.assignedTo.email,
        propertyTitle: lead.property?.title,
      })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('[leads/:id PATCH]', error)
    return NextResponse.json({ error: 'Nu am putut actualiza lead-ul.' }, { status: 500 })
  }
}

// ─── DELETE /api/leads/:id ────────────────────────────────────
export async function DELETE(request: NextRequest, context: Ctx) {
  const staff = await requireStaff(request)
  if ('response' in staff) return staff.response

  const { id } = await context.params
  const db = await getSafeDb()
  if (!db || !hasLegacyCrmModels(db)) return NextResponse.json({ error: 'CRM legacy indisponibil in acest mediu.' }, { status: 503 })

  try {
    await db.lead.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Lead negăsit sau nu poate fi șters.' }, { status: 404 })
  }
}
