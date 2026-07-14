import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PROPERTIES } from '@/lib/mock-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const property = await db.property.findUnique({
      where: { slug },
      include: {
        analytics: {
          orderBy: { week: 'asc' },
          take: 12,
        },
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Error fetching property:', error)
    // Fallback mock data for environments without database (e.g., Cloudflare Workers)
    const property = MOCK_PROPERTIES.find(p => p.slug === slug)
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ property })
  }
}