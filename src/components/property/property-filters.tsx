'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal, LayoutGrid, List, ChevronDown, Bookmark, Map, Rotate3D, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAppStore } from '@/store/use-app-store'
import { useZones } from '@/hooks/use-properties'

const propertyTypes = [
  { label: 'Apartament', value: 'APARTMENT' },
  { label: 'Casă', value: 'HOUSE' },
  { label: 'Vilă', value: 'VILLA' },
  { label: 'Teren', value: 'LAND' },
  { label: 'Comercial', value: 'COMMERCIAL' },
]
const roomOptions = [
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
]
const sortOptions = [
  { label: 'Preț crescător', value: 'priceAsc' },
  { label: 'Preț descrescător', value: 'priceDesc' },
  { label: 'Suprafață', value: 'areaDesc' },
  { label: 'Cele mai noi', value: 'newest' },
]

type VirtualTourFilterValue = 'all' | 'with' | 'without'

interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

interface PropertyFiltersProps {
  onSaveSearch?: () => void
}

export function PropertyFilters({ onSaveSearch }: PropertyFiltersProps) {
  const {
    selectedType, setSelectedType,
    selectedZone, setSelectedZone,
    priceRange, setPriceRange,
    viewMode, setViewMode,
    mapViewMode, setMapViewMode,
    searchQuery, setSearchQuery,
    rooms, setRooms,
    transaction, setTransaction,
    featuredOnly, setFeaturedOnly,
    sort, setSort,
    minArea, setMinArea,
    maxArea, setMaxArea,
    virtualTourFilter, setVirtualTourFilter, resetFilters,
  } = useAppStore()

  const { data: zones } = useZones()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilters: ActiveFilter[] = []
  if (selectedType) activeFilters.push({ key: 'type', label: propertyTypes.find(t => t.value === selectedType)?.label || selectedType, onRemove: () => setSelectedType('') })
  if (selectedZone) activeFilters.push({ key: 'zone', label: selectedZone, onRemove: () => setSelectedZone('') })
  if (priceRange[0] > 0) activeFilters.push({ key: 'minP', label: `Min ${priceRange[0].toLocaleString()}€`, onRemove: () => setPriceRange([0, priceRange[1]]) })
  if (priceRange[1] < 1000000) activeFilters.push({ key: 'maxP', label: `Max ${priceRange[1].toLocaleString()}€`, onRemove: () => setPriceRange([priceRange[0], 1000000]) })
  if (rooms > 0) activeFilters.push({ key: 'rooms', label: `${rooms}+ camere`, onRemove: () => setRooms(0) })
  if (transaction) activeFilters.push({ key: 'tx', label: transaction === 'RENT' ? 'Închiriere' : 'Vânzare', onRemove: () => setTransaction('') })
  if (featuredOnly) activeFilters.push({ key: 'feat', label: 'Doar populare', onRemove: () => setFeaturedOnly(false) })
  if (searchQuery) activeFilters.push({ key: 'search', label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') })
  if (minArea) activeFilters.push({ key: 'minA', label: `Min ${minArea}m²`, onRemove: () => setMinArea('') })
  if (maxArea) activeFilters.push({ key: 'maxA', label: `Max ${maxArea}m²`, onRemove: () => setMaxArea('') })
  if (virtualTourFilter !== 'all') activeFilters.push({
    key: 'virtualTour',
    label: virtualTourFilter === 'with' ? 'Cu tur virtual' : 'Fără tur virtual',
    onRemove: () => setVirtualTourFilter('all'),
  })

  const advancedFilterCount = activeFilters.filter((filter) => !['type', 'tx', 'search'].includes(filter.key)).length
  const clearAll = resetFilters

  return (
    <div id="proprietati" className="scroll-mt-20">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Label htmlFor="catalog-search" className="mb-2 block">Unde cauți?</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="catalog-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Zonă, adresă sau cuvânt cheie" className="h-12 pl-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="catalog-transaction" className="mb-2 block">Vrei să</Label>
          <Select value={transaction || 'all'} onValueChange={(value) => setTransaction(value === 'all' ? '' : value)}>
            <SelectTrigger id="catalog-transaction" className="h-12 w-full data-[size=default]:h-12" aria-label="Tranzacție">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cumperi sau închiriezi</SelectItem>
              <SelectItem value="SALE">Cumperi</SelectItem>
              <SelectItem value="RENT">Închiriezi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="catalog-type" className="mb-2 block">Tip de proprietate</Label>
          <Select value={selectedType || 'all'} onValueChange={(value) => setSelectedType(value === 'all' ? '' : value)}>
            <SelectTrigger id="catalog-type" className="h-12 w-full data-[size=default]:h-12" aria-label="Tip de proprietate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              {propertyTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Rezultatele se actualizează când schimbi criteriile.</p>

          {/* Additional criteria stay together on every screen. */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mt-4 w-full">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-11 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {filtersOpen ? 'Ascunde filtrele' : 'Zonă, buget și alte filtre'}
                {advancedFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{advancedFilterCount}</Badge>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <FilterPanel
                zones={zones}
                selectedZone={selectedZone}
                setSelectedZone={setSelectedZone}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                rooms={rooms}
                setRooms={setRooms}
                minArea={minArea}
                setMinArea={setMinArea}
                maxArea={maxArea}
                setMaxArea={setMaxArea}
                featuredOnly={featuredOnly}
                setFeaturedOnly={setFeaturedOnly}
                virtualTourFilter={virtualTourFilter}
                setVirtualTourFilter={setVirtualTourFilter}
              />
            </CollapsibleContent>
          </Collapsible>
      {(priceRange[0] > priceRange[1] || (minArea && maxArea && Number(minArea) > Number(maxArea))) && (
        <p role="alert" className="mt-4 text-sm text-destructive">Valoarea minimă trebuie să fie mai mică decât valoarea maximă.</p>
      )}

      {/* Active filter tags */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Filtre active:</span>
            {activeFilters.map((f) => (
              <button
                type="button"
                key={f.key}
                aria-label={`Elimină filtrul: ${f.label}`}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border bg-card px-3 text-sm hover:bg-accent transition-colors"
                onClick={f.onRemove}
              >
                {f.label}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 text-sm text-muted-foreground">
              Șterge toate filtrele
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-5 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Afișarea proprietăților" className="inline-flex w-fit max-w-full rounded-lg bg-muted p-1">
          {([
            { value: 'grid', label: 'Grilă', icon: LayoutGrid, active: viewMode === 'grid' && !mapViewMode },
            { value: 'list', label: 'Listă', icon: List, active: viewMode === 'list' && !mapViewMode },
            { value: 'map', label: 'Hartă', icon: Map, active: mapViewMode },
          ] as const).map(({ value, label, icon: Icon, active }) => (
            <Button key={value} variant={active ? 'secondary' : 'ghost'}
              className={`h-11 gap-2 px-3 ${active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              aria-label={`Vizualizare ${label.toLocaleLowerCase('ro-RO')}`} aria-pressed={active}
              onClick={() => { if (value === 'map') setMapViewMode(true); else { setViewMode(value); setMapViewMode(false) } }}>
              <Icon className="h-4 w-4" aria-hidden="true" />{label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger aria-label="Ordonează proprietățile" className="h-11 data-[size=default]:h-11 w-auto min-w-40 flex-1 sm:flex-none">
              <SelectValue placeholder="Cele mai noi" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {onSaveSearch && <Button variant="outline" className="h-11" onClick={onSaveSearch}>
            <Bookmark className="h-4 w-4" aria-hidden="true" />Salvează căutarea
          </Button>}
        </div>
      </div>
    </div>
  )
}

function FilterPanel({
  zones,
  selectedZone,
  setSelectedZone,
  priceRange,
  setPriceRange,
  rooms,
  setRooms,
  minArea,
  setMinArea,
  maxArea,
  setMaxArea,
  featuredOnly,
  setFeaturedOnly,
  virtualTourFilter,
  setVirtualTourFilter,
}: {
  zones: { id: string; name: string }[] | undefined
  selectedZone: string
  setSelectedZone: (z: string) => void
  priceRange: [number, number]
  setPriceRange: (r: [number, number]) => void
  rooms: number
  setRooms: (r: number) => void
  minArea: string
  setMinArea: (v: string) => void
  maxArea: string
  setMaxArea: (v: string) => void
  featuredOnly: boolean
  setFeaturedOnly: (v: boolean) => void
  virtualTourFilter: VirtualTourFilterValue
  setVirtualTourFilter: (v: VirtualTourFilterValue) => void
}) {
  return (
    <div className="border-t pt-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Zone */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">Zona</Label>
          <Select value={selectedZone || 'all'} onValueChange={(v) => setSelectedZone(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-11 w-full" aria-label="Zonă">
              <SelectValue placeholder="Toate zonele" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">Toate zonele</SelectItem>
              {zones?.map((z) => (
                <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">Preț (EUR)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              aria-label="Preț minim în euro" min={0}
              value={priceRange[0] === 0 ? '' : priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
              className="h-11"
            />
            <Input
              type="number"
              placeholder="Max"
              aria-label="Preț maxim în euro" min={0}
              value={priceRange[1] >= 1000000 ? '' : priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 1000000])}
              className="h-11"
            />
          </div>
        </div>

        {/* Rooms */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">Camere</Label>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant={rooms === 0 ? 'default' : 'outline'}
              className="h-10 text-sm flex-1"
              aria-pressed={rooms === 0}
              onClick={() => setRooms(0)}
            >
              Orice
            </Button>
            {roomOptions.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={rooms === opt.value ? 'default' : 'outline'}
                className="h-10 text-sm flex-1"
                aria-label={`${opt.value} sau mai multe camere`}
                aria-pressed={rooms === opt.value}
                onClick={() => setRooms(rooms === opt.value ? 0 : opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Area range */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">Suprafață (m²)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min m²"
              aria-label="Suprafață minimă în metri pătrați" min={0}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="h-11"
            />
            <Input
              type="number"
              placeholder="Max m²"
              aria-label="Suprafață maximă în metri pătrați" min={0}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        {/* Virtual tour */}
        <div>
          <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Rotate3D className="h-3.5 w-3.5" /> Tur virtual
          </Label>
          <Select
            value={virtualTourFilter}
            onValueChange={(value) => setVirtualTourFilter(value as VirtualTourFilterValue)}
          >
            <SelectTrigger className="w-full" aria-label="Filtru tur virtual">
              <SelectValue placeholder="Toate proprietățile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate proprietățile</SelectItem>
              <SelectItem value="with">Cu tur virtual</SelectItem>
              <SelectItem value="without">Fără tur virtual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured toggle */}
        <div className="flex items-end pb-0.5">
          <div className="flex items-center gap-2">
            <Switch
              id="featured-toggle"
              checked={featuredOnly}
              onCheckedChange={setFeaturedOnly}
            />
            <Label htmlFor="featured-toggle" className="text-sm cursor-pointer">
              Doar proprietăți populare
            </Label>
          </div>
        </div>
      </div>

    </div>
  )
}
