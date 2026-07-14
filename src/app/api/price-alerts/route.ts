import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { z } from 'zod'

const createAlertSchema = z.object({
  email: z.email('Email invalid'),
  zone: z.string().optional(),
  propertyType: z.string().optional(),
  minPrice: z.number().positive().optional().nullable(),
  maxPrice: z.number().positive().optional().nullable(),
  minRooms: z.int().min(1).optional().nullable(),
})

export async function GET() {
  const db = await getSafeDb()
  if (!db) {
    return NextResponse.json([])
  }

  try {
    const alerts = await db.priceAlert.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Price alert list error:', error)
    return NextResponse.json({ error: 'Eroare la incarcarea alertelor.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = createAlertSchema.safeParse(body)

  if (!result.success) {
    const firstError = result.error.issues[0]
    return NextResponse.json(
      { error: firstError?.message || 'Date invalide.' },
      { status: 400 }
    )
  }

  const { email, zone, propertyType, minPrice, maxPrice, minRooms } = result.data

  if (minPrice != null && maxPrice != null && maxPrice <= minPrice) {
    return NextResponse.json(
      { error: 'Pretul maxim trebuie sa fie mai mare decat pretul minim.' },
      { status: 400 }
    )
  }

  const db = await getSafeDb()
  if (!db) {
    // Edge mode — accept alert silently (demo mode)
    return NextResponse.json({
      id: 'demo-' + Date.now(),
      email,
      zone: zone || null,
      propertyType: propertyType || null,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      minRooms: minRooms ?? null,
      active: true,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
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