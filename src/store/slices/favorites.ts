import type { StateCreator } from 'zustand'

export interface FavoritesSlice {
  favorites: string[]
  compareList: string[]
  toggleFavorite: (id: string) => void
  toggleCompare: (id: string) => void
}

export const createFavoritesSlice: StateCreator<FavoritesSlice> = (set, get) => ({
  favorites: [],
  compareList: [],
  toggleFavorite: (id) => {
    const wasFav = get().favorites.includes(id)
    set((state) => ({
      favorites: wasFav
        ? state.favorites.filter((fid) => fid !== id)
        : [...state.favorites, id],
    }))
  },
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
})
