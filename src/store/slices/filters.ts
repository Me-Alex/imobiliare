import type { StateCreator } from 'zustand'

export interface FiltersSlice {
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedZone: string
  setSelectedZone: (z: string) => void
  selectedType: string
  setSelectedType: (t: string) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  mapViewMode: boolean
  setMapViewMode: (v: boolean) => void
  selectedPropertySlug: string | null
  setSelectedPropertySlug: (slug: string | null) => void
  rooms: number
  setRooms: (r: number) => void
  transaction: string
  setTransaction: (t: string) => void
  featuredOnly: boolean
  setFeaturedOnly: (v: boolean) => void
  sort: string
  setSort: (s: string) => void
  minArea: string
  setMinArea: (v: string) => void
  maxArea: string
  setMaxArea: (v: string) => void
}

export const createFiltersSlice: StateCreator<FiltersSlice> = (set) => ({
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedZone: '',
  setSelectedZone: (z) => set({ selectedZone: z }),
  selectedType: '',
  setSelectedType: (t) => set({ selectedType: t }),
  priceRange: [0, 1000000],
  setPriceRange: (range) => set({ priceRange: range }),
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),
  mapViewMode: false,
  setMapViewMode: (v) => set({ mapViewMode: v }),
  selectedPropertySlug: null,
  setSelectedPropertySlug: (slug) => set({ selectedPropertySlug: slug }),
  rooms: 0,
  setRooms: (r) => set({ rooms: r }),
  transaction: '',
  setTransaction: (t) => set({ transaction: t }),
  featuredOnly: false,
  setFeaturedOnly: (v) => set({ featuredOnly: v }),
  sort: '',
  setSort: (s) => set({ sort: s }),
  minArea: '',
  setMinArea: (v) => set({ minArea: v }),
  maxArea: '',
  setMaxArea: (v) => set({ maxArea: v }),
})