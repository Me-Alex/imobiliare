import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

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
    console.error('Error fetching search suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search suggestions' },
      { status: 500 }
    )
  }
}