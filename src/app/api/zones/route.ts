export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { MOCK_ZONES_WITH_COUNTS } from '@/lib/mock-data'

export async function GET() {
  const db = await getSafeDb()
  if (db) {
    try {
      const zones = await db.zone.findMany({
        orderBy: { sortOrder: 'asc' },
      })

      const propertyCounts = await db.property.groupBy({
        by: ['zone'],
        where: { status: 'PUBLISHED' },
        _count: true,
      })

      const countMap = new Map(
        propertyCounts.map((p) => [p.zone, p._count])
      )

      const zonesWithCounts = zones.map((z) => ({
        ...z,
        _count: { properties: countMap.get(z.name) ?? 0 },
      }))

      return NextResponse.json({ zones: zonesWithCounts })
    } catch (error) {
      console.error('DB query error, falling back to mock:', error)
    }
  }

  // Fallback mock data
  return NextResponse.json({ zones: MOCK_ZONES_WITH_COUNTS })
}