export const dynamic = "force-static";
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
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

    const where: Prisma.PropertyWhereInput = { status: 'PUBLISHED' }

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

    let orderBy: Prisma.PropertyOrderByWithRelationInput
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
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}