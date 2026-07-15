import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  getProperties,
  getPropertiesPaginated,
  getPropertyBySlug,
  getMarketData,
  getZones,
  getSearchSuggestions,
  getPropertiesByIds,
} from '@/lib/api'
import type { PropertyFilters } from '@/lib/types'

export type { PropertyFilters } from '@/lib/types'

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => getProperties(filters),
    staleTime: 30_000,
  })
}

export function usePropertiesPaginated(filters: PropertyFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['properties-paginated', filters],
    queryFn: ({ pageParam }) => getPropertiesPaginated(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
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

export function usePropertiesByIds(ids: string[]) {
  return useQuery({
    queryKey: ['properties-compare', ids],
    queryFn: () => getPropertiesByIds(ids),
    enabled: ids.length >= 2,
    staleTime: 30_000,
    retry: 1,
  })
}
