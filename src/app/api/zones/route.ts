import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { MOCK_ZONES_WITH_COUNTS } from '@/lib/mock-data'

export async function GET() {
  try {
    const zones = await db.zone.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    // Get property counts per zone
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
    console.error('Error fetching zones:', error)
    // Fallback mock data for environments without database (e.g., Cloudflare Workers)
    return NextResponse.json({ zones: MOCK_ZONES_WITH_COUNTS })
  }
}