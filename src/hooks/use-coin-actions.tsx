'use client'

import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { LS_KEYS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/use-app-store'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const FAVORITES_CACHE_VERSION = 1
const MAX_CACHED_FAVORITES = 200

interface FavoritesCache {
  version: number
  propertyIds: string[]
}

interface FavoriteMutationQueue {
  desired: boolean
  stable: boolean
  running: Promise<void> | null
  refreshCoins: () => Promise<void>
  sessionVersion: number
  userId: string
  propertyId: string
}

const favoriteMutationQueues = new Map<string, FavoriteMutationQueue>()
const favoriteSessionIntents = new Map<string, boolean>()
let activeFavoritesOwnerId: string | null = null
let activeFavoritesSessionVersion = 0

function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}

function sanitizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return [...new Set(value
    .filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 128)
    .slice(0, MAX_CACHED_FAVORITES))]
}

function favoritesCacheKey(userId: string) {
  return `${LS_KEYS.FAVORITES}:${userId}`
}

function readFavoritesCache(userId: string): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(favoritesCacheKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as FavoritesCache | string[]
    return sanitizeFavoriteIds(Array.isArray(parsed) ? parsed : parsed.propertyIds)
  } catch {
    return []
  }
}

function writeFavoritesCache(userId: string, propertyIds: string[]) {
  if (typeof window === 'undefined') return

  try {
    const payload: FavoritesCache = {
      version: FAVORITES_CACHE_VERSION,
      propertyIds: sanitizeFavoriteIds(propertyIds),
    }
    window.localStorage.setItem(favoritesCacheKey(userId), JSON.stringify(payload))
  } catch {
    // Private browsing and full storage should not break the primary Supabase flow.
  }
}

function beginFavoritesSession(ownerId: string | null) {
  if (activeFavoritesOwnerId === ownerId && ownerId !== null) {
    return activeFavoritesSessionVersion
  }

  activeFavoritesOwnerId = ownerId
  activeFavoritesSessionVersion += 1
  favoriteSessionIntents.clear()
  return activeFavoritesSessionVersion
}

function isCurrentFavoritesSession(userId: string, sessionVersion: number) {
  return activeFavoritesOwnerId === userId
    && activeFavoritesSessionVersion === sessionVersion
    && useAppStore.getState().favoritesOwnerId === userId
}

function applySessionIntents(propertyIds: string[]) {
  const result = new Set(propertyIds)
  favoriteSessionIntents.forEach((active, propertyId) => {
    if (active) result.add(propertyId)
    else result.delete(propertyId)
  })
  return [...result]
}

function mutationQueueKey(userId: string, propertyId: string, sessionVersion: number) {
  return `${sessionVersion}:${userId}:${propertyId}`
}

async function persistFavorite(userId: string, propertyId: string, active: boolean) {
  if (active) {
    return supabase.from('client_favorites').upsert(
      { user_id: userId, property_id: propertyId, source: 'portal' },
      { onConflict: 'user_id,property_id', ignoreDuplicates: true },
    )
  }

  return supabase
    .from('client_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', propertyId)
}

async function processFavoriteQueue(key: string, queue: FavoriteMutationQueue) {
  let shouldRefreshCoins = false

  while (queue.stable !== queue.desired) {
    const target = queue.desired
    let message = ''

    try {
      const { error } = await persistFavorite(queue.userId, queue.propertyId, target)
      message = error?.message ?? ''
    } catch (error) {
      message = error instanceof Error ? error.message : 'Serviciul de favorite nu este disponibil.'
    }

    if (message) {
      // A later click may already have restored the last confirmed state. Only
      // roll back when this failed operation is still the user's latest intent.
      if (queue.desired === target) {
        queue.desired = queue.stable
        if (isCurrentFavoritesSession(queue.userId, queue.sessionVersion)) {
          favoriteSessionIntents.set(queue.propertyId, queue.stable)
          useAppStore.getState().setFavorite(queue.propertyId, queue.stable)
          toast.error('Favoritul nu a putut fi actualizat.', {
            description: 'Am revenit la ultima stare salvată. Încearcă din nou.',
          })
        }
      }
      continue
    }

    queue.stable = target
    shouldRefreshCoins = true
  }

  if (shouldRefreshCoins && isCurrentFavoritesSession(queue.userId, queue.sessionVersion)) {
    await queue.refreshCoins()
  }

  // A click can arrive while the coin balance is refreshing. Reconcile it in
  // the same serialized queue so older requests can never win the race.
  if (queue.stable !== queue.desired) {
    return processFavoriteQueue(key, queue)
  }

  favoriteMutationQueues.delete(key)
}

