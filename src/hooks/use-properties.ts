import { useQuery } from '@tanstack/react-query'
import {
  getProperties,
  getPropertyBySlug,
  getMarketData,
  getZones,
  getSearchSuggestions,
  type PropertyFilters,
} from '@/lib/api'

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => getProperties(filters),
    staleTime: 30_000,
  })
}

export function useProperty(slug: string | null) {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: () => getPropertyBySlug(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  })
}

export function useMarketData() {
  return useQuery({
    queryKey: ['market-data'],
    queryFn: getMarketData,
    staleTime: 60_000,
  })
}

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: getZones,
    staleTime: 60_000,
  })
}

export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ['search-suggestions', q],
    queryFn: () => getSearchSuggestions(q),
    enabled: q.length >= 2,
    staleTime: 10_000,
  })
}