import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { MOCK_PROPERTIES } from '@/lib/mock-data'
import { getPublishedSupabaseProperties } from '@/lib/supabase-properties'
import type { Property } from '@/lib/types'

function sameValue(value: string, expected: string): boolean {
  return value.toLocaleLowerCase('ro-RO') === expected.toLocaleLowerCase('ro-RO')
}
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const zone = searchParams.get('zone')
  const transaction = searchParams.get('transaction')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const rooms = searchParams.get('rooms') || searchParams.get('minRooms')
  const minArea = searchParams.get('minArea')
  const maxArea = searchParams.get('maxArea')
  const sort = searchParams.get('sort') || 'newest'
  const featured = searchParams.get('featured')
  const query = searchParams.get('q') || searchParams.get('search')
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 12))

  let baseProperties: Property[] = MOCK_PROPERTIES as Property[]
  const db = await getSafeDb()
  if (db) {
    try {
      baseProperties = await db.property.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
      }) as unknown as Property[]
    } catch (error) {
      console.error('DB property query failed, keeping demo catalogue:', error)
    }
  }

  const supabaseProperties = await getPublishedSupabaseProperties()
  const merged = new Map<string, Property>()
  baseProperties.forEach((property) => merged.set(property.slug, property))
  supabaseProperties.forEach((property) => merged.set(property.slug, property))
  let filtered = Array.from(merged.values()).filter((property) => property.status === 'PUBLISHED')

  if (type) filtered = filtered.filter((property) => sameValue(property.type, type))
  if (zone) filtered = filtered.filter((property) => sameValue(property.zone, zone))
  if (transaction) filtered = filtered.filter((property) => sameValue(property.transaction, transaction))
  if (featured === 'true') filtered = filtered.filter((property) => property.featured)
  if (minPrice) filtered = filtered.filter((property) => property.price >= Number(minPrice))
  if (maxPrice) filtered = filtered.filter((property) => property.price <= Number(maxPrice))
  if (rooms) filtered = filtered.filter((property) => property.rooms >= Number(rooms))
  if (minArea) filtered = filtered.filter((property) => property.areaSqm >= Number(minArea))
  if (maxArea) filtered = filtered.filter((property) => property.areaSqm <= Number(maxArea))
  if (query) {
    const normalizedQuery = query.toLocaleLowerCase('ro-RO')
    filtered = filtered.filter((property) => [
      property.title,
      property.description,
      property.address,
      property.zone,
    ].some((value) => value.toLocaleLowerCase('ro-RO').includes(normalizedQuery)))
  }

  switch (sort) {
    case 'priceAsc':
      filtered.sort((a, b) => a.price - b.price)
      break
    case 'priceDesc':
      filtered.sort((a, b) => b.price - a.price)
      break
    case 'areaDesc':
      filtered.sort((a, b) => b.areaSqm - a.areaSqm)
      break
    default:
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const properties = filtered.slice(start, start + pageSize)
  return NextResponse.json({
    properties,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  })
}
