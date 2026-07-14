import { NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { MOCK_ZONES } from '@/lib/mock-data'

export async function GET() {
  const db = await getSafeDb()
  if (db) {
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

      const avgResult = await db.property.aggregate({
        _avg: { pricePerSqm: true },
        where: { status: 'PUBLISHED', pricePerSqm: { not: null } },
      })
      const avgPriceSqm = avgResult._avg.pricePerSqm
        ? Math.round(avgResult._avg.pricePerSqm)
        : 0

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
      console.error('DB query error, falling back to mock:', error)
    }
  }

  // Fallback mock data
  return NextResponse.json({
    zones: MOCK_ZONES,
    weeklyData: [],
    summary: { totalProperties: 9, avgPriceSqm: 2500, totalZones: 9, topZone: { name: 'Dorobanti', avgPriceSqm: 3200 } }
  })
}