import { getSafeDb } from '@/lib/edge-db'
import { MOCK_PROPERTIES } from '@/lib/mock-data'
import type { Property } from '@/lib/types'

export async function getPropertyBySlugServer(slug: string): Promise<Property | null> {
  const db = await getSafeDb()

  if (db) {
    try {
      const property = await db.property.findUnique({ where: { slug } })
      if (property) {
        const value = property as unknown as Omit<Property, 'createdAt' | 'updatedAt'> & {
          createdAt: string | Date
          updatedAt: string | Date
        }
        return {
          ...value,
          featured: Boolean(value.featured),
          createdAt: value.createdAt instanceof Date ? value.createdAt.toISOString() : String(value.createdAt),
          updatedAt: value.updatedAt instanceof Date ? value.updatedAt.toISOString() : String(value.updatedAt),
        }
      }
    } catch (error) {
      console.error('Nu am putut încărca proprietatea din baza de date:', error)
    }
  }

  return (MOCK_PROPERTIES.find((property) => property.slug === slug) as Property | undefined) ?? null
}
