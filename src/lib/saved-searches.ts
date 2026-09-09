import { LS_KEYS } from '@/lib/constants'
import { restorePriceRange } from '@/lib/property-price-range'
import type { SavedSearch } from '@/lib/types'

export const SAVED_SEARCHES_UPDATED = 'pm-saved-searches-updated'
type Filters = SavedSearch['filters']
const types: Record<string, string> = { APARTMENT: 'Apartament', HOUSE: 'Casă', VILLA: 'Vilă', LAND: 'Teren', COMMERCIAL: 'Comercial' }
const sorts: Record<string, string> = { priceAsc: 'Preț crescător', priceDesc: 'Preț descrescător', areaDesc: 'Suprafață descrescătoare', newest: 'Cele mai noi' }
const number = (value: number) => value.toLocaleString('ro-RO')

/** Share the complete description between saving and restoring. */
export function describeSavedSearch(filters: Filters): string[] {
  const labels: string[] = []
  if (filters.transaction) labels.push(filters.transaction === 'RENT' ? 'Închiriere' : 'Vânzare')
  if (filters.selectedType) labels.push(types[filters.selectedType] || filters.selectedType)
  if (filters.selectedZone) labels.push(`Zonă: ${filters.selectedZone}`)
  if (filters.searchQuery?.trim()) labels.push(`Cuvinte: „${filters.searchQuery.trim()}”`)
  if (filters.rooms) labels.push(`${filters.rooms}+ camere`)
  const [min, max] = restorePriceRange(filters.priceRange, filters.priceRangeVersion)
  if (min > 0 && max !== null) labels.push(`Buget: ${number(min)}–${number(max)} €`)
  else if (min > 0) labels.push(`Buget: de la ${number(min)} €`)
  else if (max !== null) labels.push(`Buget: până la ${number(max)} €`)
  if (filters.minArea && filters.maxArea) labels.push(`Suprafață: ${number(Number(filters.minArea))}–${number(Number(filters.maxArea))} m²`)
  else if (filters.minArea) labels.push(`Suprafață: de la ${number(Number(filters.minArea))} m²`)
  else if (filters.maxArea) labels.push(`Suprafață: până la ${number(Number(filters.maxArea))} m²`)
  if (filters.featuredOnly) labels.push('Doar populare')
  if (filters.virtualTourFilter && filters.virtualTourFilter !== 'all') labels.push(filters.virtualTourFilter === 'with' ? 'Cu tur virtual' : 'Fără tur virtual')
  labels.push(`Ordine: ${sorts[filters.sort || ''] || 'Cele mai noi'}`)
  return labels
}

export function savedSearchFilterError(filters: Filters): string | null {
  const [min, max] = restorePriceRange(filters.priceRange, filters.priceRangeVersion)
  if (!Number.isFinite(min) || min < 0 || (max !== null && (!Number.isFinite(max) || max < min))) return 'Corectează bugetul: limita maximă trebuie să fie cel puțin egală cu cea minimă.'
  const minArea = filters.minArea ? Number(filters.minArea) : 0
  const maxArea = filters.maxArea ? Number(filters.maxArea) : null
  if (!Number.isFinite(minArea) || minArea < 0 || (maxArea !== null && (!Number.isFinite(maxArea) || maxArea < minArea))) return 'Corectează suprafața: limita maximă trebuie să fie cel puțin egală cu cea minimă.'
  return null
}

export function readSavedSearches(): SavedSearch[] {
  const raw = window.localStorage.getItem(LS_KEYS.SAVED_SEARCHES)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed) || !parsed.every(isSavedSearch)) throw new Error('Datele căutărilor salvate nu pot fi citite.')
  return parsed
}

function isSavedSearch(value: unknown): value is SavedSearch {
  if (!value || typeof value !== 'object') return false
  const search = value as SavedSearch
  if (typeof search.id !== 'string' || typeof search.name !== 'string' || typeof search.createdAt !== 'string' || !search.filters || typeof search.filters !== 'object') return false
  const f = search.filters
  if (['selectedType', 'selectedZone', 'transaction', 'sort', 'minArea', 'maxArea', 'searchQuery'].some(key => f[key as keyof Filters] !== undefined && typeof f[key as keyof Filters] !== 'string')) return false
  if (f.rooms !== undefined && (typeof f.rooms !== 'number' || !Number.isFinite(f.rooms) || f.rooms < 0)) return false
  if (f.featuredOnly !== undefined && typeof f.featuredOnly !== 'boolean') return false
  if (f.virtualTourFilter !== undefined && !['all', 'with', 'without'].includes(f.virtualTourFilter)) return false
  if (f.priceRange !== undefined && (!Array.isArray(f.priceRange) || f.priceRange.length !== 2 || typeof f.priceRange[0] !== 'number' || (f.priceRange[1] !== null && typeof f.priceRange[1] !== 'number'))) return false
  return true
}

/** Read the latest list for every mutation and notify only after a successful write. */
export function updateSavedSearches(update: (current: SavedSearch[]) => SavedSearch[]): SavedSearch[] {
  const updated = update(readSavedSearches())
  window.localStorage.setItem(LS_KEYS.SAVED_SEARCHES, JSON.stringify(updated))
  window.dispatchEvent(new Event(SAVED_SEARCHES_UPDATED))
  return updated
}

export function restoreDeletedSearches(removed: SavedSearch[]): SavedSearch[] {
  return updateSavedSearches(current => {
    const ids = new Set(current.map(search => search.id))
    return [...removed.filter(search => !ids.has(search.id)), ...current]
  })
}
