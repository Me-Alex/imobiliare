'use client'

import { useState, useMemo, useEffect, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, X, MapPin, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { cn, formatPrice, formatPricePerSqm } from '@/lib/utils'
import { getPropertiesByIds } from '@/lib/api'
import type { Property } from '@/lib/types'

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}

function getBestIndices(properties: Property[]): Record<string, number> {
  if (properties.length < 2) return {}
  const best: Record<string, number> = {}

  // Lowest price
  const minPrice = Math.min(...properties.map((p) => p.price))
  best.price = properties.findIndex((p) => p.price === minPrice)

  // Lowest price/sqm
  const pricesPerSqm = properties.map((p) => p.pricePerSqm ?? Infinity)
  const minPriceSqm = Math.min(...pricesPerSqm)
  best.pricePerSqm = properties.findIndex((p) => p.pricePerSqm === minPriceSqm)

  // Most rooms
  const maxRooms = Math.max(...properties.map((p) => p.rooms))
  best.rooms = properties.findIndex((p) => p.rooms === maxRooms)

  // Largest area
  const maxArea = Math.max(...properties.map((p) => p.areaSqm))
  best.areaSqm = properties.findIndex((p) => p.areaSqm === maxArea)

  // Most bathrooms
  const maxBath = Math.max(...properties.map((p) => p.bathrooms))
  best.bathrooms = properties.findIndex((p) => p.bathrooms === maxBath)

  // Newest build
  const years = properties.map((p) => p.yearBuilt ?? 0)
  const maxYear = Math.max(...years)
  if (maxYear > 0) {
    best.yearBuilt = properties.findIndex((p) => p.yearBuilt === maxYear)
  }

  return best
}

interface CompareRowProps {
  label: string
  values: (string | number | null)[]
  bestIndex?: number
  highlight?: 'low' | 'high'
}

