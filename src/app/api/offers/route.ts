import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { requireStaff } from '@/lib/server-admin-auth'
import { hasLegacyCrmModels } from '@/lib/legacy-crm'
import { isValidOfferStatus } from '@/lib/offers'
import { notifyOfferStatus } from '@/lib/notifications'
import { isValidEmail } from '@/lib/validators'

export const dynamic = 'force-dynamic'

// ─── GET /api/offers ──────────────────────────────────────────
// Query: propertyId, leadId, buyerUserId, status, page, pageSize
export async function GET(request: NextRequest) {
  const staff = await requireStaff(request)
  if ('response' in staff) return staff.response

  const db = await getSafeDb()
  if (!db || !hasLegacyCrmModels(db)) {
    return NextResponse.json({ error: 'Ofertele legacy nu sunt disponibile in acest mediu.' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('propertyId')
  const leadId = searchParams.get('leadId')
  const buyerUserId = searchParams.get('buyerUserId')
  const status = searchParams.get('status')
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20))

  const where: Record<string, unknown> = {}
  if (propertyId) where.propertyId = propertyId
  if (leadId) where.leadId = leadId
  if (buyerUserId) where.buyerUserId = buyerUserId
  if (status && isValidOfferStatus(status)) where.status = status

  try {
    const [total, offers] = await Promise.all([
      db.offer.count({ where }),
      db.offer.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, slug: true, zone: true, price: true, currency: true } },
          agent: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, name: true, email: true, status: true } },
          counterOffers: {
            select: { id: true, amount: true, currency: true, status: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      offers,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    })
  } catch (error) {
    console.error('[offers GET]', error)
    return NextResponse.json({ error: 'Nu am putut încărca ofertele.' }, { status: 500 })
  }
}

// ─── POST /api/offers ─────────────────────────────────────────
// Create a new offer (or counter-offer if parentOfferId is set)
export async function POST(request: NextRequest) {
  const staff = await requireStaff(request)
  if ('response' in staff) return staff.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalid.' }, { status: 400 })
  }

  const propertyId = typeof body.propertyId === 'string' ? body.propertyId : ''
  const buyerName = typeof body.buyerName === 'string' ? body.buyerName.trim() : ''
  const buyerEmail = typeof body.buyerEmail === 'string' ? body.buyerEmail.trim().toLowerCase() : ''
  const buyerPhone = typeof body.buyerPhone === 'string' ? body.buyerPhone.trim() : undefined
  const buyerUserId = typeof body.buyerUserId === 'string' ? body.buyerUserId : undefined
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  const currency = typeof body.currency === 'string' ? body.currency : 'EUR'
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const conditions = typeof body.conditions === 'string' ? body.conditions.trim() : ''
  const leadId = typeof body.leadId === 'string' ? body.leadId : undefined
  const agentId = typeof body.agentId === 'string' ? body.agentId : undefined
  const parentOfferId = typeof body.parentOfferId === 'string' ? body.parentOfferId : undefined
  const validUntil = typeof body.validUntil === 'string' ? new Date(body.validUntil) : undefined

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId este obligatoriu.' }, { status: 400 })
  }
  if (buyerName.length < 2) {
    return NextResponse.json({ error: 'Numele cumpărătorului este obligatoriu.' }, { status: 400 })
  }
  if (!isValidEmail(buyerEmail)) {
    return NextResponse.json({ error: 'Email invalid.' }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Suma ofertei trebuie să fie un număr pozitiv.' }, { status: 400 })
  }

  const db = await getSafeDb()
  if (!db || !hasLegacyCrmModels(db)) {
    return NextResponse.json({ error: 'Ofertele legacy nu sunt disponibile in acest mediu.' }, { status: 503 })
  }

  try {
    // Validate property exists
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, status: true },
    })
    if (!property) {
      return NextResponse.json({ error: 'Proprietatea nu există.' }, { status: 404 })
    }

    // If countering, mark parent and set status
    let status = 'SUBMITTED'
    if (parentOfferId) {
      const parent = await db.offer.findUnique({ where: { id: parentOfferId } })
      if (!parent) {
        return NextResponse.json({ error: 'Oferta părinte nu există.' }, { status: 404 })
      }
      if (parent.status !== 'SUBMITTED' && parent.status !== 'COUNTERED') {
        return NextResponse.json(
          { error: `Nu poți face contraofertă pe o ofertă în status ${parent.status}.` },
          { status: 422 },
        )
      }
      status = 'COUNTERED'
      // Mark parent as COUNTERED if it was SUBMITTED
      if (parent.status === 'SUBMITTED') {
        await db.offer.update({
          where: { id: parentOfferId },
          data: { status: 'COUNTERED', respondedAt: new Date() },
        })
      }
    }

    const offer = await db.offer.create({
      data: {
        propertyId,
        leadId: leadId || null,
        buyerUserId: buyerUserId || null,
        buyerName,
        buyerEmail,
        buyerPhone: buyerPhone || null,
        agentId: agentId || null,
        status,
        amount,
        currency,
        message,
        conditions,
        parentOfferId: parentOfferId || null,
        validUntil: validUntil || null,
      },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    })

    // If linked to a lead, bump lead status toward OFFER
    if (leadId) {
      try {
        const lead = await db.lead.findUnique({ where: { id: leadId } })
        if (lead && lead.status !== 'WON' && lead.status !== 'LOST' && lead.status !== 'OFFER') {
          await db.lead.update({
            where: { id: leadId },
            data: {
              status: 'OFFER',
              activities: {
                create: {
                  type: 'OFFER',
                  body: `Ofertă ${amount} ${currency} pe „${property.title}”.`,
                  actorName: buyerName,
                  metadata: JSON.stringify({ offerId: offer.id, amount, currency }),
                },
              },
            },
          })
        }
      } catch (e) {
        console.error('[offers] lead status bump failed:', e)
      }
    }

    // Notify buyer of submission confirmation
    void notifyOfferStatus({
      to: buyerEmail,
      buyerName,
      propertyTitle: property.title,
      amount,
      currency,
      status: offer.status,
    })

    return NextResponse.json({ offer }, { status: 201 })
  } catch (error) {
    console.error('[offers POST]', error)
    return NextResponse.json({ error: 'Nu am putut crea oferta.' }, { status: 500 })
  }
}
