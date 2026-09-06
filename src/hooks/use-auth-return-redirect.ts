'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    if (!user) return
    if (loading || !profile) return

    const isCallback = isAuthCallbackUrl()
    const hasReturnTarget = hasAuthReturnTarget()
    const shouldResolveReturn = isCallback || hasReturnTarget || currentPage === 'login'
    if (!shouldResolveReturn) return

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
