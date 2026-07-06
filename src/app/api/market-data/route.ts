export const dynamic = "force-static";
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [zones, weeklyData, totalProperties] = await Promise.all([
      db.zone.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      db.marketData.findMany({
        orderBy: [{ week: 'asc' }, { zone: 'asc' }],
      }),
      db.property.count({ where: { status: 'PUBLISHED' } }),
    ])

    // Calculate overall average price per sqm
    const avgResult = await db.property.aggregate({
      _avg: { pricePerSqm: true },
      where: { status: 'PUBLISHED', pricePerSqm: { not: null } },
    })
    const avgPriceSqm = avgResult._avg.pricePerSqm
      ? Math.round(avgResult._avg.pricePerSqm)
      : 0

    // Find top zone by average price
    const topZone = zones.length > 0 ? zones.reduce((top, z) => {
      return (z.avgPriceSqm ?? 0) > (top.avgPriceSqm ?? 0) ? z : top
    }, zones[0]) : null

    return NextResponse.json({
      zones,
      weeklyData,
      summary: {
        totalProperties,
        avgPriceSqm,
        totalZones: zones.length,
        topZone: topZone ? { name: topZone.name, avgPriceSqm: topZone.avgPriceSqm } : null,
      },
    })
  } catch (error) {
    console.error('Error fetching market data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}