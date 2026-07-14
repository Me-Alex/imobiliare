import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { MOCK_PROPERTIES } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { ids } = body as { ids?: string[] }

  if (!ids || !Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
    return NextResponse.json(
      { error: 'Trebuie să trimiți între 2 și 3 ID-uri valide.' },
      { status: 400 }
    )
  }

  const db = await getSafeDb()
  if (db) {
    try {
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
      console.error('DB query error, falling back to mock:', error)
    }
  }

  // Fallback mock data
  const properties = MOCK_PROPERTIES.filter(p => ids.includes(p.id))
  if (properties.length < 2) {
    return NextResponse.json(
      { error: 'Nu s-au găsit suficiente proprietăți valide.' },
      { status: 404 }
    )
  }
  return NextResponse.json({ properties })
}