'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, Building2, ChevronRight, Loader2 } from 'lucide-react'
import { PropertyFilters } from '@/components/property/property-filters'
import { PropertyGrid } from '@/components/property/property-grid'
import { PropertyMapView } from '@/components/property/property-map-view'
import { RecentlyViewed } from '@/components/panels/recently-viewed'
import { useAppStore } from '@/store/use-app-store'
import { useProperties, type PropertyFilters as QueryPropertyFilters } from '@/hooks/use-properties'

interface ProprietatiPageProps {
  onSaveSearch?: () => void
}

export function ProprietatiPage({ onSaveSearch }: ProprietatiPageProps) {
  const { mapViewMode, selectedType, selectedZone, searchQuery, priceRange, rooms, transaction, featuredOnly, sort, minArea, maxArea } = useAppStore()

  // Build filters for the map view (uses non-paginated query to get all at once)
  const mapFilters: QueryPropertyFilters = {}
  if (selectedType) mapFilters.type = selectedType
  if (selectedZone) mapFilters.zone = selectedZone
  if (searchQuery) mapFilters.search = searchQuery
  if (priceRange[0] > 0) mapFilters.minPrice = priceRange[0]
  if (priceRange[1] < 1000000) mapFilters.maxPrice = priceRange[1]
  if (rooms > 0) mapFilters.rooms = rooms
  if (transaction) mapFilters.transaction = transaction
  if (featuredOnly) mapFilters.featured = true
  if (sort) mapFilters.sort = sort
  if (minArea) mapFilters.minArea = Number(minArea)
  if (maxArea) mapFilters.maxArea = Number(maxArea)

  const { data: mapProperties, isLoading: mapLoading } = useProperties(mapViewMode ? mapFilters : {})
  const mapData = mapViewMode ? (mapProperties ?? []) : []

  return (
    <>
      {/* Page Hero */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="floating-blob w-[400px] h-[400px] -top-32 -right-32" style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 10%) 0%, transparent 70%)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Home className="h-4 w-4" />
              <span>Acasa</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Proprietati</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Proprietati</h1>
                <p className="text-muted-foreground mt-1">Gaseste proprietatea perfecta in Bucuresti</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              {['Apartamente', 'Case', 'Vile', 'Terenuri', 'Spatii Comerciale'].map((tag) => (
                <button
                  key={tag}
                  className="text-sm px-4 py-2 rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 hover-lift"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Properties Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PropertyFilters onSaveSearch={onSaveSearch} />
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {mapViewMode ? (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {mapLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <PropertyMapView properties={mapData} />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <PropertyGrid />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  )
}
