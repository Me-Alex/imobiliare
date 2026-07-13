'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { formatPrice } from '@/lib/utils'
import type { Property } from '@/lib/types'

const STORAGE_KEY = 'pm-recently-viewed'
const MAX_RECENT = 4

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}

const typeColors: Record<string, string> = {
  APARTMENT: 'bg-primary/15 text-primary border-primary/20',
  HOUSE: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  VILLA: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
  LAND: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
  COMMERCIAL: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
}

function getRecentlyViewedSlugs(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addToRecentlyViewed(slug: string): string[] {
  const current = getRecentlyViewedSlugs()
  const filtered = current.filter((s) => s !== slug)
  const updated = [slug, ...filtered].slice(0, MAX_RECENT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

async function fetchPropertiesBySlugs(
  slugs: string[],
  setProperties: (props: Property[]) => void
) {
  if (slugs.length === 0) {
    setProperties([])
    return
  }

  const results = await Promise.allSettled(
    slugs.map(async (slug) => {
      const res = await fetch(
        `/api/properties/${encodeURIComponent(slug)}`
      )
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (data.property) return data.property as Property
      if (
        data.properties &&
        Array.isArray(data.properties) &&
        data.properties.length > 0
      )
        return data.properties[0] as Property
      throw new Error('No property found')
    })
  )

  const fetched: Property[] = results
    .filter(
      (r): r is PromiseFulfilledResult<Property> => r.status === 'fulfilled'
    )
    .map((r) => r.value)

  setProperties(fetched)
}

export function RecentlyViewed() {
  const { selectedPropertySlug, setSelectedPropertySlug } = useAppStore()
  const [properties, setProperties] = useState<Property[]>([])
  const mountedRef = useRef(false)
  const slugsRef = useRef<string[]>([])

  // On mount, load slugs from localStorage and fetch properties
  useEffect(() => {
    mountedRef.current = true
    slugsRef.current = getRecentlyViewedSlugs()
    fetchPropertiesBySlugs(slugsRef.current, setProperties)
  }, [])

  // When selectedPropertySlug changes to non-null, add to recently viewed and refetch
  useEffect(() => {
    if (!mountedRef.current || !selectedPropertySlug) return
    slugsRef.current = addToRecentlyViewed(selectedPropertySlug)
    fetchPropertiesBySlugs(slugsRef.current, setProperties)
  }, [selectedPropertySlug])

  // Don't render if no properties loaded (also covers empty history)
  if (properties.length === 0) return null

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    slugsRef.current = []
    setProperties([])
  }

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recent Vizualizate</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-sm h-8"
            onClick={handleClearHistory}
          >
            <X className="h-4 w-4 mr-1" />
            Sterge istoric
          </Button>
        </div>

        {/* Horizontal scrollable row */}
        <div className="flex gap-4 overflow-x-auto pb-2 scroll-horizontal">
          {properties.map((property, index) => {
            const gallery: string[] = property.galleryUrls
              ? JSON.parse(property.galleryUrls)
              : []
            const coverImage =
              property.coverUrl ||
              gallery[0] ||
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75'

            return (
              <motion.div
                key={property.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="shrink-0 w-[200px] rounded-lg border border-border overflow-hidden cursor-pointer group hover:scale-105 hover:shadow-lg transition-all duration-200"
                onClick={() => setSelectedPropertySlug(property.slug)}
              >
                {/* Cover image */}
                <div className="relative h-32 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url(${coverImage})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-2 left-2 z-10">
                    <Badge
                      className={
                        typeColors[property.type] || 'bg-secondary'
                      }
                    >
                      {typeLabels[property.type] || property.type}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {property.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {property.zone}
                    {property.sector ? `, Sector ${property.sector}` : ''}
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {formatPrice(property.price, property.currency)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}