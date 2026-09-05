import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { getSafeDb } from '@/lib/edge-db'
import { getPublishedSupabaseProperties } from '@/lib/supabase-properties'

vi.mock('@/lib/edge-db', () => ({ getSafeDb: vi.fn() }))
vi.mock('@/lib/supabase-properties', () => ({ getPublishedSupabaseProperties: vi.fn() }))
vi.mock('@/lib/demo-virtual-tours', () => ({ withDemoVirtualTours: (properties: unknown[]) => properties }))
vi.mock('@/lib/mock-data', () => ({ MOCK_PROPERTIES: [] }))

const listings = Array.from({ length: 15 }, (_, index) => ({
  id: String(index), slug: `listing-${index}`, title: 'Apartament în București',
  description: 'Locuință cu terasă', address: 'Șoseaua Ștefan cel Mare', zone: 'Dorobanți',
  type: 'APARTMENT', transaction: 'RENT', status: 'PUBLISHED',
  price: 500 + index, rooms: 2, areaSqm: 60, createdAt: '2026-09-01T00:00:00Z',
}))

async function search(params: Record<string, string> = {}) {
  const response = await GET(new NextRequest(`https://example.test/api/properties?${new URLSearchParams(params)}`))
  expect(response.status).toBe(200)
  return response.json()
}

beforeEach(() => {
  vi.mocked(getSafeDb).mockResolvedValue({
    property: { findMany: vi.fn().mockResolvedValue(listings) },
  } as unknown as NonNullable<Awaited<ReturnType<typeof getSafeDb>>>)
  vi.mocked(getPublishedSupabaseProperties).mockResolvedValue([])
})

describe('property discovery', () => {
  it.each(['bucuresti', ' BUCUREȘTI ', 'terasa', 'soseaua', 'dorobanti'])('matches Romanian text for %s', async (query) => {
    expect((await search({ search: query })).total).toBe(15)
  })

  it('accepts Romanian aliases in filters', async () => {
    expect((await search({ type: ' apartament ', transaction: 'închiriere' })).total).toBe(15)
    expect((await search({ type: 'casă' })).total).toBe(0)
    expect((await search({ transaction: 'vânzare' })).total).toBe(0)
  })

  it.each(['Infinity', '-Infinity', 'NaN', 'invalid', '0', '-2'])('uses safe pagination defaults for %s', async (value) => {
    const result = await search({ page: value, pageSize: value })
    expect(result).toMatchObject({ page: 1, pageSize: 12, total: 15, hasMore: true })
    expect(result.properties).toHaveLength(12)
  })

  it('uses integer page boundaries without repeating or skipping listings', async () => {
    const first = await search({ page: '1.9', pageSize: '4.9' })
    const second = await search({ page: '2.9', pageSize: '4.9' })
    expect(first).toMatchObject({ page: 1, pageSize: 4 })
    expect(second).toMatchObject({ page: 2, pageSize: 4 })
    expect([...first.properties, ...second.properties].map((p: { id: string }) => p.id))
      .toEqual(['0', '1', '2', '3', '4', '5', '6', '7'])
  })

  it('caps page size and returns an empty result past the last page', async () => {
    expect(await search({ pageSize: '1000' })).toMatchObject({ pageSize: 50, hasMore: false })
    expect(await search({ page: '999' })).toMatchObject({ properties: [], hasMore: false, total: 15 })
  })
})
