import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const alert = await db.priceAlert.findUnique({ where: { id } })
    if (!alert) {
      return NextResponse.json({ error: 'Alerta nu a fost gasita.' }, { status: 404 })
    }

    await db.priceAlert.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Price alert delete error:', error)
    return NextResponse.json({ error: 'Eroare la dezactivarea alertei.' }, { status: 500 })
  }
}