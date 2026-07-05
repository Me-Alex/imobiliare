'use client'

import { useState, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { SiteHeader } from '@/components/site-header'
import { FavoritesPanel } from '@/components/favorites-panel'
import { HeroSection } from '@/components/hero-section'
import { StatsSection } from '@/components/stats-section'
import { PropertyFilters } from '@/components/property-filters'
import { PropertyGrid } from '@/components/property-grid'
import { RecentlyViewed } from '@/components/recently-viewed'
import { MarketAnalytics } from '@/components/market-analytics'
import { ZoneCards } from '@/components/zone-cards'
import { TrustSection } from '@/components/trust-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { MortgageCalculator } from '@/components/mortgage-calculator'
import { CtaSection } from '@/components/cta-section'
import { SiteFooter } from '@/components/site-footer'
import { PropertyDetailDialog } from '@/components/property-detail-dialog'
import { PropertyCompare } from '@/components/property-compare'
import { ContactFormDialog } from '@/components/contact-form-dialog'
import { CookieConsent } from '@/components/cookie-consent'
import { useAppStore } from '@/store/use-app-store'
import { Toaster } from 'sonner'
import { BackToTop } from '@/components/back-to-top'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { setSelectedPropertySlug } = useAppStore()
  const [contactOpen, setContactOpen] = useState(false)
  const [contactPropertyTitle, setContactPropertyTitle] = useState('')
  const [favoritesOpen, setFavoritesOpen] = useState(false)

  const handleSelectProperty = useCallback((slug: string) => {
    setSelectedPropertySlug(slug)
  }, [setSelectedPropertySlug])

  const handleContact = useCallback((propertyTitle: string) => {
    setContactPropertyTitle(propertyTitle)
    setContactOpen(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Treci la continutul principal
      </a>
      <AnnouncementBanner />
      <SiteHeader onOpenFavorites={() => setFavoritesOpen(true)} />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <StatsSection />
        <hr className="section-divider" />
        <RecentlyViewed />
        <div id="proprietati" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-3xl font-bold tracking-tight">Proprietati Disponibile</h2>
              <p className="text-muted-foreground mt-2">Exploreaza cele mai bune oferte din Bucuresti.</p>
            </div>
            <PropertyFilters />
            <div className="mt-6">
              <PropertyGrid onSelectProperty={handleSelectProperty} />
            </div>
          </div>
        </div>
        <hr className="section-divider" />
        <MarketAnalytics />
        <hr className="section-divider" />
        <ZoneCards />
        <hr className="section-divider" />
        <TrustSection />
        <hr className="section-divider" />
        <TestimonialsSection />
        <hr className="section-divider" />
        <MortgageCalculator />
        <CtaSection />
      </main>
      <SiteFooter />
      <PropertyDetailDialog onContact={handleContact} />
      <PropertyCompare />
      <ContactFormDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyTitle={contactPropertyTitle}
      />
      <FavoritesPanel open={favoritesOpen} onOpenChange={setFavoritesOpen} />
      <CookieConsent />
      <Toaster richColors position="bottom-right" />
      <BackToTop />
    </div>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  )
}