'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Bookmark, Trash2, Undo2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { restorePriceRange } from '@/lib/property-price-range'
import { describeSavedSearch, readSavedSearches, restoreDeletedSearches, savedSearchFilterError, SAVED_SEARCHES_UPDATED, updateSavedSearches } from '@/lib/saved-searches'
import { LS_KEYS } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { SavedSearch } from '@/lib/types'

interface SavedSearchesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavedSearchesPanel({ open, onOpenChange }: SavedSearchesPanelProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [removed, setRemoved] = useState<SavedSearch[]>([])
  const [error, setError] = useState('')
  const undoButton = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function reload() {
      try { setSavedSearches(readSavedSearches()); setError('') }
      catch { setError('Căutările salvate nu pot fi citite. Verifică setările de stocare ale browserului. Datele existente nu au fost modificate.') }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === LS_KEYS.SAVED_SEARCHES || event.key === null) reload()
    }
    reload()
    window.addEventListener('storage', onStorage)
    window.addEventListener(SAVED_SEARCHES_UPDATED, reload)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SAVED_SEARCHES_UPDATED, reload)
    }
  }, [open])

  function handleLoad(search: SavedSearch) {
    const filterError = savedSearchFilterError(search.filters)
    if (filterError) { setError(filterError); list.current?.scrollTo({ top: 0 }); return }
    const store = useAppStore.getState()
    const f = search.filters
    store.resetFilters()
    if (f.selectedType !== undefined) store.setSelectedType(f.selectedType || '')
    if (f.selectedZone !== undefined) store.setSelectedZone(f.selectedZone || '')
    store.setPriceRange(restorePriceRange(f.priceRange, f.priceRangeVersion))
    if (f.rooms !== undefined) store.setRooms(f.rooms || 0)
    if (f.transaction !== undefined) store.setTransaction(f.transaction || '')
    if (f.featuredOnly !== undefined) store.setFeaturedOnly(f.featuredOnly || false)
    if (f.sort !== undefined) store.setSort(f.sort || '')
    if (f.minArea !== undefined) store.setMinArea(f.minArea || '')
    if (f.maxArea !== undefined) store.setMaxArea(f.maxArea || '')
    if (f.searchQuery !== undefined) store.setSearchQuery(f.searchQuery || '')
    store.setVirtualTourFilter(f.virtualTourFilter ?? 'all')
    if (store.currentPage !== 'proprietati') store.navigateTo('proprietati')
    onOpenChange(false)
    toast.success(`Filtrele „${search.name}” au fost aplicate.`)
  }

  function handleDelete(id?: string) {
    try {
      let deleted: SavedSearch[] = []
      updateSavedSearches(current => {
        deleted = current.filter(search => id === undefined || search.id === id)
        return current.filter(search => id !== undefined && search.id !== id)
      })
      setRemoved(previous => [...previous.filter(search => !deleted.some(item => item.id === search.id)), ...deleted])
      requestAnimationFrame(() => undoButton.current?.focus())
    } catch {
      setError('Ștergerea nu a reușit. Căutările au fost păstrate. Verifică stocarea browserului și încearcă din nou.')
      list.current?.scrollTo({ top: 0 })
    }
  }

  function handleUndo() {
    try {
      restoreDeletedSearches(removed)
      setRemoved([])
      requestAnimationFrame(() => list.current?.querySelector<HTMLButtonElement>('button[aria-label^="Vezi proprietățile"]')?.focus())
    } catch {
      setError('Căutările nu au putut fi recuperate. Verifică stocarea browserului și apasă din nou „Anulează ștergerea”.')
      list.current?.scrollTo({ top: 0 })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-dvh w-full min-w-0 flex-col gap-0 p-0 sm:max-w-md" closeLabel="Închide căutările salvate" closeButtonClassName="right-2 top-2 flex size-11 items-center justify-center rounded-lg">
        <SheetHeader className="shrink-0 border-b px-5 py-5 pr-14 text-left">
          <SheetTitle className="text-xl">Căutări salvate</SheetTitle>
          <SheetDescription>Doar în acest browser, pe acest dispozitiv.</SheetDescription>
        </SheetHeader>
        <div ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5" aria-label="Lista căutărilor salvate">
          {error && <p role="alert" className="my-4 text-sm text-destructive">{error}</p>}
          {savedSearches.length === 0 ? (
            <div className="space-y-3 py-10">
              <Bookmark className="size-7 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-lg font-semibold">{error ? 'Căutări indisponibile' : 'Nicio căutare salvată'}</h3>
              <p className="text-sm text-muted-foreground">Alege filtrele din lista de proprietăți, apoi apasă „Salvează căutarea”.</p>
              <Button variant="outline" className="min-h-11" onClick={() => { useAppStore.getState().navigateTo('proprietati'); onOpenChange(false) }}>Caută proprietăți<ArrowRight className="size-4" /></Button>
            </div>
          ) : (
            <ul className="divide-y" aria-label="Căutări">
              {savedSearches.map(search => <SavedSearchItem key={search.id} search={search} onLoad={() => handleLoad(search)} onDelete={() => handleDelete(search.id)} />)}
            </ul>
          )}
        </div>
        {(removed.length > 0 || savedSearches.length > 0) && (
          <div className="shrink-0 space-y-2 border-t px-5 py-3">
            {removed.length > 0 && <div className="space-y-1">
              <p role="status" className="text-sm">{removed.length === 1 ? 'O căutare ștearsă.' : `${removed.length} căutări șterse.`}</p>
              <Button ref={undoButton} variant="outline" className="min-h-11 w-full" onClick={handleUndo}><Undo2 className="size-4" />Anulează ștergerea</Button>
            </div>}
            {savedSearches.length > 0 && <Button variant="ghost" className="min-h-11 w-full text-muted-foreground hover:text-destructive" onClick={() => handleDelete()}><Trash2 className="size-4" />Șterge toate căutările ({savedSearches.length})</Button>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SavedSearchItem({ search, onLoad, onDelete }: { search: SavedSearch; onLoad: () => void; onDelete: () => void }) {
  return (
    <li className="py-5">
      <div className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold [overflow-wrap:anywhere]">{search.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{Number.isNaN(Date.parse(search.createdAt)) ? 'Dată indisponibilă' : formatRelativeTime(search.createdAt)}</p>
        </div>
        <Button variant="ghost" size="icon" className="size-11 shrink-0 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label={`Șterge căutarea „${search.name}”`}><Trash2 className="size-4" /></Button>
      </div>
      <ul className="mb-4 space-y-1 text-sm text-muted-foreground" aria-label={`Criterii pentru ${search.name}`}>
        {describeSavedSearch(search.filters).map((label, index) => <li key={index} className="[overflow-wrap:anywhere]">{label}</li>)}
      </ul>
      <Button variant="outline" className="min-h-11 w-full justify-between" onClick={onLoad} aria-label={`Vezi proprietățile: ${search.name}`}>Vezi proprietățile<ArrowRight className="size-4" /></Button>
    </li>
  )
}
