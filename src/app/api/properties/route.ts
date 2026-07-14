import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { MOCK_PROPERTIES } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type')
  const zone = searchParams.get('zone')
  const transaction = searchParams.get('transaction')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minRooms = searchParams.get('minRooms')
  const minArea = searchParams.get('minArea')
  const maxArea = searchParams.get('maxArea')
  const sort = searchParams.get('sort') || 'newest'
  const featured = searchParams.get('featured')
  const q = searchParams.get('q') || searchParams.get('search')
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 12))

  // ── Try real database first ───────────────────────────────────
  const db = await getSafeDb()
  if (db) {
    try {
      const where: Record<string, any> = { status: 'PUBLISHED' }

      if (type) where.type = type
      if (zone) where.zone = zone
      if (transaction) where.transaction = transaction
      if (featured === 'true') where.featured = true

      if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) where.price.gte = Number(minPrice)
        if (maxPrice) where.price.lte = Number(maxPrice)
      }

      const rooms = searchParams.get('rooms') || minRooms
      if (rooms) {
        where.rooms = { gte: Number(rooms) }
      }

      if (minArea || maxArea) {
        where.areaSqm = {}
        if (minArea) where.areaSqm.gte = Number(minArea)
        if (maxArea) where.areaSqm.lte = Number(maxArea)
      }

      if (q) {
        where.OR = [
          { title: { contains: q } },
          { description: { contains: q } },
          { address: { contains: q } },
          { zone: { contains: q } },
        ]
      }

      let orderBy: any
      switch (sort) {
        case 'priceAsc':
          orderBy = { price: 'asc' }
          break
        case 'priceDesc':
          orderBy = { price: 'desc' }
          break
        case 'areaDesc':
          orderBy = { areaSqm: 'desc' }
          break
        case 'newest':
        default:
          orderBy = { createdAt: 'desc' }
          break
      }

      const [properties, total] = await Promise.all([
        db.property.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.property.count({ where }),
      ])

      return NextResponse.json({
        properties,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      })
    } catch (error) {
      console.error('DB query error, falling back to mock:', error)
    }
  }

  // ── Fallback: filter mock data client-side ────────────────────
  let filtered = [...MOCK_PROPERTIES]

  if (type) filtered = filtered.filter(p => p.type === type)
  if (zone) filtered = filtered.filter(p => p.zone === zone)
  if (transaction) filtered = filtered.filter(p => p.transaction === transaction)
  if (featured === 'true') filtered = filtered.filter(p => p.featured)
  if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice))
  if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice))
  if (rooms) filtered = filtered.filter(p => p.rooms >= Number(rooms))
  if (minArea) filtered = filtered.filter(p => p.areaSqm >= Number(minArea))
  if (maxArea) filtered = filtered.filter(p => p.areaSqm <= Number(maxArea))
  if (q) {
    const ql = q.toLowerCase()
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(ql) ||
      p.description.toLowerCase().includes(ql) ||
      p.address.toLowerCase().includes(ql) ||
      p.zone.toLowerCase().includes(ql)
    )
  }

  // Sort
  switch (sort) {
    case 'priceAsc':  filtered.sort((a, b) => a.price - b.price); break
    case 'priceDesc': filtered.sort((a, b) => b.price - a.price); break
    case 'areaDesc':  filtered.sort((a, b) => b.areaSqm - a.areaSqm); break
    default:          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  return NextResponse.json({
    properties: paged,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  })
}