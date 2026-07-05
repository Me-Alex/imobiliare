import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
  try {
    // Use raw query for PriceAlert (table exists but Prisma client is cached pre-schema change)
    const alerts = await db.$queryRaw<Array<{
      id: string; email: string; zone: string | null; propertyType: string | null;
      minPrice: number | null; maxPrice: number | null; minRooms: number | null;
      active: boolean; createdAt: string;
    }>>`SELECT * FROM PriceAlert ORDER BY "createdAt" DESC`
    return NextResponse.json(alerts)
  } catch {
    return NextResponse.json({ error: 'Eroare la incarcarea alertelor.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Use raw query to bypass cached Prisma schema
    const alert = await db.$queryRaw<Array<{ id: string }>>`
      INSERT INTO PriceAlert (id, email, zone, "propertyType", "minPrice", "maxPrice", "minRooms", active, "createdAt")
      VALUES (lower(hex(randomblob(12))), ${email}, ${zone || null}, ${propertyType || null}, ${minPrice ?? null}, ${maxPrice ?? null}, ${minRooms ?? null}, true, datetime('now'))
      RETURNING id
    `

    return NextResponse.json(alert[0], { status: 201 })
  } catch (error) {
    console.error('Price alert create error:', error)
    return NextResponse.json({ error: 'Eroare la crearea alertei.' }, { status: 500 })
  }
}