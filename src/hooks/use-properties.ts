import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  getProperties,
  getAllProperties,
  getPropertiesPaginated,
  getPropertyBySlug,
  getMarketData,
  getZones,
  getSearchSuggestions,
  getPropertiesByIds,
} from '@/lib/api'
import type { PropertyFilters } from '@/lib/types'
import type { Property } from '@/lib/types'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export type { PropertyFilters } from '@/lib/types'

export function useProperties(filters: PropertyFilters = {}, options: { enabled?: boolean; allPages?: boolean } = {}) {
  const search = useDebouncedValue(filters.search)
  const queryFilters = { ...filters, search }
  return useQuery({
    queryKey: [options.allPages ? 'properties-all' : 'properties', queryFilters],
    queryFn: () => options.allPages ? getAllProperties(queryFilters) : getProperties(queryFilters),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  })
}

export function usePropertiesPaginated(filters: PropertyFilters = {}) {
  const search = useDebouncedValue(filters.search)
  const queryFilters = { ...filters, search }
  return useInfiniteQuery({
    queryKey: ['properties-paginated', queryFilters],
    queryFn: ({ pageParam }) => getPropertiesPaginated(queryFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 30_000,
  })
}

export function useProperty(slug: string | null, initialData?: Property) {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: () => getPropertyBySlug(slug!),
    enabled: !!slug,
    initialData,
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
