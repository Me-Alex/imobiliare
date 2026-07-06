export const dynamic = "force-static";
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body as { ids?: string[] }

    if (!ids || !Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
      return NextResponse.json(
        { error: 'Trebuie să trimiți între 2 și 3 ID-uri valide.' },
        { status: 400 }
      )
    }

    const properties = await db.property.findMany({
      where: { id: { in: ids } },
    })

    if (properties.length < 2) {
      return NextResponse.json(
        { error: 'Nu s-au găsit suficiente proprietăți valide.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Eroare la comparare proprietăți:', error)
    return NextResponse.json(
      { error: 'A apărut o eroare la încărcarea datelor.' },
      { status: 500 }
    )
  }
}