export const dynamic = "force-static";
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

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
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    )
  }
}