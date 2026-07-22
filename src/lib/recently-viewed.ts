import { LS_KEYS } from '@/lib/constants'

const MAX_RECENTLY_VIEWED = 4

export function getRecentlyViewedSlugs(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LS_KEYS.RECENTLY_VIEWED)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
  } catch {
    return []
  }
}

export function rememberRecentlyViewedProperty(slug: string): string[] {
  if (typeof window === 'undefined') return []

  const normalizedSlug = slug.trim()
  const current = getRecentlyViewedSlugs()
  if (!normalizedSlug) return current

  const updated = [normalizedSlug, ...current.filter((item) => item !== normalizedSlug)]
    .slice(0, MAX_RECENTLY_VIEWED)

  try {
    window.localStorage.setItem(LS_KEYS.RECENTLY_VIEWED, JSON.stringify(updated))
  } catch {
    // Browsing with storage disabled must not block access to a property.
  }

  return updated
}

export function clearRecentlyViewedProperties(): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(LS_KEYS.RECENTLY_VIEWED)
  } catch {
    // The in-memory list can still be cleared when storage is unavailable.
  }
}
