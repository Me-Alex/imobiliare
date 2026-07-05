import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check existence with raw query
    const existing = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM PriceAlert WHERE id = ${id} AND active = true LIMIT 1
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Alerta nu a fost gasita.' }, { status: 404 })
    }

    await db.$executeRaw`
      UPDATE PriceAlert SET active = false WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Eroare la dezactivarea alertei.' }, { status: 500 })
  }
}