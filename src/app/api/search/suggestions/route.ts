export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { MOCK_ZONES, MOCK_PROPERTIES } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const db = await getSafeDb()
  if (db) {
    try {
      const [zones, properties] = await Promise.all([
        db.zone.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { sector: { contains: q } },
            ],
          },
          take: 5,
          orderBy: { sortOrder: 'asc' },
        }),
        db.property.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { title: { contains: q } },
              { address: { contains: q } },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            zone: true,
            type: true,
            transaction: true,
            price: true,
            areaSqm: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      const suggestions = [
        ...zones.map((z) => ({
          type: 'zone' as const,
          name: z.name,
          sector: z.sector,
          avgPriceSqm: z.avgPriceSqm,
        })),
        ...properties.map((p) => ({
          type: 'property' as const,
          name: p.title,
          slug: p.slug,
          zone: p.zone,
          propertyType: p.type,
          transaction: p.transaction,
          price: p.price,
          areaSqm: p.areaSqm,
        })),
      ]

      return NextResponse.json({ suggestions })
    } catch (error) {
      console.error('DB query error, falling back to mock:', error)
    }
  }

  // Fallback: search mock data
  const ql = q.toLowerCase()
  const matchingZones = MOCK_ZONES.filter(
    z => z.name.toLowerCase().includes(ql) || z.sector.toLowerCase().includes(ql)
  ).slice(0, 5)
  const matchingProperties = MOCK_PROPERTIES.filter(
    p => p.title.toLowerCase().includes(ql) || p.address.toLowerCase().includes(ql)
  ).slice(0, 5)

  const suggestions = [
    ...matchingZones.map(z => ({
      type: 'zone' as const,
      name: z.name,
      sector: z.sector,
      avgPriceSqm: z.avgPriceSqm,
    })),
    ...matchingProperties.map(p => ({
      type: 'property' as const,
      name: p.title,
      slug: p.slug,
      zone: p.zone,
      propertyType: p.type,
      transaction: p.transaction,
      price: p.price,
      areaSqm: p.areaSqm,
    })),
  ]

  return NextResponse.json({ suggestions })
}