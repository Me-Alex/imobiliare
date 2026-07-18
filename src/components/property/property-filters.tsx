'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal, LayoutGrid, List, ChevronDown, Bookmark, Map, Rotate3D } from 'lucide-react'
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
  { label: 'Casa', value: 'HOUSE' },
  { label: 'Vila', value: 'VILLA' },
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
  { label: 'Pret crescator', value: 'priceAsc' },
  { label: 'Pret descrescator', value: 'priceDesc' },
  { label: 'Suprafata', value: 'areaDesc' },
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
    virtualTourFilter, setVirtualTourFilter,
  } = useAppStore()

  const { data: zones } = useZones()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilters: ActiveFilter[] = []
  if (selectedType) activeFilters.push({ key: 'type', label: propertyTypes.find(t => t.value === selectedType)?.label || selectedType, onRemove: () => setSelectedType('') })
  if (selectedZone) activeFilters.push({ key: 'zone', label: selectedZone, onRemove: () => setSelectedZone('') })
  if (priceRange[0] > 0) activeFilters.push({ key: 'minP', label: `Min ${priceRange[0].toLocaleString()}€`, onRemove: () => setPriceRange([0, priceRange[1]]) })
  if (priceRange[1] < 1000000) activeFilters.push({ key: 'maxP', label: `Max ${priceRange[1].toLocaleString()}€`, onRemove: () => setPriceRange([priceRange[0], 1000000]) })
  if (rooms > 0) activeFilters.push({ key: 'rooms', label: `${rooms}+ camere`, onRemove: () => setRooms(0) })
  if (transaction) activeFilters.push({ key: 'tx', label: transaction, onRemove: () => setTransaction('') })
  if (featuredOnly) activeFilters.push({ key: 'feat', label: 'Doar populare', onRemove: () => setFeaturedOnly(false) })
  if (searchQuery) activeFilters.push({ key: 'search', label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') })
  if (minArea) activeFilters.push({ key: 'minA', label: `Min ${minArea}m²`, onRemove: () => setMinArea('') })
  if (maxArea) activeFilters.push({ key: 'maxA', label: `Max ${maxArea}m²`, onRemove: () => setMaxArea('') })
  if (virtualTourFilter !== 'all') activeFilters.push({
    key: 'virtualTour',
    label: virtualTourFilter === 'with' ? 'Cu tur virtual' : 'Fără tur virtual',
    onRemove: () => setVirtualTourFilter('all'),
  })

  const clearAll = () => {
    setSelectedType('')
    setSelectedZone('')
    setPriceRange([0, 1000000])
    setRooms(0)
    setMinArea('')
    setMaxArea('')
    setTransaction('')
    setFeaturedOnly(false)
    setSort('')
    setSearchQuery('')
    setVirtualTourFilter('all')
  }

  return (
    <div id="proprietati" className="scroll-mt-20">
      {/* Top bar: type pills + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={!selectedType ? 'default' : 'outline'}
            onClick={() => setSelectedType('')}
            className="rounded-full"
          >
            Toate
          </Button>
          {propertyTypes.map((type) => (
            <Button
              key={type.value}
              size="sm"
              variant={selectedType === type.value ? 'default' : 'outline'}
              onClick={() => setSelectedType(selectedType === type.value ? '' : type.value)}
              className="rounded-full"
            >
              {type.label}
            </Button>
          ))}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Save Search */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onSaveSearch}
          >
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Salveaza Cautarea</span>
            <span className="sm:hidden">Salveaza</span>
          </Button>

          {/* Sort */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 min-w-0 flex-1 text-sm sm:w-48 sm:flex-none">
              <SelectValue placeholder="Sorteaza dupa..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' && !mapViewMode ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none rounded-l-md"
              onClick={() => { setViewMode('grid'); setMapViewMode(false) }}
              aria-label="Vizualizare grila"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' && !mapViewMode ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => { setViewMode('list'); setMapViewMode(false) }}
              aria-label="Vizualizare lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={mapViewMode ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none rounded-r-md"
              onClick={() => setMapViewMode(!mapViewMode)}
              aria-label="Vizualizare harta"
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile filter toggle */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="w-full lg:hidden">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                Filtre
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{activeFilters.length}</Badge>
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
                transaction={transaction}
                setTransaction={setTransaction}
                featuredOnly={featuredOnly}
                setFeaturedOnly={setFeaturedOnly}
                virtualTourFilter={virtualTourFilter}
                setVirtualTourFilter={setVirtualTourFilter}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Desktop filter panel */}
      <div className="hidden lg:block mb-6">
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
          transaction={transaction}
          setTransaction={setTransaction}
          featuredOnly={featuredOnly}
          setFeaturedOnly={setFeaturedOnly}
          virtualTourFilter={virtualTourFilter}
          setVirtualTourFilter={setVirtualTourFilter}
        />
      </div>

      {/* Active filter tags */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2 mb-6"
          >
            <span className="text-sm text-muted-foreground">Filtre active:</span>
            {activeFilters.map((f) => (
              <Badge
                key={f.key}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={f.onRemove}
              >
                {f.label}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs text-muted-foreground">
              Sterge tot
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
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
  transaction,
  setTransaction,
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
  transaction: string
  setTransaction: (v: string) => void
  featuredOnly: boolean
  setFeaturedOnly: (v: boolean) => void
  virtualTourFilter: VirtualTourFilterValue
  setVirtualTourFilter: (v: VirtualTourFilterValue) => void
}) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Zone */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Zona</Label>
          <Select value={selectedZone || 'all'} onValueChange={(v) => setSelectedZone(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full">
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

        {/* Transaction type */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tranzactie</Label>
          <Select value={transaction || 'all'} onValueChange={(v) => setTransaction(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Vanzare & Inchiriere" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vanzare & Inchiriere</SelectItem>
              <SelectItem value="SALE">Vanzare</SelectItem>
              <SelectItem value="RENT">Inchiriere</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pret (EUR)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={priceRange[0] === 0 ? '' : priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
              className="h-9"
            />
            <Input
              type="number"
              placeholder="Max"
              value={priceRange[1] >= 1000000 ? '' : priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 1000000])}
              className="h-9"
            />
          </div>
        </div>

        {/* Rooms */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Camere</Label>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant={rooms === 0 ? 'default' : 'outline'}
              className="h-9 text-xs flex-1"
              onClick={() => setRooms(0)}
            >
              Orice
            </Button>
            {roomOptions.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={rooms === opt.value ? 'default' : 'outline'}
                className="h-9 text-xs flex-1"
                onClick={() => setRooms(rooms === opt.value ? 0 : opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Area range */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Suprafata (m²)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min m²"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="h-9"
            />
            <Input
              type="number"
              placeholder="Max m²"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Virtual tour */}
        <div>
          <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
              Doar proprietati populare
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}
