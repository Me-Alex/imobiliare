'use client'

import { motion } from 'framer-motion'
import { SearchX, Loader2, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { usePropertiesPaginated, type PropertyFilters } from '@/hooks/use-properties'
import { PropertyCard } from '@/components/property/property-card'

export function PropertyGrid({ onSelectProperty }: { onSelectProperty: (slug: string) => void }) {
  const {
    selectedType, selectedZone, searchQuery, priceRange, viewMode,
    rooms, transaction, featuredOnly, sort, minArea, maxArea,
  } = useAppStore()

  const filters: PropertyFilters = {}
  if (selectedType) filters.type = selectedType
  if (selectedZone) filters.zone = selectedZone
  if (searchQuery) filters.search = searchQuery
  if (priceRange[0] > 0) filters.minPrice = priceRange[0]
  if (priceRange[1] < 1000000) filters.maxPrice = priceRange[1]
  if (rooms > 0) filters.rooms = rooms
  if (transaction) filters.transaction = transaction
  if (featuredOnly) filters.featured = true
  if (sort) filters.sort = sort
  if (minArea) filters.minArea = Number(minArea)
  if (maxArea) filters.maxArea = Number(maxArea)

  const {
    data,
    isLoading,
    isError,
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
        <h3 className="text-lg font-semibold mb-1">Eroare la incarcare</h3>
        <p className="text-sm text-muted-foreground">Nu am putut incarca proprietatile. Va rugam reincercati.</p>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Niciun rezultat</h3>
        <p className="text-sm text-muted-foreground">Nu am gasit proprietati care sa corespunda filtrelor selectate.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{properties.length}</span>{' '}
          din <span className="font-medium text-foreground">{total}</span> proprietati
        </div>
        <span className="text-xs text-muted-foreground/70">Aratand {properties.length} din {total} proprietati</span>
      </div>

      <motion.div
        key={`${selectedType}-${selectedZone}-${searchQuery}-${sort}-${rooms}-${transaction}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
        }
      >
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onSelect={onSelectProperty}
            viewMode={viewMode}
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
                  Se incarca...
                </>
              ) : (
                <>
                  Incarca mai multe
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
            Toate {total} proprietatile sunt incarcate
          </div>
          <div className="cta-gradient-border">
            <Button
              size="lg"
              className="gap-2 bg-card text-foreground hover:bg-card/80 rounded-[var(--radius)]"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Vezi Toate Proprietatile
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}