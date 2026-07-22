import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { requireAuthenticatedAccount } from '@/lib/server-admin-auth'
import { z } from 'zod'

const createAlertSchema = z.object({
  zone: z.string().trim().max(100).optional(),
  propertyType: z.string().trim().max(40).optional(),
  minPrice: z.number().positive().max(100_000_000).optional().nullable(),
  maxPrice: z.number().positive().max(100_000_000).optional().nullable(),
  minRooms: z.int().min(1).optional().nullable(),
})

function accountEmail(email: string): string | null {
  return email || null
}

export async function GET(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if ('response' in account) return account.response

  const email = accountEmail(account.email)
  if (!email) {
    return NextResponse.json({ error: 'Contul nu are o adresa de email valida.' }, { status: 422 })
  }

  const db = await getSafeDb()
  if (!db) {
    return NextResponse.json({ error: 'Serviciul de alerte nu este disponibil.' }, { status: 503 })
  }

  try {
    const alerts = await db.priceAlert.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Price alert list error:', error)
    return NextResponse.json({ error: 'Eroare la incarcarea alertelor.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const account = await requireAuthenticatedAccount(request)
  if ('response' in account) return account.response

  const email = accountEmail(account.email)
  if (!email) {
    return NextResponse.json({ error: 'Contul nu are o adresa de email valida.' }, { status: 422 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  const result = createAlertSchema.safeParse(body)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return NextResponse.json(
      { error: firstError?.message || 'Date invalide.' },
      { status: 400 },
    )
  }

  const { zone, propertyType, minPrice, maxPrice, minRooms } = result.data
  if (minPrice != null && maxPrice != null && maxPrice <= minPrice) {
    return NextResponse.json(
      { error: 'Pretul maxim trebuie sa fie mai mare decat pretul minim.' },
      { status: 400 },
    )
  }

  const db = await getSafeDb()
  if (!db) {
    return NextResponse.json({ error: 'Serviciul de alerte nu este disponibil.' }, { status: 503 })
  }

  try {
    const alert = await db.priceAlert.create({
      data: {
        email,
        zone: zone || null,
        propertyType: propertyType || null,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        minRooms: minRooms ?? null,
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Price alert create error:', error)
    return NextResponse.json({ error: 'Eroare la crearea alertei.' }, { status: 500 })
  }
}
