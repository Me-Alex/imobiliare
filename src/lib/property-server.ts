import { MOCK_PROPERTIES } from '@/lib/mock-data'
import type { D1Database } from '@/lib/db-d1'
import type { Property } from '@/lib/types'
import { getPublishedSupabasePropertyBySlug } from '@/lib/supabase-properties'
import { withDemoVirtualTour } from '@/lib/demo-virtual-tours'

type PropertyRow = Omit<Property, 'featured' | 'createdAt' | 'updatedAt'> & {
  featured: boolean | number
  createdAt: string | Date
  updatedAt: string | Date
}

function normalizeProperty(value: PropertyRow): Property {
  return {
    ...value,
    featured: Boolean(value.featured),
    createdAt: value.createdAt instanceof Date ? value.createdAt.toISOString() : String(value.createdAt),
    updatedAt: value.updatedAt instanceof Date ? value.updatedAt.toISOString() : String(value.updatedAt),
  }
}

export async function getPropertyBySlugServer(slug: string): Promise<Property | null> {
  const supabaseProperty = await getPublishedSupabasePropertyBySlug(slug)
  if (supabaseProperty) return withDemoVirtualTour(supabaseProperty)

  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()
    const d1 = (env as unknown as { DB?: D1Database }).DB

    if (d1) {
      const property = await d1
        .prepare('SELECT * FROM Property WHERE slug = ?1 AND status = ?2 LIMIT 1')
        .bind(slug, 'PUBLISHED')
        .first<PropertyRow>()

      return property ? withDemoVirtualTour(normalizeProperty(property)) : null
    }
  } catch {
    // Standard Node preview has no Cloudflare request context.
  }

  const fallback = MOCK_PROPERTIES.find((property) => property.slug === slug)
  return fallback ? withDemoVirtualTour(normalizeProperty(fallback as PropertyRow)) : null
}
