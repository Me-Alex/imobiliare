'use client'

import { useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { supabase } from '@/lib/supabase'

export function useCoinsHydration() {
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
    if (!user || !/^[0-9a-f-]{36}$/i.test(propertyId)) return

    const { error } = active
      ? await supabase.from('client_favorites').upsert(
        { user_id: user.id, property_id: propertyId, source: 'portal' },
        { onConflict: 'user_id,property_id', ignoreDuplicates: true },
      )
      : await supabase.from('client_favorites').delete().eq('user_id', user.id).eq('property_id', propertyId)

    if (!error) await refreshCoins()
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
