'use client'

import { priceRangeQuery } from '@/lib/property-price-range'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MapPinOff } from 'lucide-react'
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
    setMapViewMode,
  } = useAppStore()

  // Build filters for the map view (uses non-paginated query to get all at once)
  const mapFilters: QueryPropertyFilters = {}
  if (selectedType) mapFilters.type = selectedType
  if (selectedZone) mapFilters.zone = selectedZone
  if (searchQuery) mapFilters.search = searchQuery
  Object.assign(mapFilters, priceRangeQuery(priceRange))
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
  } = useProperties(mapFilters, { enabled: mapViewMode, allPages: true })
  const mapData = mapViewMode ? (mapProperties ?? []) : []

  return (
    <>
      <PageHero
        variant="border"
        title="Proprietăți"
        description="Alege ce cauți, apoi explorează ofertele în listă sau pe hartă."
        breadcrumb={[{ label: 'Proprietăți' }]}
      />

      {/* Properties Grid */}
      <PageContainer as="section" className="py-6 sm:py-8">
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
                        <div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => void refetchMap()}>Reîncearcă</Button><Button onClick={() => setMapViewMode(false)}>Vezi lista</Button></div>
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
      <RecentlyViewed />
    </>
  )
}
