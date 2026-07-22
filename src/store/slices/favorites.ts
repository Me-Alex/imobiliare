import type { StateCreator } from 'zustand'

export interface FavoritesSlice {
  favorites: string[]
  favoritesOwnerId: string | null
  favoritesLoading: boolean
  favoritesError: string | null
  compareList: string[]
  toggleFavorite: (id: string) => void
  setFavorite: (id: string, active: boolean) => void
  startFavoritesHydration: (ownerId: string, cachedFavorites: string[]) => void
  finishFavoritesHydration: (ownerId: string, favorites: string[]) => void
  failFavoritesHydration: (ownerId: string, message: string) => void
  clearFavorites: () => void
  toggleCompare: (id: string) => void
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)]
}

export const createFavoritesSlice: StateCreator<FavoritesSlice> = (set, get) => ({
  favorites: [],
  favoritesOwnerId: null,
  favoritesLoading: false,
  favoritesError: null,
  compareList: [],
  toggleFavorite: (id) => {
    const wasFav = get().favorites.includes(id)
    get().setFavorite(id, !wasFav)
  },
  setFavorite: (id, active) => set((state) => {
    const isFavorite = state.favorites.includes(id)
    if (isFavorite === active) return state

    return {
      favorites: active
        ? [...state.favorites, id]
        : state.favorites.filter((favoriteId) => favoriteId !== id),
      favoritesError: null,
    }
  }),
  startFavoritesHydration: (ownerId, cachedFavorites) => set({
    favorites: uniqueIds(cachedFavorites),
    favoritesOwnerId: ownerId,
    favoritesLoading: true,
    favoritesError: null,
  }),
  finishFavoritesHydration: (ownerId, favorites) => set((state) => {
    if (state.favoritesOwnerId !== ownerId) return state
    return {
      favorites: uniqueIds(favorites),
      favoritesLoading: false,
      favoritesError: null,
    }
  }),
  failFavoritesHydration: (ownerId, message) => set((state) => {
    if (state.favoritesOwnerId !== ownerId) return state
    return { favoritesLoading: false, favoritesError: message }
  }),
  clearFavorites: () => set({
    favorites: [],
    favoritesOwnerId: null,
    favoritesLoading: false,
    favoritesError: null,
  }),
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
