'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Loader2, MapPinOff } from 'lucide-react'
import { PageContainer, PageHero } from '@/components/layout'
import { PropertyFilters } from '@/components/property/property-filters'
import { PropertyGrid } from '@/components/property/property-grid'
import { PropertyMapView } from '@/components/property/property-map-view'
import { RecentlyViewed } from '@/components/panels/recently-viewed'
import { useAppStore } from '@/store/use-app-store'
import { useProperties, type PropertyFilters as QueryPropertyFilters } from '@/hooks/use-properties'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/ui/page-state'

interface ProprietatiPageProps {
  onSaveSearch?: () => void
}

export function ProprietatiPage({ onSaveSearch }: ProprietatiPageProps) {
  const {
    mapViewMode,
    selectedType,
    selectedZone,
    searchQuery,
    priceRange,
    rooms,
    transaction,
    featuredOnly,
    sort,
    minArea,
    maxArea,
    virtualTourFilter,
    setSelectedType,
    setMapViewMode,
  } = useAppStore()

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
  if (virtualTourFilter !== 'all') mapFilters.virtualTour = virtualTourFilter

  const {
    data: mapProperties,
    isLoading: mapLoading,
    isError: mapError,
    refetch: refetchMap,
  } = useProperties(mapViewMode ? mapFilters : {})
  const mapData = mapViewMode ? (mapProperties ?? []) : []

  return (
    <>
      <PageHero
        icon={Building2}
        title="Proprietăți"
        description="Descoperă proprietăți verificate și filtrează rapid ofertele potrivite pentru tine."
        breadcrumb={[{ label: 'Proprietăți' }]}
      >
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {[
            { label: 'Apartamente', value: 'APARTMENT' },
            { label: 'Case', value: 'HOUSE' },
            { label: 'Vile', value: 'VILLA' },
            { label: 'Terenuri', value: 'LAND' },
            { label: 'Spații comerciale', value: 'COMMERCIAL' },
          ].map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => {
                setSelectedType(selectedType === tag.value ? '' : tag.value)
                setMapViewMode(false)
              }}
              aria-pressed={selectedType === tag.value}
              className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </PageHero>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Properties Grid */}
      <PageContainer as="section" className="py-10 sm:py-12">
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
                    <PageState
                      compact
                      tone="loading"
                      icon={Loader2}
                      title="Încărcăm proprietățile pe hartă"
                      description="Pregătim pozițiile și detaliile ofertelor disponibile."
                    />
                  ) : mapError ? (
                    <PageState
                      compact
                      tone="error"
                      icon={MapPinOff}
                      title="Harta nu este disponibilă momentan"
                      description="Lista de proprietăți rămâne disponibilă. Poți încerca din nou fără să pierzi filtrele selectate."
                      action={(
                        <Button variant="outline" size="sm" onClick={() => void refetchMap()}>
                          Reîncearcă
                        </Button>
                      )}
                    />
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
      </PageContainer>
    </>
  )
}
