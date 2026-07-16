'use client'

import { useCallback, useEffect } from 'react'
import { CircleDollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'

export function useCoinsHydration() {
  const { user, loading } = useAuth()
  const hydrateCoins = useAppStore((state) => state.hydrateCoins)

  useEffect(() => {
    if (loading) return
    void hydrateCoins(user?.id ?? null)
  }, [hydrateCoins, loading, user?.id])
}

export function useCoinActions() {
  const earnCoins = useAppStore((state) => state.earnCoins)
  const balance = useAppStore((state) => state.balance)
  const { user } = useAuth()

  const earn = useCallback(
    async (type: Parameters<typeof earnCoins>[0], description: string, relatedId?: string, silent = false) => {
      if (!user) return 0
      try {
        const earned = await earnCoins(type, description, relatedId)
        if (earned > 0 && !silent) {
          toast.success(`+${earned} monede!`, {
            description,
            icon: <CircleDollarSign className="h-4 w-4 text-amber-500" />,
            duration: 2500,
          })
        }
        return earned
      } catch (error) {
        if (!silent) {
          toast.error('Monedele nu au putut fi acordate.', {
            description: error instanceof Error ? error.message : undefined,
          })
        }
        return 0
      }
    },
    [earnCoins, user],
  )

  const onViewProperty = useCallback(
    async (propertyId: string, propertyTitle: string) => {
      if (!user) return 0
      const viewed = useAppStore.getState().earnedPropertyIds
      if (viewed.has(propertyId)) return 0
      try {
        const earned = await earnCoins('view_property', `Vizualizare: ${propertyTitle}`, propertyId)
        viewed.add(propertyId)
        return earned
      } catch {
        return 0
      }
    },
    [earnCoins, user],
  )

  const onFavorite = useCallback(
    (propertyId: string, propertyTitle: string) =>
      earn('favorite', `Favorit nou: ${propertyTitle}`, propertyId),
    [earn],
  )

  const onNewsletter = useCallback(
    () => earn('newsletter', 'Abonare newsletter'),
    [earn],
  )

  const onAddProperty = useCallback(
    (propertyId: string) => earn('add_property', 'Proprietate adăugată', propertyId),
    [earn],
  )

  return {
    earn,
    onViewProperty,
    onFavorite,
    onNewsletter,
    onAddProperty,
    balance,
  }
}