function CompareRow({ label, values, bestIndex, highlight }: CompareRowProps) {
  return (
    <TableRow>
      <TableHead className="font-medium text-muted-foreground w-40">{label}</TableHead>
      {values.map((val, i) => (
        <TableCell
          key={i}
          className={cn(
            'text-center font-medium',
            bestIndex === i && 'text-primary font-bold bg-primary/5'
          )}
        >
          {val ?? '-'}
          {bestIndex === i && highlight === 'low' && (
            <span className="ml-1 text-xs text-primary">↓ Cel mai bun</span>
          )}
          {bestIndex === i && highlight === 'high' && (
            <span className="ml-1 text-xs text-primary">↑ Cel mai bun</span>
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}

function PropertyCompare() {
  const { compareList, toggleCompare } = useAppStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [properties, setProperties] = useState<Property[] | null>(null)
  const [fetchedVersion, setFetchedVersion] = useState('')

  const currentVersion = compareList.join(',')

  const effectiveProperties = useMemo(() => {
    if (compareList.length < 2) return null
    return undefined // signal: needs fetch
  }, [compareList])

  const needsFetch = effectiveProperties === undefined
  const isLoading = needsFetch && fetchedVersion !== currentVersion

  useEffect(() => {
    if (!needsFetch) return
    const ver = currentVersion
    getPropertiesByIds(compareList)
      .then((data) => { setProperties(data); setFetchedVersion(ver) })
      .catch(() => { setProperties([]); setFetchedVersion(ver) })
  }, [needsFetch, compareList, currentVersion])

  const displayProperties = effectiveProperties === null ? null : properties

  const bestIndices = useMemo(() => {
    if (!displayProperties || displayProperties.length < 2) return {}
    return getBestIndices(displayProperties)
  }, [displayProperties])

  const effectiveSheetOpen = sheetOpen && compareList.length >= 2

  const handleClear = () => {
    compareList.forEach((id) => toggleCompare(id))
    setSheetOpen(false)
  }

  // Determine sheet side based on viewport
  const mobileMq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null
  const isMobile = useSyncExternalStore(
    (cb) => { mobileMq?.addEventListener('change', cb); return () => mobileMq?.removeEventListener('change', cb) },
    () => mobileMq?.matches ?? true,
    () => true // getServerSnapshot — always render mobile-first on server
  )

  return (
    <>
      {/* Floating Bar */}
      <AnimatePresence>
        {compareList.length >= 2 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4"
          >
            <div className="mx-auto max-w-2xl rounded-2xl border bg-background/95 backdrop-blur-lg shadow-2xl px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">
                    Compară {compareList.length} proprietat{compareList.length === 1 ? 'e' : 'i'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {compareList.length}/3 selectate
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-destructive gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Golește</span>
                </Button>
                <Button
                  onClick={() => setSheetOpen(true)}
                  className="gap-2"
                >
                  <Scale className="h-4 w-4" />
                  Vezi comparatie
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Sheet */}
      <Sheet open={effectiveSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            isMobile ? 'max-h-[85vh]' : 'sm:max-w-4xl w-full'
          )}
        >
          <SheetHeader className="pr-8">
            <SheetTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Comparare proprietati
            </SheetTitle>
            <SheetDescription>
              Compară detaliile proprietatilor selectate side by side.
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !isLoading && displayProperties && displayProperties.length >= 2 ? (
            <div className="flex-1 overflow-auto p-4 -mx-4">
              {/* Property Headers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 px-2">
                {displayProperties.map((p) => {
                  const gallery: string[] = p.galleryUrls ? JSON.parse(p.galleryUrls) : []
                  const coverImage = p.coverUrl || gallery[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=75'
                  return (
                    <div key={p.id} className="relative group rounded-xl overflow-hidden border">
                      <div className="aspect-video relative">
                        <img
                          src={coverImage}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => toggleCompare(p.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm line-clamp-1">{p.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{p.zone}, Bucuresti</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Comparison Table */}
              <Table>
                <TableBody>
                  <CompareRow
                    label="Pret"
                    values={displayProperties.map((p) => formatPrice(p.price))}
                    bestIndex={bestIndices.price}
                    highlight="low"
                  />
                  <CompareRow
                    label="Pret/m²"
                    values={displayProperties.map((p) =>
                      p.pricePerSqm ? formatPricePerSqm(p.pricePerSqm) : '-'
                    )}
                    bestIndex={bestIndices.pricePerSqm}
                    highlight="low"
                  />
                  <CompareRow
                    label="Camere"
                    values={displayProperties.map((p) => String(p.rooms))}
                    bestIndex={bestIndices.rooms}
                    highlight="high"
                  />
                  <CompareRow
                    label="Suprafata"
                    values={displayProperties.map((p) => `${p.areaSqm} m²`)}
                    bestIndex={bestIndices.areaSqm}
                    highlight="high"
                  />
                  <CompareRow
                    label="Bai"
                    values={displayProperties.map((p) => String(p.bathrooms))}
                    bestIndex={bestIndices.bathrooms}
                    highlight="high"
                  />
                  <CompareRow
                    label="Etaj"
                    values={displayProperties.map((p) => (p.floor ? `Etaj ${p.floor}` : '-'))}
                  />
                  <CompareRow
                    label="An constructie"
                    values={displayProperties.map((p) => p.yearBuilt ? String(p.yearBuilt) : '-')}
                    bestIndex={bestIndices.yearBuilt}
                    highlight="high"
                  />
                  <CompareRow
                    label="Tip"
                    values={displayProperties.map((p) => typeLabels[p.type] || p.type)}
                  />
                  <CompareRow
                    label="Tranzactie"
                    values={displayProperties.map((p) =>
                      p.transaction === 'SALE' ? 'Vanzare' : 'Inchiriere'
                    )}
                  />
                </TableBody>
              </Table>

              {/* Clear button */}
              <div className="mt-6 pt-4 border-t flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Goleste selectia
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Scale className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nu sunt suficiente proprietati pentru comparatie.</p>
                <p className="text-sm mt-1">Selectează cel puțin 2 proprietati.</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

export { PropertyCompare }