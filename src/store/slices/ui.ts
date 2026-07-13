import type { StateCreator } from 'zustand'

export interface UISlice {
  lightboxImages: string[]
  lightboxIndex: number
  setLightbox: (images: string[], index?: number) => void
  clearLightbox: () => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  priceAlertsOpen: boolean
  setPriceAlertsOpen: (open: boolean) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  lightboxImages: [],
  lightboxIndex: 0,
  setLightbox: (images, index = 0) => set({ lightboxImages: images, lightboxIndex: index }),
  clearLightbox: () => set({ lightboxImages: [], lightboxIndex: 0 }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  priceAlertsOpen: false,
  setPriceAlertsOpen: (open) => set({ priceAlertsOpen: open }),
})