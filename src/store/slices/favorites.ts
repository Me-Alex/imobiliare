import type { StateCreator } from 'zustand'
import { saveToLS, generateId } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'

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
    // Earn coins on new favorite
    if (!wasFav && typeof window !== 'undefined') {
      try {
        const balance = Number(localStorage.getItem(LS_KEYS.COINS_BALANCE) || '0')
        const txs = JSON.parse(localStorage.getItem(LS_KEYS.COINS_TRANSACTIONS) || '[]')
        const newBalance = balance + 3
        txs.unshift({ id: generateId(), type: 'favorite', amount: 3, description: 'Favorit nou adaugat', timestamp: new Date().toISOString(), relatedId: id })
        localStorage.setItem(LS_KEYS.COINS_BALANCE, String(newBalance))
        localStorage.setItem(LS_KEYS.COINS_TRANSACTIONS, JSON.stringify(txs.slice(0, 200)))
        window.dispatchEvent(new CustomEvent('pm-coins-updated', { detail: { balance: newBalance } }))
      } catch { /* ignore */ }
    }
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