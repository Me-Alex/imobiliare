import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().optional(),
  propertyId: z.string().min(1),
  propertyTitle: z.string().min(1),
  propertyZone: z.string().optional(),
  staffId: z.string().optional(),
  staffName: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  notes: z.string().default(''),
})

// GET /api/vizionari?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId este necesar' }, { status: 400 })
    }

    const vizionari = await db.vizionare.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ vizionari })
  } catch (error) {
    console.error('GET /api/vizionari error:', error)
    return NextResponse.json({ error: 'Eroare la incarcarea vizionarilor' }, { status: 500 })
  }
}

// POST /api/vizionari
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Date invalide', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check for conflicting bookings
    if (data.staffId) {
      const conflicting = await db.vizionare.findFirst({
        where: {
          staffId: data.staffId,
          date: data.date,
          startTime: data.startTime,
          status: { in: ['pending', 'confirmed'] },
        },
      })

      if (conflicting) {
        return NextResponse.json(
          { error: 'Acest interval este deja rezervat. Te rugam sa alegi alt ora.' },
          { status: 409 }
        )
      }
    }

    const vizionare = await db.vizionare.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        propertyId: data.propertyId,
        propertyTitle: data.propertyTitle,
        propertyZone: data.propertyZone,
        staffId: data.staffId,
        staffName: data.staffName,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
      },
    })

    return NextResponse.json({ vizionare }, { status: 201 })
  } catch (error) {
    console.error('POST /api/vizionari error:', error)
    return NextResponse.json({ error: 'Eroare la salvarea vizionarii' }, { status: 500 })
  }
}

// PATCH /api/vizionari?id=xxx
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id este necesar' }, { status: 400 })
    }

    const body = await request.json()
    const { status, notes } = body as { status?: string; notes?: string }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const vizionare = await db.vizionare.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ vizionare })
  } catch (error) {
    console.error('PATCH /api/vizionari error:', error)
    return NextResponse.json({ error: 'Eroare la actualizarea vizionarii' }, { status: 500 })
  }
}

// DELETE /api/vizionari?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id este necesar' }, { status: 400 })
    }

    await db.vizionare.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/vizionari error:', error)
    return NextResponse.json({ error: 'Eroare la stergerea vizionarii' }, { status: 500 })
  }
}