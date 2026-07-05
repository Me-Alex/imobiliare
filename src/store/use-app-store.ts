import { create } from 'zustand'

interface AppState {
  favorites: string[]
  compareList: string[]
  toggleFavorite: (id: string) => void
  toggleCompare: (id: string) => void
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

export const useAppStore = create<AppState>((set) => ({
  favorites: [],
  compareList: [],
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((fid) => fid !== id)
        : [...state.favorites, id],
    })),
  toggleCompare: (id) =>
    set((state) => {
      if (state.compareList.includes(id)) {
        return { compareList: state.compareList.filter((cid) => cid !== id) }
      }
      if (state.compareList.length >= 3) {
        return state
      }
      return { compareList: [...state.compareList, id] }
    }),
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
}))