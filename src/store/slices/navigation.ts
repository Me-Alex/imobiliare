import type { StateCreator } from 'zustand'
import { getPageDestination } from '@/lib/route-config'

export type PageKey =
  | 'acasa' | 'proprietati' | 'analiza' | 'zone' | 'de-ce-noi' | 'calculator'
  | 'login' | 'admin' | 'adauga-proprietate' | 'dashboard'
  | 'programare-vizionare' | 'disponibilitate-staff' | 'vizionarile-mele' | 'documente'
  | 'servicii' | 'evaluare' | 'profil' | 'monede' | 'proprietate'
  | 'deal-room' | 'crm' | 'owner-dashboard'

export interface NavigationSlice {
  currentPage: PageKey
  navigateTo: (page: PageKey) => void
}

export const PAGE_KEYS: readonly PageKey[] = [
  'acasa', 'proprietati', 'analiza', 'zone', 'de-ce-noi', 'calculator',
  'login', 'admin', 'adauga-proprietate', 'dashboard', 'programare-vizionare',
  'disponibilitate-staff', 'vizionarile-mele', 'documente', 'servicii', 'evaluare', 'profil',
  'monede', 'proprietate', 'deal-room', 'crm', 'owner-dashboard',
]

export function isPageKey(value: string | null): value is PageKey {
  return Boolean(value && PAGE_KEYS.includes(value as PageKey))
}

function updateBrowserUrl(page: PageKey) {
  if (typeof window === 'undefined') return

  const next = new URL(getPageDestination(page), window.location.origin)

  // Deal Room and the digital dossier represent the same transaction context.
  // Keep the selected appointment/deal when users move between these two pages.
  if (page === 'deal-room' || page === 'documente') {
    const current = new URL(window.location.href)
    for (const key of ['appointment', 'deal']) {
      const value = current.searchParams.get(key)
      if (value) next.searchParams.set(key, value)
    }
  }

  const nextUrl = `${next.pathname}${next.search}`
  const currentUrl = `${window.location.pathname}${window.location.search}`
  if (nextUrl !== currentUrl) {
    window.history.pushState({ hqsPage: page }, '', nextUrl)
  }
}

export const createNavigationSlice: StateCreator<NavigationSlice> = (set) => ({
  currentPage: 'acasa' as PageKey,
  navigateTo: (page) => {
    set({ currentPage: page })
    updateBrowserUrl(page)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
})
