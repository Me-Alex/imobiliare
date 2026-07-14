import type { StateCreator } from 'zustand'

export type PageKey =
  | 'acasa' | 'proprietati' | 'analiza' | 'zone' | 'de-ce-noi' | 'calculator'
  | 'login' | 'admin' | 'adauga-proprietate' | 'dashboard'
  | 'programare-vizionare' | 'disponibilitate-staff' | 'vizionarile-mele' | 'documente'
  | 'evaluare' | 'profil'

export interface NavigationSlice {
  currentPage: PageKey
  navigateTo: (page: PageKey) => void
}

export const createNavigationSlice: StateCreator<NavigationSlice> = (set) => ({
  currentPage: 'acasa' as PageKey,
  navigateTo: (page) => {
    set({ currentPage: page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
})