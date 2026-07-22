'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  clearAuthCallbackUrl,
  consumeAuthReturnTarget,
  hasAuthReturnTarget,
  isAuthCallbackUrl,
} from '@/lib/auth-return'
import { useAppStore } from '@/store/use-app-store'

export function useAuthReturnRedirect() {
  const { user, profile, loading } = useAuth()
  const currentPage = useAppStore((state) => state.currentPage)
  const navigateTo = useAppStore((state) => state.navigateTo)
  const setVizionareProperty = useAppStore((state) => state.setVizionareProperty)
  const handledUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      handledUserRef.current = null
      return
    }
    if (loading || !profile) return

    const isCallback = isAuthCallbackUrl()
    const hasReturnTarget = hasAuthReturnTarget()
    const shouldResolveReturn = isCallback || hasReturnTarget || currentPage === 'login'
    if (!shouldResolveReturn || handledUserRef.current === user.id) return

    handledUserRef.current = user.id
    const target = consumeAuthReturnTarget() ?? { page: 'dashboard' as const }
    const context = target.context
    const propertyId = context?.vizionarePropertyId || context?.propertyId
    const propertyTitle = context?.vizionarePropertyTitle || context?.propertyTitle

    if (propertyId && propertyTitle) {
      setVizionareProperty(propertyId, propertyTitle)
    }

    clearAuthCallbackUrl()
    navigateTo(target.page)
  }, [currentPage, loading, navigateTo, profile, setVizionareProperty, user])
}
