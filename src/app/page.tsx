'use client'

import { useState, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { SiteHeader } from '@/components/site-header'
import { FavoritesPanel } from '@/components/favorites-panel'
import { PriceAlertsPanel } from '@/components/price-alerts-panel'
import { HeroSection } from '@/components/hero-section'
import { StatsSection } from '@/components/stats-section'
import { PropertyFilters } from '@/components/property-filters'
import { PropertyGrid } from '@/components/property-grid'
import { RecentlyViewed } from '@/components/recently-viewed'
import { MarketAnalytics } from '@/components/market-analytics'
import { ZoneCards } from '@/components/zone-cards'
import { ZoneMap } from '@/components/zone-map'
import { NeighborhoodInsights } from '@/components/neighborhood-insights'
import { TrustSection } from '@/components/trust-section'
import { HowItWorks } from '@/components/how-it-works'
import { TestimonialsSection } from '@/components/testimonials-section'
import { PartnersSection } from '@/components/partners-section'
import { MortgageCalculator } from '@/components/mortgage-calculator'
import { FaqSection } from '@/components/faq-section'
import { AboutUsSection } from '@/components/about-us-section'
import { CtaSection } from '@/components/cta-section'
import { SiteFooter } from '@/components/site-footer'
import { PropertyDetailDialog } from '@/components/property-detail-dialog'
import { PropertyCompare } from '@/components/property-compare'
import { ContactFormDialog } from '@/components/contact-form-dialog'
import { CookieConsent } from '@/components/cookie-consent'
import { GalleryLightbox } from '@/components/gallery-lightbox'
import { useAppStore } from '@/store/use-app-store'
import { Toaster } from 'sonner'
import { BackToTop } from '@/components/back-to-top'
import { AIChatWidget } from '@/components/ai-chat-widget'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { setSelectedPropertySlug, lightboxImages, lightboxIndex, clearLightbox, chatOpen, setChatOpen } = useAppStore()
  const [contactOpen, setContactOpen] = useState(false)
  const [contactPropertyTitle, setContactPropertyTitle] = useState('')
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [priceAlertsOpen, setPriceAlertsOpen] = useState(false)

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
      <SiteHeader onOpenFavorites={() => setFavoritesOpen(true)} onOpenPriceAlerts={() => setPriceAlertsOpen(true)} />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <StatsSection />
        <hr className="section-divider" />
        <RecentlyViewed />
        <div id="proprietati" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="section-header mb-8 text-center sm:text-left">
              <h2 className="text-3xl font-bold tracking-tight">Proprietati Disponibile</h2>
              <p className="text-muted-foreground mt-2 sm:max-w-none sm:ml-0">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  Exploreaza cele mai bune oferte din Bucuresti.
                </span>
              </p>
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
        <ZoneMap />
        <hr className="section-divider" />
        <NeighborhoodInsights />
        <hr className="section-divider" />
        <TrustSection />
        <hr className="section-divider" />
        <HowItWorks />
        <hr className="section-divider" />
        <TestimonialsSection />
        <hr className="section-divider" />
        <PartnersSection />
        <hr className="section-divider" />
        <MortgageCalculator />
        <hr className="section-divider" />
        <FaqSection />
        <hr className="section-divider" />
        <AboutUsSection />
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
      <PriceAlertsPanel open={priceAlertsOpen} onOpenChange={setPriceAlertsOpen} />
      <CookieConsent />
      <GalleryLightbox
        key={lightboxImages.join(',')}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxImages.length > 0}
        onClose={clearLightbox}
      />
      <Toaster richColors position="bottom-right" />
      <AIChatWidget open={chatOpen} onOpenChange={setChatOpen} />
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