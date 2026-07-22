import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { requireStaff } from '@/lib/server-admin-auth'
import { hasLegacyCrmModels } from '@/lib/legacy-crm'
import {
  canTransitionOffer,
  isTerminalOfferStatus,
  isValidOfferStatus,
  type OfferActor,
  type OfferStatus,
} from '@/lib/offers'
import { notifyOfferStatus } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// ─── GET /api/offers/:id ──────────────────────────────────────
export async function GET(request: NextRequest, context: Ctx) {
  const staff = await requireStaff(request)
  if ('response' in staff) return staff.response

  const { id } = await context.params
  const db = await getSafeDb()
  if (!db || !hasLegacyCrmModels(db)) return NextResponse.json({ error: 'Ofertele legacy nu sunt disponibile in acest mediu.' }, { status: 503 })

  try {
    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        property: true,
        agent: true,
        lead: true,
        parentOffer: true,
        counterOffers: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!offer) return NextResponse.json({ error: 'Ofertă negăsită.' }, { status: 404 })
    return NextResponse.json({ offer })
  } catch (error) {
    console.error('[offers/:id GET]', error)
    return NextResponse.json({ error: 'Eroare la încărcare.' }, { status: 500 })
  }
}

// ─── PATCH /api/offers/:id ────────────────────────────────────
// Transition status: ACCEPTED | REJECTED | WITHDRAWN | COUNTERED
// Body: { status, actor, responseNote?, amount? (for agent-side update) }
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
  if (!db || !hasLegacyCrmModels(db)) return NextResponse.json({ error: 'Ofertele legacy nu sunt disponibile in acest mediu.' }, { status: 503 })

  try {
    const existing = await db.offer.findUnique({
      where: { id },
      include: { property: { select: { title: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Ofertă negăsită.' }, { status: 404 })

    const current = existing.status as OfferStatus
    if (isTerminalOfferStatus(current)) {
      return NextResponse.json(
        { error: `Oferta este deja finalizată (${current}).` },
        { status: 422 },
      )
    }

    const actor = (typeof body.actor === 'string' ? body.actor : 'agent') as OfferActor
    const nextStatus = body.status

    if (nextStatus !== undefined) {
      if (!isValidOfferStatus(nextStatus)) {
        return NextResponse.json({ error: 'Status invalid.' }, { status: 400 })
      }
      if (!canTransitionOffer(current, nextStatus as OfferStatus, actor)) {
        return NextResponse.json(
          { error: `Tranziție nepermisă: ${current} → ${nextStatus} (actor: ${actor}).` },
          { status: 422 },
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (nextStatus) {
      data.status = nextStatus
      data.respondedAt = new Date()
    }
    if (typeof body.responseNote === 'string') {
      data.responseNote = body.responseNote.trim()
    }
    if (typeof body.message === 'string') {
      data.message = body.message.trim()
    }
    if (typeof body.conditions === 'string') {
      data.conditions = body.conditions.trim()
    }
    if (typeof body.amount === 'number' && body.amount > 0 && actor !== 'buyer') {
      // agents/owners may adjust recorded amount on counter acceptance flows
      data.amount = body.amount
    }

    const offer = await db.offer.update({
      where: { id },
      data,
      include: {
        property: { select: { id: true, title: true, slug: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    })

    // Notify buyer on terminal / important transitions
    if (nextStatus && ['ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED'].includes(nextStatus as string)) {
      void notifyOfferStatus({
        to: existing.buyerEmail,
        buyerName: existing.buyerName,
        propertyTitle: existing.property?.title || 'proprietate',
        amount: offer.amount,
        currency: offer.currency,
        status: nextStatus as string,
        note: typeof body.responseNote === 'string' ? body.responseNote : undefined,
      })
    }

    // If accepted and linked to lead → mark WON
    if (nextStatus === 'ACCEPTED' && existing.leadId) {
      try {
        await db.lead.update({
          where: { id: existing.leadId },
          data: {
            status: 'WON',
            activities: {
              create: {
                type: 'OFFER',
                body: `Ofertă acceptată: ${offer.amount} ${offer.currency}.`,
                actorName: typeof body.actorName === 'string' ? body.actorName : actor,
                metadata: JSON.stringify({ offerId: offer.id }),
              },
            },
          },
        })
      } catch (e) {
        console.error('[offers] lead WON update failed:', e)
      }
    }

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('[offers/:id PATCH]', error)
    return NextResponse.json({ error: 'Nu am putut actualiza oferta.' }, { status: 500 })
  }
}
