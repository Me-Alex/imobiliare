'use client'

import { useCallback, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { hydrateCoinsState } from '@/store/slices/coins'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { CircleDollarSign } from 'lucide-react'

// ─── Hook to hydrate coins on first render (call in AppContent) ────────

export function useCoinsHydration() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || typeof window === 'undefined') return
    hydrateCoinsState((partial) => useAppStore.setState(partial), user?.id ?? null)
  }, [loading, user?.id])
}

// ─── Hook for triggering coin earning from anywhere ────────────────────

export function useCoinActions() {
  const { earnCoins, balance } = useAppStore()
  const { user } = useAuth()

  const earn = useCallback(
    (type: Parameters<typeof earnCoins>[0], description: string, relatedId?: string, silent = false) => {
      if (!user) return 0
      const earned = earnCoins(type, description, relatedId)
      if (earned > 0 && !silent) {
        toast.success(`+${earned} monede!`, {
          description,
          icon: <CircleDollarSign className="h-4 w-4 text-amber-500" />,
          duration: 2500,
        })
      }
      return earned
    },
    [earnCoins, user],
  )

  const onViewProperty = useCallback(
    (propertyId: string, propertyTitle: string) => {
      if (!user) return 0
      // Only earn once per property per session
      const viewed = useAppStore.getState().earnedPropertyIds
      if (viewed.has(propertyId)) return 0
      viewed.add(propertyId)
      return earn('view_property', `Vizualizare: ${propertyTitle}`, propertyId, true) // silent
    },
    [earn, user],
  )

  const onFavorite = useCallback(
    (propertyTitle: string) => {
      return earn('favorite', `Favorit nou: ${propertyTitle}`)
    },
    [earn],
  )

  const onContactForm = useCallback(() => {
    return earn('contact_form', 'Mesaj de contact trimis')
  }, [earn])

  const onBookViewing = useCallback(
    (propertyTitle: string) => {
      return earn('book_viewing', `Vizionare programata: ${propertyTitle}`)
    },
    [earn],
  )

  const onNewsletter = useCallback(() => {
    return earn('newsletter', 'Abonare newsletter')
  }, [earn])

  const onAddProperty = useCallback(() => {
    return earn('add_property', 'Proprietate adaugata')
  }, [earn])

  const onSaveSearch = useCallback(() => {
    return earn('save_search', 'Cautare salvata')
  }, [earn])

  const onPriceAlert = useCallback(() => {
    return earn('price_alert', 'Alerta de pret setata')
  }, [earn])

  return {
    earn,
    onViewProperty,
    onFavorite,
    onContactForm,
    onBookViewing,
    onNewsletter,
    onAddProperty,
    onSaveSearch,
    onPriceAlert,
    balance,
  }
}
