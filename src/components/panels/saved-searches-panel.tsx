'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Trash2, RotateCcw, SlidersHorizontal, MapPin, BedDouble, Euro } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/use-app-store'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { SavedSearch } from '@/lib/types'

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}

const transactionLabels: Record<string, string> = {
  SALE: 'Vanzare',
  RENT: 'Inchiriere',
}

interface SavedSearchesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavedSearchesPanel({ open, onOpenChange }: SavedSearchesPanelProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    loadFromLS<SavedSearch[]>(LS_KEYS.SAVED_SEARCHES, []),
  )

  // Listen for external updates (from save/delete operations)
  useEffect(() => {
    const handler = () => setSavedSearches(loadFromLS<SavedSearch[]>(LS_KEYS.SAVED_SEARCHES, []))
    window.addEventListener('storage', handler)
    window.addEventListener('pm-saved-searches-updated', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('pm-saved-searches-updated', handler)
    }
  }, [])

  const handleLoad = (search: SavedSearch) => {
    const store = useAppStore.getState()
    const f = search.filters

    if (f.selectedType !== undefined) store.setSelectedType(f.selectedType || '')
    if (f.selectedZone !== undefined) store.setSelectedZone(f.selectedZone || '')
    if (f.priceRange) store.setPriceRange(f.priceRange)
    if (f.rooms !== undefined) store.setRooms(f.rooms || 0)
    if (f.transaction !== undefined) store.setTransaction(f.transaction || '')
    if (f.featuredOnly !== undefined) store.setFeaturedOnly(f.featuredOnly || false)
    if (f.sort !== undefined) store.setSort(f.sort || '')
    if (f.minArea !== undefined) store.setMinArea(f.minArea || '')
    if (f.maxArea !== undefined) store.setMaxArea(f.maxArea || '')
    if (f.searchQuery !== undefined) store.setSearchQuery(f.searchQuery || '')
    store.setVirtualTourFilter(f.virtualTourFilter ?? 'all')

    // Navigate to proprietati page
    if (store.currentPage !== 'proprietati') {
      store.navigateTo('proprietati')
    }

    onOpenChange(false)
    toast.success('Cautarea a fost incarcata!')
  }

  const handleDelete = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id)
    saveToLS(LS_KEYS.SAVED_SEARCHES, updated)
    setSavedSearches(updated)
    window.dispatchEvent(new Event('pm-saved-searches-updated'))
    toast.success('Cautarea a fost stearsa!')
  }

  const handleClearAll = () => {
    saveToLS(LS_KEYS.SAVED_SEARCHES, [])
    setSavedSearches([])
    window.dispatchEvent(new Event('pm-saved-searches-updated'))
    toast.success('Toate cautarile au fost sterse!')
  }

  const formatDate = (isoString: string) => {
    try {
      return formatRelativeTime(isoString)
    } catch {
      return isoString
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Bookmark className="h-5 w-5 text-primary" />
            Cautari Salvate
          </SheetTitle>
          <SheetDescription>
            {savedSearches.length === 0
              ? 'Nu ai salvat nicio cautare inca.'
              : `${savedSearches.length} ${savedSearches.length === 1 ? 'cautare' : 'cautari'} salvate`}
          </SheetDescription>
        </SheetHeader>

        <Separator className="mt-2" />

        <div className="flex-1 overflow-hidden">
          {savedSearches.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="h-full">
              <div className="px-6 py-4 space-y-3">
                <AnimatePresence>
                  {savedSearches.map((search, index) => (
                    <SavedSearchItem
                      key={search.id}
                      search={search}
                      index={index}
                      onLoad={() => handleLoad(search)}
                      onDelete={() => handleDelete(search.id)}
                      formatDate={formatDate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>

        {savedSearches.length > 0 && (
          <>
            <Separator />
            <div className="px-6 py-4">
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4" />
                Sterge Toate Cautarile
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SavedSearchItem({
  search,
  index,
  onLoad,
  onDelete,
  formatDate,
}: {
  search: SavedSearch
  index: number
  onLoad: () => void
  onDelete: () => void
  formatDate: (iso: string) => string
}) {
  const badges: { label: string; icon?: React.ReactNode }[] = []

  if (search.filters.selectedType) {
    badges.push({ label: propertyTypeLabels[search.filters.selectedType] || search.filters.selectedType })
  }
  if (search.filters.selectedZone) {
    badges.push({ label: search.filters.selectedZone, icon: <MapPin className="h-3 w-3" /> })
  }
  if (search.filters.rooms && search.filters.rooms > 0) {
    badges.push({ label: `${search.filters.rooms}+ camere`, icon: <BedDouble className="h-3 w-3" /> })
  }
  if (search.filters.priceRange) {
    const [min, max] = search.filters.priceRange
    if (min > 0 || max < 1000000) {
      const parts: string[] = []
      if (min > 0) parts.push(`${min.toLocaleString()}€`)
      if (max < 1000000) parts.push(`${max.toLocaleString()}€`)
      badges.push({ label: parts.join(' - '), icon: <Euro className="h-3 w-3" /> })
    }
  }
  if (search.filters.transaction) {
    badges.push({ label: transactionLabels[search.filters.transaction] || search.filters.transaction })
  }
  if (search.filters.virtualTourFilter && search.filters.virtualTourFilter !== 'all') {
    badges.push({
      label: search.filters.virtualTourFilter === 'with' ? 'Cu tur virtual' : 'Fără tur virtual',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      layout
      className="group rounded-xl border bg-card p-4 transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm line-clamp-1">{search.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(search.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={onLoad}
            aria-label="Incarca cautarea"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="Sterge cautarea"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge, i) => (
            <Badge key={i} variant="secondary" className="gap-1 text-xs font-normal">
              {badge.icon}
              {badge.label}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3 w-3" />
          <span>Filtre implicite</span>
        </div>
      )}
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Bookmark className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Nicio cautare salvata</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Foloseste filtrele si salveaza-le ca profil de cautare.
      </p>
    </div>
  )
}
