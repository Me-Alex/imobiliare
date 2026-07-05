'use client'

import { useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { SiteHeader } from '@/components/site-header'
import { HeroSection } from '@/components/hero-section'
import { StatsSection } from '@/components/stats-section'
import { PropertyFilters } from '@/components/property-filters'
import { PropertyGrid } from '@/components/property-grid'
import { MarketAnalytics } from '@/components/market-analytics'
import { ZoneCards } from '@/components/zone-cards'
import { SiteFooter } from '@/components/site-footer'
import { PropertyDetailDialog } from '@/components/property-detail-dialog'
import { useAppStore } from '@/store/use-app-store'
import { Toaster } from 'sonner'

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

  const handleSelectProperty = useCallback((slug: string) => {
    setSelectedPropertySlug(slug)
  }, [setSelectedPropertySlug])

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Treci la continutul principal
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <StatsSection />
        <div className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Proprietati Disponibile</h2>
              <p className="text-muted-foreground mt-2">Exploreaza cele mai bune oferte din Bucuresti.</p>
            </div>
            <PropertyFilters />
            <div className="mt-6">
              <PropertyGrid onSelectProperty={handleSelectProperty} />
            </div>
          </div>
        </div>
        <MarketAnalytics />
        <ZoneCards />
      </main>
      <SiteFooter />
      <PropertyDetailDialog />
      <Toaster richColors position="bottom-right" />
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