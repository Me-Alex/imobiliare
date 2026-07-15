'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { hydrateCoinsState } from '@/store/slices/coins'
import { toast } from 'sonner'
import { CircleDollarSign } from 'lucide-react'

// ─── Hook to hydrate coins on first render (call in AppContent) ────────

export function useCoinsHydration() {
  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current || typeof window === 'undefined') return
    hydrated.current = true
    hydrateCoinsState((partial) => useAppStore.setState(partial))
  }, [])
}

// ─── Hook for triggering coin earning from anywhere ────────────────────

export function useCoinActions() {
  const { earnCoins, balance } = useAppStore()

  const earn = useCallback(
    (type: Parameters<typeof earnCoins>[0], description: string, relatedId?: string, silent = false) => {
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
    [earnCoins],
  )

  const onViewProperty = useCallback(
    (propertyId: string, propertyTitle: string) => {
      // Only earn once per property per session
      const viewed = useAppStore.getState().earnedPropertyIds
      if (viewed.has(propertyId)) return 0
      viewed.add(propertyId)
      return earn('view_property', `Vizualizare: ${propertyTitle}`, propertyId, true) // silent
    },
    [earn],
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
