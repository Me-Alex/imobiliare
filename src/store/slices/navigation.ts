import type { StateCreator } from 'zustand'

export type PageKey =
  | 'acasa' | 'proprietati' | 'analiza' | 'zone' | 'de-ce-noi' | 'calculator'
  | 'login' | 'admin' | 'adauga-proprietate' | 'dashboard'
  | 'programare-vizionare' | 'disponibilitate-staff' | 'vizionarile-mele' | 'documente'
  | 'evaluare' | 'profil' | 'monede' | 'proprietate'
  | 'deal-room' | 'crm' | 'owner-dashboard'

export interface NavigationSlice {
  currentPage: PageKey
  navigateTo: (page: PageKey) => void
}

export const PAGE_KEYS: readonly PageKey[] = [
  'acasa', 'proprietati', 'analiza', 'zone', 'de-ce-noi', 'calculator',
  'login', 'admin', 'adauga-proprietate', 'dashboard', 'programare-vizionare',
  'disponibilitate-staff', 'vizionarile-mele', 'documente', 'evaluare', 'profil',
  'monede', 'proprietate', 'deal-room', 'crm', 'owner-dashboard',
]

export function isPageKey(value: string | null): value is PageKey {
  return Boolean(value && PAGE_KEYS.includes(value as PageKey))
}

const CANONICAL_PAGE_PATHS: Partial<Record<PageKey, string>> = {
  acasa: '/',
  proprietati: '/proprietati',
  analiza: '/analiza-piata',
  zone: '/zone',
  evaluare: '/evaluare',
  'de-ce-noi': '/despre-noi',
}

function updateBrowserUrl(page: PageKey) {
  if (typeof window === 'undefined') return

  const canonicalPath = CANONICAL_PAGE_PATHS[page]
  const nextUrl = canonicalPath || `/?page=${encodeURIComponent(page)}`
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
