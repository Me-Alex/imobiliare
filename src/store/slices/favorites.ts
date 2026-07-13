import type { StateCreator } from 'zustand'

export interface FavoritesSlice {
  favorites: string[]
  compareList: string[]
  toggleFavorite: (id: string) => void
  toggleCompare: (id: string) => void
}

export const createFavoritesSlice: StateCreator<FavoritesSlice> = (set) => ({
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
})