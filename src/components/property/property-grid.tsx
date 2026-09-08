'use client'

import { priceRangeQuery } from '@/lib/property-price-range'

import { motion } from 'framer-motion'
import { SearchX, Loader2, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { usePropertiesPaginated, type PropertyFilters } from '@/hooks/use-properties'
import { PropertyCard } from '@/components/property/property-card'

export function PropertyGrid() {
  const {
    selectedType, selectedZone, searchQuery, priceRange, viewMode,
    rooms, transaction, featuredOnly, sort, minArea, maxArea, virtualTourFilter, resetFilters,
  } = useAppStore()

  const filters: PropertyFilters = {}
  if (selectedType) filters.type = selectedType
  if (selectedZone) filters.zone = selectedZone
  if (searchQuery) filters.search = searchQuery
  Object.assign(filters, priceRangeQuery(priceRange))
  if (rooms > 0) filters.rooms = rooms
  if (transaction) filters.transaction = transaction
  if (featuredOnly) filters.featured = true
  if (sort) filters.sort = sort
  if (minArea) filters.minArea = Number(minArea)
  if (maxArea) filters.maxArea = Number(maxArea)
  if (virtualTourFilter !== 'all') filters.virtualTour = virtualTourFilter

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePropertiesPaginated(filters)

  // Flatten all pages
  const properties = data?.pages.flatMap((page) => page.properties) ?? []
  const total = data?.pages[0]?.total ?? 0
  const hasResults = !isLoading && !isError && properties.length > 0

  if (isLoading) {
    return (
      <div className={viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'flex flex-col gap-4'
      }>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <Skeleton className="h-52 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Proprietățile nu s-au încărcat</h3>
        <p className="text-sm text-muted-foreground">Încearcă din nou. Filtrele tale sunt păstrate.</p>
        <Button variant="outline" className="mt-5" onClick={() => void refetch()}>
          Reîncearcă
        </Button>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Niciun rezultat</h3>
<p className="mt-2 max-w-md text-base text-muted-foreground">Încearcă o altă zonă sau un buget mai larg. Poți șterge filtrele pentru a vedea toate ofertele.</p>
        <Button className="mt-5" onClick={resetFilters}>Șterge filtrele și vezi proprietățile</Button>
      </div>
    )
  }

  return (
    <div>
      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{properties.length}</span>{' '}
          din <span className="font-medium text-foreground">{total}</span> proprietăți
        </div>
      </div>

      <motion.div
        key={`${selectedType}-${selectedZone}-${searchQuery}-${sort}-${rooms}-${transaction}-${virtualTourFilter}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
        }
      >
        {properties.map((property, index) => (
          <PropertyCard
            key={property.id}
            property={property}
            viewMode={viewMode}
            eagerImage={index === 0}
          />
        ))}
      </motion.div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[220px] h-12 text-base gap-2"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se încarcă…
                </>
              ) : (
                <>
                  Încarcă mai multe
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      )}

      {/* All loaded indicator */}
      {!hasNextPage && hasResults && properties.length >= total && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-center text-sm text-muted-foreground">
            Toate {total} proprietățile sunt încărcate
          </div>

        </div>
      )}
    </div>
  )
}
