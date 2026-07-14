import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PROPERTIES } from '@/lib/mock-data'

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
    // Fallback mock data for environments without database (e.g., Cloudflare Workers)
    const body = request.json ? await request.json().catch(() => ({ ids: [] })) : { ids: [] }
    const { ids } = body as { ids?: string[] }
    const properties = ids ? MOCK_PROPERTIES.filter(p => ids.includes(p.id)) : []
    if (properties.length < 2) {
      return NextResponse.json(
        { error: 'Nu s-au găsit suficiente proprietăți valide.' },
        { status: 404 }
      )
    }
    return NextResponse.json({ properties })
  }
}