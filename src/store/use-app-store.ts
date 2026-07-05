import { create } from 'zustand'

export type PageKey = 'acasa' | 'proprietati' | 'analiza' | 'zone' | 'de-ce-noi' | 'calculator'

interface AppState {
  currentPage: PageKey
  navigateTo: (page: PageKey) => void
  favorites: string[]
  compareList: string[]
  priceAlertsOpen: boolean
  setPriceAlertsOpen: (open: boolean) => void
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
  lightboxImages: string[]
  lightboxIndex: number
  setLightbox: (images: string[], index?: number) => void
  clearLightbox: () => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'acasa' as PageKey,
  navigateTo: (page) => {
    set({ currentPage: page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
  favorites: [],
  compareList: [],
  priceAlertsOpen: false,
  setPriceAlertsOpen: (open) => set({ priceAlertsOpen: open }),
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
  lightboxImages: [],
  lightboxIndex: 0,
  setLightbox: (images, index = 0) => set({ lightboxImages: images, lightboxIndex: index }),
  clearLightbox: () => set({ lightboxImages: [], lightboxIndex: 0 }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
}))