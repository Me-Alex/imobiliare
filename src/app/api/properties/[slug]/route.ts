import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { MOCK_PROPERTIES } from '@/lib/mock-data'
import { getPublishedSupabasePropertyBySlug } from '@/lib/supabase-properties'
import { withDemoVirtualTour } from '@/lib/demo-virtual-tours'
import type { Property } from '@/lib/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Supabase helper already filters by status = 'PUBLISHED' in SQL.
  const supabaseProperty = await getPublishedSupabasePropertyBySlug(slug)
  if (supabaseProperty) {
    return NextResponse.json({ property: withDemoVirtualTour(supabaseProperty) })
  }

  const db = await getSafeDb()
  if (db) {
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

      // Only expose PUBLISHED listings on the public endpoint. Draft /
      // archived / sold properties are still reachable through the admin
      // or owner dashboards because those have their own scoped queries.
      if (!property || property.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ property: withDemoVirtualTour(property as unknown as Property) })
    } catch (error) {
      console.error('DB query error, falling back to mock:', error)
    }
  }

  // Fallback mock data — also gated to PUBLISHED so a stale mock entry
  // can never leak a non-public listing.
  const property = MOCK_PROPERTIES.find(p => p.slug === slug && p.status === 'PUBLISHED')
  if (!property) {
    return NextResponse.json(
      { error: 'Property not found' },
      { status: 404 }
    )
  }
  return NextResponse.json({ property: withDemoVirtualTour(property as unknown as Property) })
}
