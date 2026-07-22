import type { PageKey } from '@/store/slices/navigation'

export const CANONICAL_PAGE_PATHS: Partial<Record<PageKey, string>> = {
  acasa: '/',
  proprietati: '/proprietati',
  analiza: '/analiza-piata',
  zone: '/zone',
  servicii: '/servicii',
  evaluare: '/evaluare',
  'de-ce-noi': '/despre-noi',
}
export const PATH_PAGE_MAP: Readonly<Record<string, PageKey>> = Object.fromEntries(
  Object.entries(CANONICAL_PAGE_PATHS).map(([page, path]) => [path, page as PageKey]),
) as Record<string, PageKey>

export function getPageDestination(page: PageKey): string {
  return CANONICAL_PAGE_PATHS[page] || `/?page=${encodeURIComponent(page)}`
}
