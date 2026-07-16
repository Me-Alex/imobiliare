'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AnnouncementBanner } from '@/components/layout/announcement-banner'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { CookieConsent } from '@/components/layout/cookie-consent'
import { BackToTop } from '@/components/layout/back-to-top'
import { GalleryLightbox } from '@/components/dialogs/gallery-lightbox'
import { FavoritesPanel } from '@/components/panels/favorites-panel'
import { PriceAlertsPanel } from '@/components/panels/price-alerts-panel'
import { SavedSearchesPanel } from '@/components/panels/saved-searches-panel'
import { NotificationsPanel } from '@/components/panels/notifications-panel'
import { AuthProvider } from '@/contexts/auth-context'
import { useCoinsHydration } from '@/hooks/use-coin-actions'
import { useAppStore } from '@/store/use-app-store'
import { PropertyPage } from '@/views/property-page'
import type { Property } from '@/lib/types'

interface PropertyRouteClientProps {
  property: Property
}

function PropertyRouteContent({ property }: PropertyRouteClientProps) {
  useCoinsHydration()
  const [navigationReady, setNavigationReady] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [priceAlertsOpen, setPriceAlertsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false)
  const {
    currentPage,
    lightboxImages,
    lightboxIndex,
    clearLightbox,
  } = useAppStore()

  useEffect(() => {
    useAppStore.setState({ currentPage: 'proprietate', selectedPropertySlug: property.slug })
    const readyTimer = window.setTimeout(() => setNavigationReady(true), 0)
    return () => window.clearTimeout(readyTimer)
  }, [property.slug])

  useEffect(() => {
    if (!navigationReady) return
    if (currentPage !== 'proprietate') {
      const destination = currentPage === 'acasa' ? '/' : `/?page=${encodeURIComponent(currentPage)}`
      window.location.assign(destination)
    }
  }, [currentPage, navigationReady])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">Treci la conținutul principal</a>
      <AnnouncementBanner />
      <SiteHeader
        onOpenFavorites={() => setFavoritesOpen(true)}
        onOpenPriceAlerts={() => setPriceAlertsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenSavedSearches={() => setSavedSearchesOpen(true)}
      />
      <main id="main-content">
        <PropertyPage initialSlug={property.slug} initialProperty={property} standalone />
      </main>
      <SiteFooter />
      <FavoritesPanel open={favoritesOpen} onOpenChange={setFavoritesOpen} />
      <PriceAlertsPanel open={priceAlertsOpen} onOpenChange={setPriceAlertsOpen} />
      <NotificationsPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <SavedSearchesPanel open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen} />
      <GalleryLightbox
        key={lightboxImages.join(',')}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxImages.length > 0}
        onClose={clearLightbox}
      />
      <CookieConsent />
      <Toaster richColors position="bottom-right" />
      <BackToTop />
    </div>
  )
}

export function PropertyRouteClient({ property }: PropertyRouteClientProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PropertyRouteContent property={property} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