function enqueueFavoriteMutation(
  userId: string,
  propertyId: string,
  active: boolean,
  refreshCoins: () => Promise<void>,
) {
  const sessionVersion = activeFavoritesSessionVersion
  if (!isCurrentFavoritesSession(userId, sessionVersion)) return Promise.resolve()

  favoriteSessionIntents.set(propertyId, active)
  const key = mutationQueueKey(userId, propertyId, sessionVersion)
  let queue = favoriteMutationQueues.get(key)

  if (!queue) {
    queue = {
      desired: active,
      stable: !active,
      running: null,
      refreshCoins,
      sessionVersion,
      userId,
      propertyId,
    }
    favoriteMutationQueues.set(key, queue)
  } else {
    queue.desired = active
    queue.refreshCoins = refreshCoins
  }

  if (!queue.running) {
    queue.running = processFavoriteQueue(key, queue)
  }
  return queue.running
}

export function useFavoritesHydration() {
  const { user, loading } = useAuth()
  const userId = user?.id ?? null
  const favorites = useAppStore((state) => state.favorites)
  const favoritesOwnerId = useAppStore((state) => state.favoritesOwnerId)
  const startFavoritesHydration = useAppStore((state) => state.startFavoritesHydration)
  const finishFavoritesHydration = useAppStore((state) => state.finishFavoritesHydration)
  const failFavoritesHydration = useAppStore((state) => state.failFavoritesHydration)
  const clearFavorites = useAppStore((state) => state.clearFavorites)

  useEffect(() => {
    if (loading) return

    const sessionVersion = beginFavoritesSession(userId)
    if (!userId) {
      clearFavorites()
      return
    }

    const cachedFavorites = readFavoritesCache(userId)
    startFavoritesHydration(userId, cachedFavorites)
    let cancelled = false

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('client_favorites')
          .select('property_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (cancelled || !isCurrentFavoritesSession(userId, sessionVersion)) return
        if (error) {
          failFavoritesHydration(userId, 'Favoritele salvate nu au putut fi sincronizate.')
          return
        }

        const serverFavorites = sanitizeFavoriteIds(
          (data ?? []).map((row) => row.property_id),
        )
        // Demo listings are not rows in public.properties, so their string IDs
        // remain user-scoped in the local cache while UUID listings come from DB.
        const cachedDemoFavorites = cachedFavorites.filter((propertyId) => !isUuid(propertyId))
        const hydratedFavorites = applySessionIntents([
          ...cachedDemoFavorites,
          ...serverFavorites,
        ])
        finishFavoritesHydration(userId, hydratedFavorites)
        writeFavoritesCache(userId, hydratedFavorites)
      } catch {
        if (!cancelled && isCurrentFavoritesSession(userId, sessionVersion)) {
          failFavoritesHydration(userId, 'Favoritele salvate nu au putut fi sincronizate.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    clearFavorites,
    failFavoritesHydration,
    finishFavoritesHydration,
    loading,
    startFavoritesHydration,
    userId,
  ])

  useEffect(() => {
    if (favoritesOwnerId) writeFavoritesCache(favoritesOwnerId, favorites)
  }, [favorites, favoritesOwnerId])
}

export function useCoinsHydration() {
  useFavoritesHydration()
  const { user, loading } = useAuth()
  const hydrateCoins = useAppStore((state) => state.hydrateCoins)

  useEffect(() => {
    if (loading) return
    void hydrateCoins(user?.id ?? null)
  }, [hydrateCoins, loading, user?.id])
}

export function useCoinActions() {
  const refreshCoins = useAppStore((state) => state.refreshCoins)
  const { user } = useAuth()

  const syncFavorite = useCallback(async (propertyId: string, active: boolean) => {
    if (!user || !isUuid(propertyId)) return
    await enqueueFavoriteMutation(user.id, propertyId, active, refreshCoins)
  }, [refreshCoins, user])

  const onFavorite = useCallback(
    (propertyId: string) => syncFavorite(propertyId, true),
    [syncFavorite],
  )

  const onUnfavorite = useCallback(
    (propertyId: string) => syncFavorite(propertyId, false),
    [syncFavorite],
  )

  return {
    onFavorite,
    onUnfavorite,
  }
}
